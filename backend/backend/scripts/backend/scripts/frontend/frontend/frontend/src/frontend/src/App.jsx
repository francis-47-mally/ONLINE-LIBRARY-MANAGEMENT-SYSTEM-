import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './pages/Login';
import Books from './pages/Books';
import Members from './pages/Members';
import Transactions from './pages/Transactions';

const API = import.meta.env.VITE_API_BASE || '';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')||'null'));

  useEffect(()=> {
    axios.defaults.baseURL = API;
    if (token) axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    else delete axios.defaults.headers.common['Authorization'];
  }, [token]);

  if (!token) {
    return <Login onAuth={(t,u)=>{ setToken(t); setUser(u); localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); }} />;
  }

  return (
    <div style={{ padding:20, fontFamily:'Arial, sans-serif' }}>
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2>OLMS Dashboard</h2>
        <div>
          <strong>{user?.username}</strong> ({user?.role}) <button onClick={()=>{ localStorage.clear(); setToken(null); setUser(null); }}>Logout</button>
        </div>
      </header>

      <nav style={{ marginTop:10 }}>
        <button onClick={()=>window.location.hash = '#books'}>Books</button>
        <button onClick={()=>window.location.hash = '#members'}>Members</button>
        <button onClick={()=>window.location.hash = '#tx'}>Transactions</button>
      </nav>

      <main style={{ marginTop:20 }}>
        {window.location.hash === '#members' && <Members />}
        {window.location.hash === '#tx' && <Transactions user={user} />}
        {!window.location.hash || window.location.hash === '#books' ? <Books user={user} /> : null}
      </main>
    </div>
  );
}
export default App;
