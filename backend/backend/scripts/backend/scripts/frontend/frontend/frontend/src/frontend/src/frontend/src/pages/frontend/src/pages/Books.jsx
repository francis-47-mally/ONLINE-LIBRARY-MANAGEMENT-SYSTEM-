import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Books({ user }) {
  const [books, setBooks] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState('');

  async function load() {
    const res = await axios.get('/api/books' + (q ? '?q=' + encodeURIComponent(q) : ''));
    setBooks(res.data);
  }
  useEffect(()=> { load(); }, []);

  async function save(e) {
    e.preventDefault();
    if (form.book_id) {
      await axios.put('/api/books/' + form.book_id, form);
      setMsg('Updated');
    } else {
      await axios.post('/api/books', form);
      setMsg('Added');
    }
    setForm(null);
    load();
  }

  async function borrow(b) {
    const member_id = prompt('Enter your member_id to borrow (example: 1)');
    if (!member_id) return;
    await axios.post('/api/transactions/borrow', { book_id: b.book_id, member_id });
    alert('Borrowed');
    load();
  }

  return (
    <div>
      <h3>Books</h3>
      <div style={{ marginBottom:10 }}>
        <input placeholder="search" value={q} onChange={e=>setQ(e.target.value)} />
        <button onClick={load}>Search</button>
        {user?.role !== 'member' && <button onClick={()=>setForm({ title:'', author:'', isbn:'', genre:'', total_copies:1 })}>Add Book</button>}
      </div>
      {msg && <div style={{ color:'green' }}>{msg}</div>}
      {form && <form onSubmit={save} style={{ marginBottom:10 }}>
        <input placeholder="title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} /><br/>
        <input placeholder="author" value={form.author} onChange={e=>setForm({...form, author:e.target.value})} /><br/>
        <input placeholder="isbn" value={form.isbn} onChange={e=>setForm({...form, isbn:e.target.value})} /><br/>
        <input placeholder="genre" value={form.genre} onChange={e=>setForm({...form, genre:e.target.value})} /><br/>
        <input placeholder="total_copies" type="number" value={form.total_copies} onChange={e=>setForm({...form, total_copies:parseInt(e.target.value||0)})} /><br/>
        <button type="submit">Save</button> <button type="button" onClick={()=>setForm(null)}>Cancel</button>
      </form>}
      <table border="1" cellPadding="6">
        <thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th>Genre</th><th>Total</th><th>Available</th><th>Actions</th></tr></thead>
        <tbody>
          {books.map(b => <tr key={b.book_id}>
            <td>{b.title}</td><td>{b.author}</td><td>{b.isbn}</td><td>{b.genre}</td><td>{b.total_copies}</td><td>{b.available_copies}</td>
            <td>
              {user?.role !== 'member' && <button onClick={()=>setForm(b)}>Edit</button>}
              <button onClick={()=>borrow(b)}>Borrow</button>
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}
