// src/pages/UserSettings.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';

const ALL_FIELDS = [
  { key: 'name', label: 'Display name' },
  { key: 'bio', label: 'Bio' },
  { key: 'credits', label: 'Credit balance' },
];

export default function UserSettings() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const api = import.meta.env.VITE_API_URL;

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', bio: '', public_fields: 'name' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [activeTab, setActiveTab] = useState('profile');
  const [success, setSuccess] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (userRole !== 'user' || !userId) navigate('/login');
  }, [userRole, userId, navigate]);

  useEffect(() => {
    if (!userId) return;
    fetch(`${api}/users/${userId}/settings`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user);
          setForm({
            name: d.user.name || '',
            bio: d.user.bio || '',
            public_fields: d.user.public_fields || 'name',
          });
        }
      })
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
      const res = await fetch(`${api}/users/${userId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: form.name, bio: form.bio, public_fields: form.public_fields }),
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
      const res = await fetch(`${api}/users/${userId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      flash('Password updated!');
    } catch (e) { flash(e.message, 'error'); }
  }

  const tabClass = (t) =>
    `px-5 py-2.5 text-sm font-semibold rounded-full transition ${activeTab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`;

  const publicFields = form.public_fields.split(',').filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-2xl mx-auto">

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500 mt-1">Manage your profile and account preferences.</p>
        </div>

        {err && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">{err}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-xl text-sm">{success}</div>}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white rounded-full shadow-sm p-1 w-fit">
          <button className={tabClass('profile')} onClick={() => setActiveTab('profile')}>👤 Profile</button>
          <button className={tabClass('password')} onClick={() => setActiveTab('password')}>🔒 Password</button>
        </div>

        {/* ── Profile tab ── */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow p-6 space-y-6">
            <form onSubmit={saveProfile} className="space-y-5">

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Account info</p>
                <div className="space-y-1 mb-4">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-800">{user?.email}</p>
                  <p className="text-xs text-gray-400">Email cannot be changed.</p>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">Display name</span>
                  <input className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Bio <span className="text-gray-400 text-xs">(optional)</span></span>
                <textarea rows={3} className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Tell others a little about yourself..."
                  value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} />
              </label>

              {/* Credit balance (read only) */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Credit balance</p>
                <p className="text-2xl font-bold text-blue-600">{user?.credits ?? '—'} <span className="text-sm font-normal text-gray-500">credits</span></p>
              </div>

              {/* Visibility toggles */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Profile visibility</p>
                <p className="text-sm text-gray-500 mb-3">Choose what others can see on your public profile.</p>
                <div className="space-y-2">
                  {ALL_FIELDS.map(f => (
                    <label key={f.key} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{f.label}</p>
                        <p className="text-xs text-gray-400">{publicFields.includes(f.key) ? '🌐 Public' : '🔒 Private'}</p>
                      </div>
                      <div
                        onClick={() => togglePublic(f.key)}
                        className={`w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex items-center px-0.5
                          ${publicFields.includes(f.key) ? 'bg-blue-600' : 'bg-gray-200'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                          ${publicFields.includes(f.key) ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition">
                Save Profile
              </button>
            </form>
          </div>
        )}

        {/* ── Password tab ── */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Change Password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Current password</span>
                <input type="password" className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={pwForm.currentPassword} onChange={e => setPwForm(f => ({...f, currentPassword: e.target.value}))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">New password</span>
                <input type="password" className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={pwForm.newPassword} onChange={e => setPwForm(f => ({...f, newPassword: e.target.value}))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Confirm new password</span>
                <input type="password" className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={pwForm.confirm} onChange={e => setPwForm(f => ({...f, confirm: e.target.value}))} />
              </label>
              <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition">
                Update Password
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
