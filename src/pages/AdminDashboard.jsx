// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const api = import.meta.env.VITE_API_URL;

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4">
      <span className="text-4xl">{icon}</span>
      <div>
        <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState('overview');

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [studios, setStudios] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [studioSearch, setStudioSearch] = useState('');
  const [msg, setMsg] = useState('');

  const headers = { 'x-admin-secret': secret, 'Content-Type': 'application/json' };

  async function login(e) {
    e.preventDefault();
    setAuthError('');
    try {
      const r = await fetch(`${api}/admin/stats`, { headers: { 'x-admin-secret': secret } });
      if (r.status === 403) { setAuthError('Invalid admin secret'); return; }
      const d = await r.json();
      setStats(d);
      setAuthed(true);
      loadAll();
    } catch {
      setAuthError('Could not connect to backend');
    }
  }

  async function loadAll() {
    const [u, s, b] = await Promise.all([
      fetch(`${api}/admin/users`, { headers }).then(r => r.json()),
      fetch(`${api}/admin/studios`, { headers }).then(r => r.json()),
      fetch(`${api}/admin/bookings`, { headers }).then(r => r.json()),
    ]);
    setUsers(u.users || []);
    setStudios(s.studios || []);
    setBookings(b.bookings || []);
  }

  async function deleteUser(id) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await fetch(`${api}/admin/users/${id}`, { method: 'DELETE', headers });
    setUsers(prev => prev.filter(u => u.id !== id));
    setMsg('User deleted');
  }

  async function deleteStudio(id) {
    if (!confirm('Delete this studio? This cannot be undone.')) return;
    await fetch(`${api}/admin/studios/${id}`, { method: 'DELETE', headers });
    setStudios(prev => prev.filter(s => s.id !== id));
    setMsg('Studio deleted');
  }

  async function toggleVerify(studio) {
    const r = await fetch(`${api}/admin/studios/${studio.id}/verify`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ verified: !studio.verified }),
    });
    const d = await r.json();
    if (d.studio) {
      setStudios(prev => prev.map(s => s.id === studio.id ? { ...s, verified: d.studio.verified } : s));
      setMsg(`Studio ${d.studio.verified ? 'verified' : 'unverified'}`);
    }
  }

  useEffect(() => {
    if (msg) { const t = setTimeout(() => setMsg(''), 3000); return () => clearTimeout(t); }
  }, [msg]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <form onSubmit={login} className="bg-white rounded-2xl shadow p-8 w-full max-w-sm flex flex-col gap-4">
          <div className="text-center">
            <span className="text-3xl">🛡️</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Admin Login</h1>
            <p className="text-sm text-gray-500 mt-1">FitFlex Admin Dashboard</p>
          </div>
          {authError && <p className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{authError}</p>}
          <input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            required
          />
          <button type="submit" className="bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition">
            Enter Dashboard
          </button>
          <Link to="/" className="text-center text-sm text-gray-400 hover:text-gray-600">← Back to site</Link>
        </form>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredStudios = studios.filter(s =>
    !studioSearch || s.name.toLowerCase().includes(studioSearch.toLowerCase()) || (s.city || '').toLowerCase().includes(studioSearch.toLowerCase())
  );

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'users', label: '👤 Users' },
    { key: 'studios', label: '🏢 Studios' },
    { key: 'bookings', label: '📅 Bookings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">FitFlex Admin</h1>
            <p className="text-xs text-gray-400">Management Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-blue-600 hover:underline">← Back to site</Link>
          <button
            onClick={() => { setAuthed(false); setSecret(''); }}
            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {msg && (
          <div className="mb-6 p-3 bg-green-100 text-green-700 rounded-xl text-sm font-medium">{msg}</div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={stats.users} icon="👤" />
            <StatCard label="Total Studios" value={stats.studios} icon="🏢" />
            <StatCard label="Total Classes" value={stats.classes} icon="🏋️" />
            <StatCard label="Total Bookings" value={stats.bookings} icon="📅" />
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Users <span className="text-gray-400 font-normal text-base">({filteredUsers.length})</span></h2>
              <input
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                placeholder="Search by name or email…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">ID</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">Name</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">Email</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">Credits</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">Bookings</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-400">{u.id}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-5 py-3 text-gray-600">{u.email}</td>
                      <td className="px-5 py-3 text-gray-600">{u.credits}</td>
                      <td className="px-5 py-3 text-gray-600">{u.booking_count}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Studios */}
        {tab === 'studios' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Studios <span className="text-gray-400 font-normal text-base">({filteredStudios.length})</span></h2>
              <input
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                placeholder="Search by name or city…"
                value={studioSearch}
                onChange={e => setStudioSearch(e.target.value)}
              />
            </div>
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">ID</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">Name</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">Email</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">City</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">Verified</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudios.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-400">{s.id}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">
                        <Link to={`/studios/${s.id}`} className="hover:underline text-blue-600">{s.name}</Link>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{s.email}</td>
                      <td className="px-5 py-3 text-gray-600">{s.city || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {s.verified ? '✓ Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right flex gap-3 justify-end">
                        <button
                          onClick={() => toggleVerify(s)}
                          className="text-xs text-blue-500 hover:text-blue-700 font-semibold"
                        >
                          {s.verified ? 'Unverify' : 'Verify'}
                        </button>
                        <button
                          onClick={() => deleteStudio(s.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudios.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No studios found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bookings */}
        {tab === 'bookings' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">All Bookings <span className="text-gray-400 font-normal text-base">({bookings.length})</span></h2>
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">ID</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">User</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">Class</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">Studio</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">Date</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-400">{b.id}</td>
                      <td className="px-5 py-3 text-gray-800">{b.user_name}</td>
                      <td className="px-5 py-3 text-gray-800">{b.class_name}</td>
                      <td className="px-5 py-3 text-gray-600">{b.studio_name}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {new Date(b.datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' '}
                        {new Date(b.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${new Date(b.datetime) < new Date() ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                          {new Date(b.datetime) < new Date() ? 'Completed' : 'Upcoming'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No bookings found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
