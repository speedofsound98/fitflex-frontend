// src/pages/Signup.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, User, Building2 } from 'lucide-react';
import AuthShell, { inputClass } from '../components/AuthShell';
import usePageTitle from '../hooks/usePageTitle';

export default function Signup() {
  const { t } = useTranslation();
  usePageTitle('Sign up');
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') === 'studio' ? 'studio' : 'user');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', location: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isValidPassword = (password) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidPassword(formData.password)) {
      setError(t('auth.pwInvalid'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const endpoint = role === 'user' ? '/signup/user' : '/signup/studio';
      const payload = role === 'user'
        ? { name: formData.name, email: formData.email, password: formData.password }
        : { name: formData.name, location: formData.location, email: formData.email, password: formData.password };
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('auth.signupFailed'));
      localStorage.setItem('userName', data.user?.name || formData.name);
      localStorage.setItem('userRole', data.user?.role || role);
      localStorage.setItem('userId', data.user?.id);
      if (data.token) localStorage.setItem('authToken', data.token);
      navigate(role === 'studio' ? '/studio' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roleTab = (value, label, Icon) => (
    <button
      type="button"
      onClick={() => setRole(value)}
      className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition
        ${role === value ? 'bg-surface text-ink-900 shadow-card' : 'text-ink-500 hover:text-ink-700'}`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <AuthShell
      eyebrow={t('auth.getStartedEyebrow')}
      title={t('auth.signupTitle')}
      subtitle={t('auth.signupSubtitle')}
      footer={<>{t('auth.haveAccount')} <Link to="/login" className="text-brand-600 font-semibold hover:underline">{t('auth.login')}</Link></>}
    >
      {/* Role toggle */}
      <div className="flex gap-1 bg-paper rounded-full p-1 mb-5">
        {roleTab('user', t('auth.imMember'), User)}
        {roleTab('studio', t('auth.imStudio'), Building2)}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-700 text-sm rounded-2xl px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">{role === 'user' ? t('auth.name') : t('auth.studioName')}</label>
          <input type="text" placeholder={role === 'user' ? t('auth.namePlaceholderUser') : t('auth.namePlaceholderStudio')} className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        {role === 'studio' && (
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">{t('auth.location')}</label>
            <input type="text" placeholder={t('auth.locationPlaceholder')} className={inputClass} value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">{t('auth.email')}</label>
          <input type="email" placeholder={t('auth.emailPlaceholder')} className={inputClass} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">{t('auth.password')}</label>
          <input type="password" placeholder="••••••••" className={inputClass} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
          <p className="text-xs text-ink-400 mt-1.5">{t('auth.passwordHint')}</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 text-white py-3 rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill disabled:opacity-60"
        >
          {loading ? t('auth.creatingAccount') : (role === 'user' ? t('auth.signupAsMember') : t('auth.signupAsStudio'))}
        </button>
      </form>
    </AuthShell>
  );
}
