import authFetch from '../utils/authFetch';
// src/pages/UserSettings.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Ticket, Bell, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/NavBar';
import Toggle from '../components/Toggle';
import { inputClass } from '../components/AuthShell';
import usePageTitle from '../hooks/usePageTitle';

const ALL_FIELDS = [
  { key: 'name', label: 'Display name' },
  { key: 'bio', label: 'Bio' },
  { key: 'credits', label: 'Credit balance' },
  { key: 'bookings', label: 'Booked classes' },
];

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'credits', label: 'Credits', icon: Ticket },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'password', label: 'Password', icon: Lock },
];

export default function UserSettings() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const api = import.meta.env.VITE_API_URL;

  usePageTitle('Account Settings');
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', bio: '', public_fields: 'name', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [notifPrefs, setNotifPrefs] = useState({ bookings: true, reminders: true, messages: true });
  const [savingNotif, setSavingNotif] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [success, setSuccess] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (userRole !== 'user' || !userId) navigate('/login');
  }, [userRole, userId, navigate]);

  useEffect(() => {
    if (!userId) return;
    authFetch(`${api}/users/${userId}/settings`, { })
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user);
          setForm({
            name: d.user.name || '',
            bio: d.user.bio || '',
            public_fields: d.user.public_fields || 'name',
            phone: d.user.phone || '',
          });
          const p = d.user.email_prefs || {};
          setNotifPrefs({
            bookings: p.bookings !== false,
            reminders: p.reminders !== false,
            messages: p.messages !== false,
          });
        }
      })
      .catch(() => {});

    authFetch(`${api}/users/${userId}/purchases`, { })
      .then(r => r.json())
      .then(d => setPurchases(d.purchases || []))
      .catch(() => {});
  }, [api, userId]);

  function flash(msg, type = 'success') {
    if (type === 'success') { setSuccess(msg); setErr(''); }
    else { setErr(msg); setSuccess(''); }
    setTimeout(() => { setSuccess(''); setErr(''); }, 4000);
  }

  // Toggle a field in the public_fields comma-separated string
  function togglePublic(key) {
    const current = form.public_fields.split(',').filter(Boolean);
    const updated = current.includes(key)
      ? current.filter(f => f !== key)
      : [...current, key];
    setForm(f => ({ ...f, public_fields: updated.join(',') }));
  }

  async function saveProfile(e) {
    e.preventDefault();
    try {
      const res = await authFetch(`${api}/users/${userId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, bio: form.bio, public_fields: form.public_fields, phone: form.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setUser(data.user);
      localStorage.setItem('userName', data.user.name);
      flash('Profile saved!');
    } catch (e) { flash(e.message, 'error'); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { flash('New passwords do not match', 'error'); return; }
    if (pwForm.newPassword.length < 8) { flash('New password must be at least 8 characters', 'error'); return; }
    try {
      const res = await authFetch(`${api}/users/${userId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      flash('Password updated!');
    } catch (e) { flash(e.message, 'error'); }
  }

  async function saveNotifications(next) {
    // Optimistic update; revert on failure
    const prev = notifPrefs;
    setNotifPrefs(next);
    setSavingNotif(true);
    try {
      const res = await authFetch(`${api}/users/${userId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_prefs: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      flash('Notification settings saved!');
    } catch (e) {
      setNotifPrefs(prev);
      flash(e.message, 'error');
    } finally {
      setSavingNotif(false);
    }
  }

  function toggleNotif(key) {
    saveNotifications({ ...notifPrefs, [key]: !notifPrefs[key] });
  }

  const publicFields = form.public_fields.split(',').filter(Boolean);

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-2xl mx-auto">

        <div className="mb-6">
          <h1 className="font-display font-bold text-3xl text-ink-900">Account Settings</h1>
          <p className="text-ink-500 mt-1">Manage your profile and account preferences.</p>
        </div>

        {err && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-2xl text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {err}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-2xl text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-full shadow-card p-1 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-full transition
                ${activeTab === key ? 'bg-brand-500 text-white shadow-pill' : 'text-ink-500 hover:text-ink-800'}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── Profile tab ── */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl shadow-card p-6 space-y-6">
            <form onSubmit={saveProfile} className="space-y-5">

              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-[0.15em] mb-3">Account info</p>
                <div className="space-y-1 mb-4">
                  <p className="text-sm text-ink-500">Email</p>
                  <p className="text-sm font-medium text-ink-800">{user?.email}</p>
                  <p className="text-xs text-ink-400">Email cannot be changed.</p>
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink-700">Display name</span>
                  <input className={inputClass}
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Bio <span className="text-ink-400 text-xs">(optional)</span></span>
                <textarea rows={3} className={inputClass}
                  placeholder="Tell others a little about yourself..."
                  value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Phone number <span className="text-ink-400 text-xs">(optional — for WhatsApp class messages)</span></span>
                <input
                  type="tel"
                  className={inputClass}
                  placeholder="+1 234 567 8900"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </label>

              {/* Credit balance (read only) */}
              <div>
                <p className="text-sm font-medium text-ink-700 mb-1">Credit balance</p>
                <p className="text-2xl font-display font-bold text-brand-600">{user?.credits ?? '—'} <span className="text-sm font-normal text-ink-500">credits</span></p>
              </div>

              {/* Visibility toggles */}
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-[0.15em] mb-3">Profile visibility</p>
                <p className="text-sm text-ink-500 mb-3">Choose what others can see on your public profile.</p>
                <div className="space-y-2">
                  {ALL_FIELDS.map(f => (
                    <div key={f.key} className="flex items-center justify-between p-3 bg-paper rounded-2xl">
                      <div>
                        <p className="text-sm font-medium text-ink-800">{f.label}</p>
                        <p className="text-xs text-ink-400">{publicFields.includes(f.key) ? 'Public' : 'Private'}</p>
                      </div>
                      <Toggle checked={publicFields.includes(f.key)} onChange={() => togglePublic(f.key)} />
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-brand-500 text-white py-3 rounded-full font-semibold hover:bg-brand-600 transition shadow-pill">
                Save Profile
              </button>
            </form>
          </div>
        )}

        {/* ── Credits tab ── */}
        {activeTab === 'credits' && (
          <div className="space-y-6">
            {/* Balance + buy link */}
            <div className="bg-white rounded-3xl shadow-card p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-500 mb-1">Current balance</p>
                <p className="text-4xl font-display font-bold text-brand-600">{user?.credits ?? '—'} <span className="text-lg font-normal text-ink-500">credits</span></p>
              </div>
              <a href="/pricing" className="bg-brand-500 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-brand-600 transition text-sm shadow-pill">
                Buy Credits
              </a>
            </div>

            {/* Purchase history */}
            <div className="bg-white rounded-3xl shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-ink-100">
                <h2 className="font-display font-bold text-ink-900">Purchase history</h2>
              </div>
              {purchases.length === 0 ? (
                <p className="px-6 py-8 text-ink-400 text-sm">No purchases yet.</p>
              ) : (
                <ul className="divide-y divide-ink-50">
                  {purchases.map(p => (
                    <li key={p.id} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="font-semibold text-ink-800">{p.credits} credits</p>
                        <p className="text-sm text-ink-400">
                          Purchased {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' · '}Expires {new Date(p.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-ink-700">${(p.amount_cents / 100).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ── Notifications tab ── */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl shadow-card p-6">
            <h2 className="font-display font-bold text-lg text-ink-900 mb-1">Email Notifications</h2>
            <p className="text-sm text-ink-400 mb-6">
              Choose which emails you'd like to receive. Password reset and security emails are always sent.
            </p>
            <div className="divide-y divide-ink-50">
              {[
                { key: 'bookings', label: 'Booking confirmations', desc: 'When you book or cancel a class' },
                { key: 'reminders', label: 'Class & event reminders', desc: '24 hours before a class or group event' },
                { key: 'messages', label: 'Studio messages', desc: 'When a studio sends a message about your class' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-4">
                  <div className="pr-4">
                    <p className="font-semibold text-ink-800">{item.label}</p>
                    <p className="text-sm text-ink-400">{item.desc}</p>
                  </div>
                  <Toggle checked={notifPrefs[item.key]} onChange={() => toggleNotif(item.key)} disabled={savingNotif} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Password tab ── */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-3xl shadow-card p-6">
            <h2 className="font-display font-bold text-lg text-ink-900 mb-5">Change Password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Current password</span>
                <input type="password" className={inputClass}
                  value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">New password</span>
                <input type="password" className={inputClass}
                  value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Confirm new password</span>
                <input type="password" className={inputClass}
                  value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
              </label>
              <button type="submit" className="w-full bg-brand-500 text-white py-3 rounded-full font-semibold hover:bg-brand-600 transition shadow-pill">
                Update Password
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
