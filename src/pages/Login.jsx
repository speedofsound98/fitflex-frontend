// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import AuthShell, { inputClass } from '../components/AuthShell';
import usePageTitle from '../hooks/usePageTitle';

export default function Login() {
  usePageTitle('Log in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('userName', data.user.name || 'User');
      localStorage.setItem('userRole', data.user.role || 'user');
      localStorage.setItem('userId', data.user.id);
      if (data.token) localStorage.setItem('authToken', data.token);
      const dest = data.user.role === 'studio' ? '/studio' : '/dashboard';
      navigate(dest);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to FitFlex"
      subtitle="Book classes, manage your studio, and track your progress."
      footer={<>New here? <Link to="/signup" className="text-brand-600 font-semibold hover:underline">Create an account</Link></>}
    >
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-700 text-sm rounded-2xl px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      <form className="flex flex-col gap-4" onSubmit={handleLogin}>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
          <input type="email" placeholder="you@example.com" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-ink-700">Password</label>
            <Link to="/forgot" className="text-xs text-brand-600 font-semibold hover:underline">Forgot?</Link>
          </div>
          <input type="password" placeholder="••••••••" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 text-white py-3 rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}
