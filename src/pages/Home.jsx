// src/pages/Home.jsx
import React, { useEffect } from 'react';

export default function Home() {
  // Optional: ping the backend so you can see it's reachable in the console
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL; // e.g. http://localhost:3000/api
    if (!base) return;
    fetch(`${base}/ping`)
      .then(r => r.json())
      .then(d => console.log('✅ backend ping:', d))
      .catch(e => console.error('❌ backend ping failed:', e));
  }, []);

  const userName = localStorage.getItem('userName');
  const userRole = localStorage.getItem('userRole');

  return (
    <div style={{ padding: 24 }}>
      <h1>Welcome to FitFlex</h1>
      {userName ? (
        <p>You are signed in as <strong>{userName}</strong> ({userRole || 'user'})</p>
      ) : (
        <p>Please <a href="/signup">sign up</a> or <a href="/login">log in</a>.</p>
      )}

      <div style={{ marginTop: 16 }}>
        <a href="/">Home</a> ·{' '}
        <a href="/signup">Signup</a> ·{' '}
        <a href="/login">Login</a> ·{' '}
        <a href="/studio">Studio Dashboard</a>
      </div>
    </div>
  );
}
