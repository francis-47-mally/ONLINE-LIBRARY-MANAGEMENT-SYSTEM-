require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const SECRET = process.env.JWT_SECRET || 'change_this_secret';
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'olms.sqlite');
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);

const db = new Database(dbPath);
const app = express();
app.use(cors());
app.use(bodyParser.json());

// helpers
const run = (sql, params=[]) => db.prepare(sql).run(...params);
const all = (sql, params=[]) => db.prepare(sql).all(...params);
const get = (sql, params=[]) => db.prepare(sql).get(...params);

// auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function roleCheck(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// --- Auth routes ---
app.post('/api/auth/register', async (req, res) => {
  const { username, password, role='member', email } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const existing = get('SELECT * FROM users WHERE username = ?', [username]);
  if (existing) return res.status(400).json({ error: 'username already exists' });
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const info = run('INSERT INTO users (username,password_hash,role,email) VALUES (?,?,?,?)', [username, hash, role, email]);
  const user = get('SELECT user_id, username, role, email FROM users WHERE user_id = ?', [info.lastInsertRowid]);
  res.json({ success:true, user });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ user_id: user.user_id, role: user.role, username: user.username }, SECRET, { expiresIn: '8h' });
  res.json({ token, user: { user_id: user.user_id, username: user.username, role: user.role, email: user.email } });
});

// --- Books ---
app.get('/api/books', authMiddleware, (req,res) => {
  const q = req.query.q;
  if (q) {
    const like = '%' + q + '%';
    return res.json(all('SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ? OR genre LIKE ? ORDER BY title', [like,like,like,like]));
  }
  res.json(all('SELECT * FROM books ORDER BY title'));
});

app.get('/api/books/:id', authMiddleware, (req,res) => {
  const b = get('SELECT * FROM books WHERE book_id=?',[req.params.id]);
  if(!b) return res.status(404).json({ error:'Not found'});
  res.json(b);
});

app.post('/api/books', authMiddleware, roleCheck(['librarian','admin']), (req,res) => {
  const { title, author, isbn, genre, publisher, published_year, total_copies } = req.body;
  const info = run('INSERT INTO books (title,author,isbn,genre,publisher,published_year,total_copies,available_copies) VALUES (?,?,?,?,?,?,?,?)',
    [title,author,isbn,genre,publisher,published_year || null,total_copies || 1, total_copies || 1]);
  res.json({ success:true, book: get('SELECT * FROM books WHERE book_id=?',[info.lastInsertRowid]) });
});

app.put('/api/books/:id', authMiddleware, roleCheck(['librarian','admin']), (req,res) => {
  const id = req.params.id;
  const { title, author, isbn, genre, publisher, published_year, total_copies, available_copies } = req.body;
  run('UPDATE books SET title=?,author=?,isbn=?,genre=?,publisher=?,published_year=?,total_copies=?,available_copies=? WHERE book_id=?',
      [title,author,isbn,genre,publisher,published_year,total_copies,available_copies,id]);
  res.json({ success:true, book: get('SELECT * FROM books WHERE book_id=?',[id]) });
});

app.delete('/api/books/:id', authMiddleware, roleCheck(['librarian','admin']), (req,res) => {
  run('DELETE FROM books WHERE book_id=?',[req.params.id]);
  res.json({ success:true });
});

// --- Members ---
app.get('/api/members', authMiddleware, roleCheck(['librarian','admin']), (req,res) => {
  res.json(all('SELECT * FROM members ORDER BY name'));
});

app.post('/api/members', authMiddleware, roleCheck(['librarian','admin']), (req,res) => {
  const { name, email, membership_id, phone, address } = req.body;
  const info = run('INSERT INTO members (name,email,membership_id,phone,address) VALUES (?,?,?,?,?)',[name,email,membership_id,phone,address]);
  res.json({ success:true, member: get('SELECT * FROM members WHERE member_id=?',[info.lastInsertRowid]) });
});

app.put('/api/members/:id', authMiddleware, roleCheck(['librarian','admin']), (req,res) => {
  const id = req.params.id;
  const { name, email, membership_id, phone, address, status } = req.body;
  run('UPDATE members SET name=?,email=?,membership_id=?,phone=?,address=?,status=? WHERE member_id=?',[name,email,membership_id,phone,address,status,id]);
  res.json({ success:true, member: get('SELECT * FROM members WHERE member_id=?',[id]) });
});

app.delete('/api/members/:id', authMiddleware, roleCheck(['librarian','admin']), (req,res) => {
  run('DELETE FROM members WHERE member_id=?',[req.params.id]);
  res.json({ success:true });
});

// --- Transactions ---
app.post('/api/transactions/borrow', authMiddleware, roleCheck(['member','librarian','admin']), (req,res) => {
  const { book_id, member_id } = req.body;
  const book = get('SELECT * FROM books WHERE book_id=?',[book_id]);
  if (!book) return res.status(404).json({ error:'Book not found' });
  if (book.available_copies < 1) return res.status(400).json({ error:'No available copies' });
  const borrowDate = new Date().toISOString().slice(0,10);
  const dueDate = new Date(Date.now() + 14*24*3600*1000).toISOString().slice(0,10); // 14 days
  run('INSERT INTO transactions (book_id, member_id, tx_type, borrow_date, due_date, status) VALUES (?,?,?,?,?,?)', [book_id, member_id, 'borrow', borrowDate, dueDate, 'open']);
  run('UPDATE books SET available_copies = available_copies - 1 WHERE book_id=?',[book_id]);
  res.json({ success:true, message:'Book borrowed', borrow_date: borrowDate, due_date: dueDate });
});

app.post('/api/transactions/return', authMiddleware, roleCheck(['member','librarian','admin']), (req,res) => {
  const { book_id, member_id } = req.body;
  const tx = get('SELECT * FROM transactions WHERE book_id=? AND member_id=? AND status="open" ORDER BY borrow_date LIMIT 1', [book_id, member_id]);
  if (!tx) return res.status(404).json({ error:'Open borrow transaction not found' });
  const returnDate = new Date().toISOString().slice(0,10);
  // compute fine
  let fine = 0;
  if (tx.due_date && new Date(returnDate) > new Date(tx.due_date)) {
    const msPerDay = 24*3600*1000;
    const daysLate = Math.ceil((new Date(returnDate) - new Date(tx.due_date))/msPerDay);
    fine = daysLate * 1.0; // 1 currency unit per day
  }
  run('UPDATE transactions SET return_date=?, status="closed", fine=? WHERE tx_id=?', [returnDate, fine, tx.tx_id]);
  run('UPDATE books SET available_copies = available_copies + 1 WHERE book_id=?',[book_id]);
  res.json({ success:true, message:'Book returned', return_date: returnDate, fine });
});

app.get('/api/transactions', authMiddleware, (req,res) => {
  const member_id = req.query.member_id;
  if (member_id) {
    return res.json(all('SELECT * FROM transactions WHERE member_id=? ORDER BY borrow_date DESC',[member_id]));
  }
  res.json(all('SELECT * FROM transactions ORDER BY borrow_date DESC'));
});

// --- Reports ---
app.get('/api/reports/inventory', authMiddleware, roleCheck(['librarian','admin']), (req,res) => {
  res.json(all('SELECT title,author,isbn,total_copies,available_copies FROM books ORDER BY title'));
});

app.get('/api/reports/borrowing-trends', authMiddleware, roleCheck(['librarian','admin']), (req,res) => {
  const rows = all(`SELECT substr(borrow_date,1,7) as month, COUNT(*) as borrows FROM transactions WHERE tx_type='borrow' GROUP BY month ORDER BY month`);
  res.json(rows);
});

// health
app.get('/api/health', (req,res) => res.json({ ok:true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('OLMS backend listening on port', PORT);
  console.log('DB file:', dbPath);
});
