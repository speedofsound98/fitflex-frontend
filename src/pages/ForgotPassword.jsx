// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthShell, { inputClass } from '../components/AuthShell';
import usePageTitle from '../hooks/usePageTitle';

export default function ForgotPassword() {
  usePageTitle('Forgot password');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL.replace(/\/api$/, '');
      const res = await fetch(`${base}/auth/request-password-reset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setMessage('If this email exists, a reset link has been sent. Check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Password help"
      title="Forgot your password?"
      subtitle="Enter your email and we’ll send you a reset link."
      footer={<><Link to="/login" className="text-brand-600 font-semibold hover:underline">Back to log in</Link></>}
    >
      {message && (
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm rounded-2xl px-4 py-3 mb-4">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-700 text-sm rounded-2xl px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
          <input type="email" placeholder="you@example.com" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 text-white py-3 rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthShell>
  );
}
