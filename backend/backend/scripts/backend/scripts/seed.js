const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '..', '..', 'olms.sqlite');
const db = new Database(dbPath);
console.log('Seeding demo data...');
db.exec(`INSERT INTO books (title,author,isbn,genre,total_copies,available_copies) VALUES
('The Pragmatic Programmer','Andrew Hunt','9780201616224','Programming',3,3),
('Clean Code','Robert C. Martin','9780132350884','Programming',2,2),
('Introduction to Algorithms','CLRS','9780262033848','Algorithms',1,1);`);
db.exec(`INSERT INTO members (name,email,membership_id,phone,address) VALUES
('Alice','alice@example.com','M001','+111111','City A'),
('Bob','bob@example.com','M002','+222222','City B');`);
console.log('Seeded books and members.');
