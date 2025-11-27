import React, { useState } from 'react';
import axios from 'axios';

export default function Login({ onAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      onAuth(res.data.token, res.data.user);
    } catch (err) {
      setErr(err.response?.data?.error || err.message);
    }
  }

  return (
    <div style={{ maxWidth:400, margin:'50px auto' }}>
      <h3>Login</h3>
      <form onSubmit={submit}>
        <div><input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} /></div>
        <div style={{ marginTop:8 }}><input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <div style={{ marginTop:8 }}><button>Login</button></div>
      </form>
      {err && <div style={{ color:'red' }}>{err}</div>}
      <div style={{ marginTop:10, fontSize:12 }}>Seeded admin: <code>admin / adminpass</code></div>
    </div>
  );
}
