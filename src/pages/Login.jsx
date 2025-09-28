// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/NavBar";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('userName', data.user?.name || data.user?.email || 'User');
      localStorage.setItem('userRole', data.user?.role || 'user');
      localStorage.setItem('userId', String(data.user?.id || ''));
      if (data.user?.role === 'studio') {
        navigate('/studio');
      } else {
      navigate('/dashboard');
      }
    } catch (e2) {
      console.error(e2);
      setErr(e2.message);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" className="border p-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="border p-2" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <button type="submit" className="bg-blue-500 text-white p-2">Log In</button>
        </form>
      </div>
    </div>
  );
}
