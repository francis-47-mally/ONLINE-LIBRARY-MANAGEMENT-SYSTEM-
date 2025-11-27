import React, { useEffect, useState } from 'react';
import axios from 'axios';
export default function Transactions({ user }) {
  const [tx, setTx] = useState([]);
  async function load(){ const res = await axios.get('/api/transactions'); setTx(res.data); }
  useEffect(()=>{ load(); }, []);
  return (
    <div>
      <h3>Transactions</h3>
      <table border="1" cellPadding="6"><thead><tr><th>TX ID</th><th>Book ID</th><th>Member ID</th><th>Type</th><th>Borrow Date</th><th>Due</th><th>Return</th><th>Status</th></tr></thead>
        <tbody>{tx.map(t=> <tr key={t.tx_id}><td>{t.tx_id}</td><td>{t.book_id}</td><td>{t.member_id}</td><td>{t.tx_type}</td><td>{t.borrow_date}</td><td>{t.due_date}</td><td>{t.return_date}</td><td>{t.status}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
