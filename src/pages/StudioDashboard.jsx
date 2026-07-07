// src/pages/StudioDashboard.jsx
import authFetch from '../utils/authFetch';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, CalendarCheck, BarChart3, Building2, Users, Megaphone,
  CheckCircle2, Plus, MapPin, Phone, Globe, AtSign, TrendingUp, Ticket,
} from 'lucide-react';
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

const inputCls = 'border border-ink-100 bg-white p-2.5 rounded-2xl text-sm focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition';
const inputSmCls = 'border border-ink-100 bg-white p-2 rounded-xl text-sm focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition';
const labelCls = 'text-sm font-medium text-ink-700';

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
  const [rosterClassId, setRosterClassId] = useState(null);
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);

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

  async function fetchRoster(classId) {
    if (rosterClassId === classId) { setRosterClassId(null); return; }
    setRosterClassId(classId);
    setRosterLoading(true);
    try {
      const res = await authFetch(`${api}/classes/${classId}/attendees`);
      const data = await res.json();
      setRoster(data.attendees || []);
    } catch { setRoster([]); }
    finally { setRosterLoading(false); }
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
    `inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-sm font-semibold rounded-full transition ${activeTab === t ? 'bg-brand-500 text-white shadow-pill' : 'text-ink-500 hover:bg-ink-50'}`;

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="pt-28 pb-16 px-4 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-ink-900 tracking-tight">Studio Dashboard</h1>
          <p className="text-ink-500 mt-1.5 flex items-center gap-2">
            {studioName}
            {profile?.verified && (
              <span className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-600 font-semibold px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            )}
          </p>
        </div>

        {/* Feedback */}
        {err && <div className="mb-4 p-3.5 bg-red-100 text-red-700 rounded-2xl text-sm font-medium">{err}</div>}
        {success && <div className="mb-4 p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium">{success}</div>}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-full shadow-card p-1.5 w-fit flex-wrap">
          <button className={tabClass('classes')} onClick={() => setActiveTab('classes')}>
            <CalendarDays className="w-4 h-4" /> Classes
          </button>
          <button className={tabClass('appointments')} onClick={() => setActiveTab('appointments')}>
            <CalendarCheck className="w-4 h-4" /> Appointments
          </button>
          <button className={tabClass('analytics')} onClick={() => { setActiveTab('analytics'); fetchAnalytics(); }}>
            <BarChart3 className="w-4 h-4" /> Analytics
          </button>
          <button className={tabClass('profile')} onClick={() => setActiveTab('profile')}>
            <Building2 className="w-4 h-4" /> Studio Profile
          </button>
        </div>

        {/* ══════════════ CLASSES TAB ══════════════ */}
        {activeTab === 'classes' && (
          <>
            {/* Create class form */}
            <div className="bg-white rounded-3xl shadow-card p-6 sm:p-7 mb-8">
              <h2 className="font-display font-bold text-xl text-ink-900 mb-5">Create a new class</h2>
              <form onSubmit={createClass} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>Class name *</span>
                  <input className={inputCls}
                    placeholder="e.g. Morning Flow"
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>Date &amp; Time *</span>
                  <input type="datetime-local" className={inputCls}
                    value={form.datetime} onChange={e => setForm({...form, datetime: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>Sport type</span>
                  <select className={inputCls}
                    value={form.sport_type} onChange={e => setForm({...form, sport_type: e.target.value})}>
                    <option value="">— Select sport type —</option>
                    {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>Credit cost <span className="text-ink-300 text-xs">(0 = free)</span></span>
                  <input type="number" min="0" className={inputCls}
                    value={form.credit_cost} onChange={e => setForm({...form, credit_cost: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className={labelCls}>Capacity <span className="text-ink-300">(optional)</span></span>
                  <input type="number" min="1" placeholder="e.g. 20" className={inputCls}
                    value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} />
                </label>

                <button type="submit" className="md:col-span-2 inline-flex items-center justify-center gap-2 bg-brand-500 text-white py-3 rounded-full font-semibold hover:bg-brand-600 shadow-pill transition">
                  <Plus className="w-4 h-4" strokeWidth={2.5} /> Create Class
                </button>
              </form>
            </div>

            {/* Class list */}
            <div className="bg-white rounded-3xl shadow-card p-6 sm:p-7">
              <h2 className="font-display font-bold text-xl text-ink-900 mb-4">Your classes</h2>
              {classesLoading ? (
                <p className="text-ink-300">Loading…</p>
              ) : classes.length === 0 ? (
                <p className="text-ink-500">No classes yet. Create your first one above.</p>
              ) : (
                <ul className="divide-y divide-ink-50">
                  {classes.map(cls => (
                    <li key={cls.id} className="py-4">
                      {editingId === cls.id ? (
                        /* ── Inline edit form ── */
                        <form onSubmit={saveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-ink-400">Class name</span>
                            <input className={inputSmCls}
                              value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-ink-400">Date &amp; Time</span>
                            <input type="datetime-local" className={inputSmCls}
                              value={editForm.datetime} onChange={e => setEditForm({...editForm, datetime: e.target.value})} />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-ink-400">Sport type</span>
                            <select className={inputSmCls}
                              value={editForm.sport_type} onChange={e => setEditForm({...editForm, sport_type: e.target.value})}>
                              <option value="">— Select —</option>
                              {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-ink-400">Credit cost (0 = free)</span>
                            <input type="number" min="0" className={inputSmCls}
                              value={editForm.credit_cost} onChange={e => setEditForm({...editForm, credit_cost: e.target.value})} />
                          </label>
                          <label className="flex flex-col gap-1 md:col-span-2">
                            <span className="text-xs font-medium text-ink-400">Capacity</span>
                            <input type="number" min="1" className={inputSmCls}
                              value={editForm.capacity} onChange={e => setEditForm({...editForm, capacity: e.target.value})} />
                          </label>
                          <div className="md:col-span-2 flex gap-2">
                            <button type="submit" className="bg-brand-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-brand-600 transition">Save</button>
                            <button type="button" onClick={() => setEditingId(null)} className="text-ink-500 px-4 py-2 rounded-full text-sm hover:bg-ink-50 transition">Cancel</button>
                          </div>
                        </form>
                      ) : (
                        /* ── Class row ── */
                        <>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-ink-800">{cls.name}</p>
                              <p className="text-sm text-ink-400 mt-0.5">
                                {new Date(cls.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                {' · '}{new Date(cls.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                {cls.sport_type && ` · ${cls.sport_type}`}
                                {' · '}{cls.credit_cost} credit{cls.credit_cost !== 1 ? 's' : ''}
                                {cls.capacity ? ` · ${cls.capacity} spots` : ''}
                              </p>
                            </div>
                            <div className="flex gap-3 ml-4 shrink-0">
                              <button onClick={() => startEdit(cls)} className="text-brand-600 text-sm font-medium hover:underline">Edit</button>
                              <button onClick={() => fetchRoster(cls.id)} className="text-emerald-600 text-sm font-medium hover:underline">
                                {rosterClassId === cls.id ? 'Hide roster' : 'Roster'}
                              </button>
                              <button onClick={() => { setMessagingClassId(cls.id); setMessageText(''); }} className="text-ink-600 text-sm font-medium hover:underline">Message</button>
                              <button onClick={() => deleteClass(cls.id)} className="text-red-500 text-sm font-medium hover:underline">Delete</button>
                            </div>
                          </div>
                          {/* Roster panel */}
                          {rosterClassId === cls.id && (
                            <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                              <p className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-1.5">
                                <Users className="w-4 h-4" /> Attendees {!rosterLoading && `(${roster.length})`}
                              </p>
                              {rosterLoading ? (
                                <p className="text-sm text-ink-300">Loading…</p>
                              ) : roster.length === 0 ? (
                                <p className="text-sm text-ink-500">No bookings yet.</p>
                              ) : (
                                <ul className="divide-y divide-emerald-100">
                                  {roster.map(u => (
                                    <li key={u.booking_id} className="py-2 flex items-center justify-between text-sm">
                                      <span className="font-medium text-ink-800">{u.name}</span>
                                      <span className="text-ink-400 text-xs">{u.email}{u.phone ? ` · ${u.phone}` : ''}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}

                          {/* Message panel */}
                          {messagingClassId === cls.id && (
                            <div className="mt-3 bg-brand-50 border border-brand-100 rounded-2xl p-4">
                              <p className="text-sm font-semibold text-brand-800 mb-2 flex items-center gap-1.5">
                                <Megaphone className="w-4 h-4" /> Message all booked users
                              </p>
                              <textarea
                                rows={3}
                                className="w-full border border-brand-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 bg-white mb-2"
                                placeholder="e.g. Please bring a yoga mat and wear comfortable clothing. See you there!"
                                value={messageText}
                                onChange={e => setMessageText(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <button onClick={() => sendMessage(cls.id)} className="bg-brand-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-brand-600 transition">Send</button>
                                <button onClick={() => setMessagingClassId(null)} className="text-ink-500 px-4 py-2 rounded-full text-sm hover:bg-white transition">Cancel</button>
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
            <div className="bg-white rounded-3xl shadow-card p-6 flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-ink-900">Appointment Slots</p>
                <p className="text-sm text-ink-400 mt-0.5">
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
                className={`w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer flex items-center px-0.5 ${offersAppointments ? 'bg-brand-500' : 'bg-ink-200'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${offersAppointments ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            {offersAppointments ? (
              <AppointmentMatrix studioId={studioId} mode="manage" openingHour={openingHour} closingHour={closingHour} />
            ) : (
              <div className="bg-white rounded-3xl shadow-card px-6 py-14 text-center">
                <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 mb-4">
                  <CalendarCheck className="w-7 h-7" strokeWidth={1.8} />
                </span>
                <p className="font-display font-bold text-ink-800">Enable appointment slots above to get started</p>
                <p className="text-sm text-ink-400 mt-1">You can set capacity, duration and credit cost per slot.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ ANALYTICS TAB ══════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="rounded-3xl p-5 text-white shadow-card flex items-center gap-4"
                style={{ background: 'linear-gradient(135deg,#e8702a,#f1a878)' }}>
                <span className="w-12 h-12 rounded-2xl bg-white/20 grid place-items-center shrink-0">
                  <TrendingUp className="w-6 h-6" strokeWidth={1.9} />
                </span>
                <div>
                  <p className="text-sm/tight opacity-90">Total Bookings</p>
                  <p className="font-display font-black text-2xl">{analytics?.totalBookings ?? '—'}</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-card p-5 flex items-center gap-4">
                <span className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 grid place-items-center shrink-0">
                  <Ticket className="w-6 h-6" strokeWidth={1.9} />
                </span>
                <div>
                  <p className="text-sm/tight text-ink-400">Credits Earned</p>
                  <p className="font-display font-black text-2xl text-ink-900">{analytics?.totalRevenue ?? '—'}</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-card p-5 flex items-center gap-4 col-span-2 md:col-span-1">
                <span className="w-12 h-12 rounded-2xl bg-ink-100 text-ink-700 grid place-items-center shrink-0">
                  <CalendarDays className="w-6 h-6" strokeWidth={1.9} />
                </span>
                <div>
                  <p className="text-sm/tight text-ink-400">Classes Created</p>
                  <p className="font-display font-black text-2xl text-ink-900">{analytics?.classes?.length ?? '—'}</p>
                </div>
              </div>
            </div>

            {/* Per-class breakdown */}
            <div className="bg-white rounded-3xl shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-ink-50">
                <h2 className="font-display font-bold text-ink-900">Bookings per class</h2>
              </div>
              {!analytics?.classes?.length ? (
                <p className="px-6 py-8 text-ink-300 text-sm">No classes yet.</p>
              ) : (
                <ul className="divide-y divide-ink-50">
                  {analytics.classes.map(cls => {
                    const fillPct = cls.capacity ? Math.round((cls.booking_count / cls.capacity) * 100) : null;
                    return (
                      <li key={cls.id} className="px-6 py-4">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <p className="font-semibold text-ink-800 text-sm">{cls.name}</p>
                            <p className="text-xs text-ink-400">
                              {new Date(cls.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              {' · '}{new Date(cls.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-ink-800 text-sm">{cls.booking_count} booked</p>
                            {cls.capacity && <p className="text-xs text-ink-400">of {cls.capacity} spots</p>}
                          </div>
                        </div>
                        {fillPct !== null && (
                          <div className="w-full bg-ink-50 rounded-full h-1.5 mt-2">
                            <div
                              className={`h-1.5 rounded-full ${fillPct >= 80 ? 'bg-emerald-500' : fillPct >= 40 ? 'bg-brand-500' : 'bg-ink-200'}`}
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
          <div className="bg-white rounded-3xl shadow-card p-6 sm:p-7">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-bold text-xl text-ink-900">Studio Profile</h2>
                <p className="text-sm text-ink-400 mt-0.5">This information is shown publicly on your studio page.</p>
              </div>
              {!profileEditing && (
                <button onClick={() => setProfileEditing(true)} className="text-brand-600 text-sm font-semibold hover:underline">Edit</button>
              )}
            </div>

            {profileEditing ? (
              <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className={labelCls}>About your studio <span className="text-ink-300 text-xs">(public)</span></span>
                  <textarea rows={3} className={inputCls}
                    placeholder="Tell people what makes your studio special..."
                    value={profileForm.about} onChange={e => setProfileForm({...profileForm, about: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>City <span className="text-ink-300 text-xs">(public)</span></span>
                  <input className={inputCls}
                    placeholder="e.g. Tel Aviv" value={profileForm.city} onChange={e => setProfileForm({...profileForm, city: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>Neighbourhood <span className="text-ink-300 text-xs">(public)</span></span>
                  <input className={inputCls}
                    placeholder="e.g. Florentin" value={profileForm.neighbourhood} onChange={e => setProfileForm({...profileForm, neighbourhood: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>Phone <span className="text-ink-300 text-xs">(public)</span></span>
                  <input className={inputCls}
                    placeholder="+1 234 567 8900" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className={labelCls}>Website <span className="text-ink-300 text-xs">(public)</span></span>
                  <input className={inputCls}
                    placeholder="https://yourstudio.com" value={profileForm.website} onChange={e => setProfileForm({...profileForm, website: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className={labelCls}>Instagram <span className="text-ink-300 text-xs">(public)</span></span>
                  <input className={inputCls}
                    placeholder="@yourstudio" value={profileForm.instagram} onChange={e => setProfileForm({...profileForm, instagram: e.target.value})} />
                </label>

                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="bg-brand-500 text-white px-7 py-2.5 rounded-full font-semibold hover:bg-brand-600 shadow-pill transition">Save Profile</button>
                  <button type="button" onClick={() => setProfileEditing(false)} className="text-ink-500 px-4 py-2.5 rounded-full hover:bg-ink-50 transition">Cancel</button>
                </div>
              </form>
            ) : (
              /* ── Profile view ── */
              <div className="space-y-4 text-sm text-ink-700">
                {profile?.about && (
                  <div>
                    <p className="text-xs font-semibold text-ink-300 uppercase tracking-wide mb-1">About</p>
                    <p>{profile.about}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(profile?.city || profile?.neighbourhood) && (
                    <div>
                      <p className="text-xs font-semibold text-ink-300 uppercase tracking-wide mb-1">Location</p>
                      <p className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-ink-300" /> {[profile.neighbourhood, profile.city].filter(Boolean).join(', ')}</p>
                    </div>
                  )}
                  {profile?.phone && (
                    <div>
                      <p className="text-xs font-semibold text-ink-300 uppercase tracking-wide mb-1">Phone</p>
                      <p className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-ink-300" /> {profile.phone}</p>
                    </div>
                  )}
                  {profile?.website && (
                    <div>
                      <p className="text-xs font-semibold text-ink-300 uppercase tracking-wide mb-1">Website</p>
                      <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-brand-600 hover:underline">
                        <Globe className="w-4 h-4" /> {profile.website}
                      </a>
                    </div>
                  )}
                  {profile?.instagram && (
                    <div>
                      <p className="text-xs font-semibold text-ink-300 uppercase tracking-wide mb-1">Instagram</p>
                      <a href={`https://instagram.com/${profile.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-brand-600 hover:underline">
                        <AtSign className="w-4 h-4" /> {profile.instagram}
                      </a>
                    </div>
                  )}
                </div>
                {!profile?.about && !profile?.city && !profile?.phone && !profile?.website && !profile?.instagram && (
                  <p className="text-ink-300 italic">No profile info added yet. Click Edit to add details.</p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
