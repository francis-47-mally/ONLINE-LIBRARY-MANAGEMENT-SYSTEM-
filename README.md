# ONLINE-LIBRARY-MANAGEMENT-SYSTEM-

A simple full-stack application that helps librarians manage books, members, and borrowing transactions, while allowing members to search, borrow, and return books.

Features
Book management (add, edit, delete)
Member management
Borrow & return transactions
Search books by title, author, genre, ISBN
Login system with JWT authentication
Admin/Librarian/Member roles
Borrowing history & reports 

Tech Stack
Frontend: React (Vite), Axios
Backend: Node.js, Express, SQLite
Auth: JWT + bcrypt

How to Run
Backend
cd backend
npm install
node scripts/migrate.js
node scripts/seed.js
npm run dev

Frontend
cd frontend
npm install
npm run dev

Default Login
username: admin
password: adminpass
