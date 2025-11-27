import React, { useEffect, useState } from 'react';
import axios from 'axios';
export default function Members() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(null);
  async function load(){ const res = await axios.get('/api/members'); setMembers(res.data); }
  useEffect(()=>{ load(); }, []);
  async function save(e){ e.preventDefault(); if (form.member_id) { await axios.put('/api/members/' + form.member_id, form); } else { await axios.post('/api/members', form); } setForm(null); load(); }
  return (
    <div>
      <h3>Members</h3>
      <button onClick={()=>setForm({ name:'', email:'', membership_id:'M' + Date.now() })}>Add Member</button>
      {form && <form onSubmit={save}><input placeholder="name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /><br/>
        <input placeholder="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /><br/>
        <input placeholder="membership_id" value={form.membership_id} onChange={e=>setForm({...form, membership_id:e.target.value})} /><br/>
        <button>Save</button> <button onClick={()=>setForm(null)}>Cancel</button></form>}
      <table border="1" cellPadding="6"><thead><tr><th>Name</th><th>Email</th><th>Membership ID</th></tr></thead>
        <tbody>{members.map(m=><tr key={m.member_id}><td>{m.name}</td><td>{m.email}</td><td>{m.membership_id}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
