// src/pages/StudioDashboard.jsx
import authFetch from '../utils/authFetch';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';
import AppointmentMatrix from '../components/AppointmentMatrix';

const SPORT_TYPES = [
  'Yoga', 'Pilates', 'HIIT', 'Cycling', 'Boxing',
  'Swimming', 'CrossFit', 'Dance', 'Martial Arts',
  'Shiatsu', 'Running', 'Other',
];

function nextHour() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

const EMPTY_FORM = { name: '', datetime: nextHour(), sport_type: '', credit_cost: 1, capacity: '' };

export default function StudioDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('userRole');
  const studioId = localStorage.getItem('userId');
  const studioName = localStorage.getItem('userName');
  const api = import.meta.env.VITE_API_URL;

  // ── Classes state ──
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  // ── Profile state ──
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    about: '', phone: '', website: '', instagram: '', city: '', neighbourhood: '',
  });
  const [profileEditing, setProfileEditing] = useState(false);

  // ── Feedback ──
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'appointments' | 'analytics' | 'profile'
  const [offersAppointments, setOffersAppointments] = useState(false);
  const [openingHour, setOpeningHour] = useState(9);
  const [closingHour, setClosingHour] = useState(18);
  const [analytics, setAnalytics] = useState(null);
  usePageTitle('Studio Dashboard');
  const [messagingClassId, setMessagingClassId] = useState(null);
  const [messageText, setMessageText] = useState('');

  // Guard: must be a studio with a valid numeric ID
  const studioIdNum = Number(studioId);
  useEffect(() => {
    if (role !== 'studio' || !studioId || !Number.isFinite(studioIdNum) || studioIdNum <= 0) {
      // Clear any stale/corrupt session and force re-login
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      navigate('/login');
    }
  }, [role, studioId, studioIdNum, navigate]);

  // ── Fetch classes ──
  const fetchClasses = useCallback(async () => {
    if (!studioId) return;
    setClassesLoading(true);
    try {
      const res = await authFetch(`${api}/studios/${studioId}/classes`, { });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClasses(data.classes || []);
    } catch (e) { setErr(e.message); }
    finally { setClassesLoading(false); }
  }, [api, studioId]);

  // ── Fetch profile ──
  const fetchProfile = useCallback(async () => {
    if (!studioId) return;
    try {
      const res = await authFetch(`${api}/studios/${studioId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data.studio);
      setProfileForm({
        about: data.studio.about || '',
        phone: data.studio.phone || '',
        website: data.studio.website || '',
        instagram: data.studio.instagram || '',
        city: data.studio.city || '',
        neighbourhood: data.studio.neighbourhood || '',
      });
      if (data.studio) {
        setOffersAppointments(data.studio.offers_appointments || false);
        setOpeningHour(data.studio.opening_hour ?? 9);
        setClosingHour(data.studio.closing_hour ?? 18);
      }
    } catch (e) { /* profile might not exist yet */ }
  }, [api, studioId]);

  const fetchAnalytics = useCallback(async () => {
    if (!studioId) return;
    try {
      const res = await authFetch(`${api}/studios/${studioId}/analytics`, { });
      const data = await res.json();
      if (res.ok) setAnalytics(data);
    } catch { /* ignore */ }
  }, [api, studioId]);

  useEffect(() => { fetchClasses(); fetchProfile(); fetchAnalytics(); }, [fetchClasses, fetchProfile, fetchAnalytics]);

  function flash(msg, type = 'success') {
    if (type === 'success') { setSuccess(msg); setErr(''); }
    else { setErr(msg); setSuccess(''); }
    setTimeout(() => { setSuccess(''); setErr(''); }, 4000);
  }

  // ── Create class ──
  async function createClass(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.datetime) { flash('Please fill in class name and date/time', 'error'); return; }
    const parsedDate = new Date(form.datetime);
    if (isNaN(parsedDate.getTime())) { flash('Invalid date/time', 'error'); return; }
    try {
      const res = await authFetch(`${api}/studios/${studioId}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          datetime: parsedDate.toISOString(),
          sport_type: form.sport_type || null,
          credit_cost: Number(form.credit_cost) || 1,
          capacity: form.capacity ? Number(form.capacity) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create class');
      setForm({ ...EMPTY_FORM, datetime: nextHour() });
      flash('Class created! 🎉');
      fetchClasses();
    } catch (e) { flash(e.message, 'error'); }
  }

  // ── Edit class ──
  function startEdit(cls) {
    setEditingId(cls.id);
    setEditForm({
      name: cls.name,
      datetime: new Date(cls.datetime).toISOString().slice(0, 16),
      sport_type: cls.sport_type || '',
      credit_cost: cls.credit_cost,
      capacity: cls.capacity || '',
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      const res = await authFetch(`${api}/classes/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          datetime: new Date(editForm.datetime).toISOString(),
          sport_type: editForm.sport_type || null,
          credit_cost: Number(editForm.credit_cost) || 1,
          capacity: editForm.capacity ? Number(editForm.capacity) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update class');
      setEditingId(null);
      setEditForm(null);
      flash('Class updated!');
      fetchClasses();
    } catch (e) { flash(e.message, 'error'); }
  }

  // ── Delete class ──
  async function deleteClass(id) {
    if (!confirm('Delete this class?')) return;
    try {
      const res = await authFetch(`${api}/classes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete class');
      setClasses(prev => prev.filter(c => c.id !== id));
      flash('Class deleted.');
    } catch (e) { flash(e.message, 'error'); }
  }

  // ── Send class message ──
  async function sendMessage(classId) {
    if (!messageText.trim()) { flash('Please enter a message', 'error'); return; }
    try {
      const res = await authFetch(`${api}/classes/${classId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setMessagingClassId(null);
      setMessageText('');
      flash(`Message sent to ${data.sent} booked user${data.sent !== 1 ? 's' : ''}! 📣`);
    } catch (e) { flash(e.message, 'error'); }
  }

  // ── Save profile ──
  async function saveProfile(e) {
    e.preventDefault();
    try {
      const res = await authFetch(`${api}/studios/${studioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');
      setProfile(data.studio);
      setProfileEditing(false);
      flash('Profile saved!');
    } catch (e) { flash(e.message, 'error'); }
  }

  const tabClass = (t) =>
    `px-5 py-2.5 text-sm font-semibold rounded-full transition ${activeTab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Studio Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {studioName}
            {profile?.verified && <span className="ml-2 text-blue-600 text-sm font-medium">✅ Verified</span>}
          </p>
        </div>

        {/* Feedback */}
        {err && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">{err}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-xl text-sm">{success}</div>}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white rounded-full shadow-sm p-1 w-fit flex-wrap">
          <button className={tabClass('classes')} onClick={() => setActiveTab('classes')}>🗓 Classes</button>
          <button className={tabClass('appointments')} onClick={() => setActiveTab('appointments')}>📆 Appointments</button>
          <button className={tabClass('analytics')} onClick={() => { setActiveTab('analytics'); fetchAnalytics(); }}>📊 Analytics</button>
          <button className={tabClass('profile')} onClick={() => setActiveTab('profile')}>🏢 Studio Profile</button>
        </div>

        {/* ══════════════ CLASSES TAB ══════════════ */}
        {activeTab === 'classes' && (
          <>
            {/* Create class form */}
            <div className="bg-white rounded-2xl shadow p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Create a new class</h2>
              <form onSubmit={createClass} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">Class name *</span>
                  <input className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="e.g. Morning Flow"
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">Date &amp; Time *</span>
                  <input type="datetime-local" className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.datetime} onChange={e => setForm({...form, datetime: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">Sport type</span>
                  <select className="border border-gray-200 p-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.sport_type} onChange={e => setForm({...form, sport_type: e.target.value})}>
                    <option value="">— Select sport type —</option>
                    {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">Credit cost <span className="text-gray-400 text-xs">(0 = free)</span></span>
                  <input type="number" min="0" className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.credit_cost} onChange={e => setForm({...form, credit_cost: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Capacity <span className="text-gray-400">(optional)</span></span>
                  <input type="number" min="1" placeholder="e.g. 20" className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} />
                </label>

                <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition">
                  + Create Class
                </button>
              </form>
            </div>

            {/* Class list */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Your classes</h2>
              {classesLoading ? (
                <p className="text-gray-400">Loading…</p>
              ) : classes.length === 0 ? (
                <p className="text-gray-500">No classes yet. Create your first one above.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {classes.map(cls => (
                    <li key={cls.id} className="py-4">
                      {editingId === cls.id ? (
                        /* ── Inline edit form ── */
                        <form onSubmit={saveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-500">Class name</span>
                            <input className="border border-gray-200 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                              value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-500">Date &amp; Time</span>
                            <input type="datetime-local" className="border border-gray-200 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                              value={editForm.datetime} onChange={e => setEditForm({...editForm, datetime: e.target.value})} />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-500">Sport type</span>
                            <select className="border border-gray-200 p-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                              value={editForm.sport_type} onChange={e => setEditForm({...editForm, sport_type: e.target.value})}>
                              <option value="">— Select —</option>
                              {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-500">Credit cost (0 = free)</span>
                            <input type="number" min="0" className="border border-gray-200 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                              value={editForm.credit_cost} onChange={e => setEditForm({...editForm, credit_cost: e.target.value})} />
                          </label>
                          <label className="flex flex-col gap-1 md:col-span-2">
                            <span className="text-xs font-medium text-gray-500">Capacity</span>
                            <input type="number" min="1" className="border border-gray-200 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                              value={editForm.capacity} onChange={e => setEditForm({...editForm, capacity: e.target.value})} />
                          </label>
                          <div className="md:col-span-2 flex gap-2">
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">Save</button>
                            <button type="button" onClick={() => setEditingId(null)} className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition">Cancel</button>
                          </div>
                        </form>
                      ) : (
                        /* ── Class row ── */
                        <>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-800">{cls.name}</p>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {new Date(cls.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                {' · '}{new Date(cls.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                {cls.sport_type && ` · ${cls.sport_type}`}
                                {' · '}{cls.credit_cost} credit{cls.credit_cost !== 1 ? 's' : ''}
                                {cls.capacity ? ` · ${cls.capacity} spots` : ''}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4 shrink-0">
                              <button onClick={() => startEdit(cls)} className="text-blue-600 text-sm hover:underline">Edit</button>
                              <button onClick={() => { setMessagingClassId(cls.id); setMessageText(''); }} className="text-purple-600 text-sm hover:underline">Message</button>
                              <button onClick={() => deleteClass(cls.id)} className="text-red-500 text-sm hover:underline">Delete</button>
                            </div>
                          </div>
                          {/* Message panel */}
                          {messagingClassId === cls.id && (
                            <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
                              <p className="text-sm font-medium text-purple-800 mb-2">📣 Message all booked users</p>
                              <textarea
                                rows={3}
                                className="w-full border border-purple-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white mb-2"
                                placeholder="e.g. Please bring a yoga mat and wear comfortable clothing. See you there!"
                                value={messageText}
                                onChange={e => setMessageText(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <button onClick={() => sendMessage(cls.id)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition">Send</button>
                                <button onClick={() => setMessagingClassId(null)} className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition">Cancel</button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* ══════════════ APPOINTMENTS TAB ══════════════ */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            {/* Enable toggle */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Appointment Slots</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {offersAppointments
                    ? 'Enabled — users can book slots from your studio page'
                    : 'Disabled — enable to offer bookable time slots'}
                </p>
              </div>
              <div
                onClick={async () => {
                  const next = !offersAppointments;
                  setOffersAppointments(next);
                  await authFetch(`${api}/studios/${studioId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ offers_appointments: next }),
                  });
                  flash(next ? 'Appointment slots enabled!' : 'Appointment slots disabled.');
                }}
                className={`w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer flex items-center px-0.5 ${offersAppointments ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${offersAppointments ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            {offersAppointments ? (
              <AppointmentMatrix studioId={studioId} mode="manage" openingHour={openingHour} closingHour={closingHour} />
            ) : (
              <div className="bg-white rounded-2xl shadow px-6 py-12 text-center text-gray-400">
                <p className="text-4xl mb-3">📆</p>
                <p className="font-semibold text-gray-600">Enable appointment slots above to get started</p>
                <p className="text-sm mt-1">You can set capacity, duration and credit cost per slot.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ ANALYTICS TAB ══════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl shadow p-5 text-center">
                <p className="text-3xl font-bold text-blue-600">{analytics?.totalBookings ?? '—'}</p>
                <p className="text-sm text-gray-500 mt-1">Total Bookings</p>
              </div>
              <div className="bg-white rounded-2xl shadow p-5 text-center">
                <p className="text-3xl font-bold text-blue-600">{analytics?.totalRevenue ?? '—'}</p>
                <p className="text-sm text-gray-500 mt-1">Credits Earned</p>
              </div>
              <div className="bg-white rounded-2xl shadow p-5 text-center col-span-2 md:col-span-1">
                <p className="text-3xl font-bold text-blue-600">{analytics?.classes?.length ?? '—'}</p>
                <p className="text-sm text-gray-500 mt-1">Classes Created</p>
              </div>
            </div>

            {/* Per-class breakdown */}
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="font-bold text-gray-800">Bookings per class</h2>
              </div>
              {!analytics?.classes?.length ? (
                <p className="px-6 py-8 text-gray-400 text-sm">No classes yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {analytics.classes.map(cls => {
                    const fillPct = cls.capacity ? Math.round((cls.booking_count / cls.capacity) * 100) : null;
                    return (
                      <li key={cls.id} className="px-6 py-4">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{cls.name}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(cls.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              {' · '}{new Date(cls.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800 text-sm">{cls.booking_count} booked</p>
                            {cls.capacity && <p className="text-xs text-gray-400">of {cls.capacity} spots</p>}
                          </div>
                        </div>
                        {fillPct !== null && (
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                            <div
                              className={`h-1.5 rounded-full ${fillPct >= 80 ? 'bg-green-500' : fillPct >= 40 ? 'bg-blue-500' : 'bg-gray-300'}`}
                              style={{ width: `${Math.min(fillPct, 100)}%` }}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ PROFILE TAB ══════════════ */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Studio Profile</h2>
                <p className="text-sm text-gray-400 mt-0.5">This information is shown publicly on your studio page.</p>
              </div>
              {!profileEditing && (
                <button onClick={() => setProfileEditing(true)} className="text-blue-600 text-sm font-semibold hover:underline">Edit</button>
              )}
            </div>

            {profileEditing ? (
              <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">About your studio <span className="text-gray-400 text-xs">(public)</span></span>
                  <textarea rows={3} className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Tell people what makes your studio special..."
                    value={profileForm.about} onChange={e => setProfileForm({...profileForm, about: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">City <span className="text-gray-400 text-xs">(public)</span></span>
                  <input className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="e.g. Tel Aviv" value={profileForm.city} onChange={e => setProfileForm({...profileForm, city: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">Neighbourhood <span className="text-gray-400 text-xs">(public)</span></span>
                  <input className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="e.g. Florentin" value={profileForm.neighbourhood} onChange={e => setProfileForm({...profileForm, neighbourhood: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">Phone <span className="text-gray-400 text-xs">(public)</span></span>
                  <input className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="+1 234 567 8900" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">Website <span className="text-gray-400 text-xs">(public)</span></span>
                  <input className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="https://yourstudio.com" value={profileForm.website} onChange={e => setProfileForm({...profileForm, website: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Instagram <span className="text-gray-400 text-xs">(public)</span></span>
                  <input className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="@yourstudio" value={profileForm.instagram} onChange={e => setProfileForm({...profileForm, instagram: e.target.value})} />
                </label>

                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition">Save Profile</button>
                  <button type="button" onClick={() => setProfileEditing(false)} className="text-gray-500 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition">Cancel</button>
                </div>
              </form>
            ) : (
              /* ── Profile view ── */
              <div className="space-y-4 text-sm text-gray-700">
                {profile?.about && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">About</p>
                    <p>{profile.about}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(profile?.city || profile?.neighbourhood) && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Location</p>
                      <p>📍 {[profile.neighbourhood, profile.city].filter(Boolean).join(', ')}</p>
                    </div>
                  )}
                  {profile?.phone && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Phone</p>
                      <p>📞 {profile.phone}</p>
                    </div>
                  )}
                  {profile?.website && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Website</p>
                      <a href={profile.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">🌐 {profile.website}</a>
                    </div>
                  )}
                  {profile?.instagram && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Instagram</p>
                      <a href={`https://instagram.com/${profile.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">📸 {profile.instagram}</a>
                    </div>
                  )}
                </div>
                {!profile?.about && !profile?.city && !profile?.phone && !profile?.website && !profile?.instagram && (
                  <p className="text-gray-400 italic">No profile info added yet. Click Edit to add details.</p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
