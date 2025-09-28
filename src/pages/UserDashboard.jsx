// src/pages/UserDashboard.jsx
import React, { useEffect, useState } from 'react';

export default function UserDashboard() {
  const userName = localStorage.getItem('userName') || 'User';
  const userId = localStorage.getItem('userId');

  const [classes, setClasses] = useState([]);
  const [msg, setMsg] = useState('');
  const api = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // list classes for browsing
    fetch(`${api}/classes`)
      .then(r => r.json())
      .then(d => setClasses(d.classes || []))
      .catch(() => {});
  }, [api]);

  async function book(classId) {
    setMsg('');
    try {
      const res = await fetch(`${api}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: Number(userId), class_id: Number(classId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setMsg('Booked! 🎉');
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>User Dashboard</h1>
      <p>Welcome, <strong>{userName}</strong></p>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}

      <h2 style={{ marginTop: 16 }}>Available classes</h2>
      {classes.length === 0 ? (
        <p>No classes yet.</p>
      ) : (
        <ul>
          {classes.map(c => (
            <li key={c.id} style={{ margin: '8px 0' }}>
              <strong>{c.name}</strong> — {new Date(c.datetime).toLocaleString()}
              {' · '}credits: {c.credit_cost}
              {' '}<button onClick={() => book(c.id)} style={{ marginLeft: 8 }}>Book</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
