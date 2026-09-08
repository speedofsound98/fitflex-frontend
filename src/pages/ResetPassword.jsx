// src/pages/ResetPassword.jsx
import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthShell, { inputClass } from '../components/AuthShell';
import usePageTitle from '../hooks/usePageTitle';

export default function ResetPassword() {
  const { t } = useTranslation();
  usePageTitle('Reset password');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidPassword = (p) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(p);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (password !== confirm) return setError(t('auth.pwNoMatch'));
    if (!isValidPassword(password)) return setError(t('auth.pwWeak'));
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL.replace(/\/api$/, '');
      const res = await fetch(`${base}/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setMessage(t('auth.resetSuccess'));
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow={t('auth.passwordHelp')}
      title={t('auth.setNewTitle')}
      subtitle={t('auth.setNewSubtitle')}
      footer={<><Link to="/login" className="text-brand-600 font-semibold hover:underline">{t('auth.backToLogin')}</Link></>}
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
          <label className="block text-sm font-medium text-ink-700 mb-1.5">{t('auth.newPassword')}</label>
          <input type="password" placeholder="••••••••" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">{t('auth.confirmPassword')}</label>
          <input type="password" placeholder="••••••••" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 text-white py-3 rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill disabled:opacity-60"
        >
          {loading ? t('auth.resetting') : t('auth.resetPassword')}
        </button>
      </form>
    </AuthShell>
  );
}
