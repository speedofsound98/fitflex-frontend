// src/pages/EventDetail.jsx
import authFetch from '../utils/authFetch';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Check, HelpCircle, X, CalendarDays, Clock, MapPin, ArrowLeft,
  AlertCircle, CheckCircle2,
} from 'lucide-react';
import Navbar from '../components/NavBar';
import { inputClass } from '../components/AuthShell';
import usePageTitle from '../hooks/usePageTitle';

const api = import.meta.env.VITE_API_URL;

const STATUS = {
  going:     { label: 'Going',     Icon: Check,      solid: 'bg-emerald-600 text-white', soft: 'bg-emerald-100 text-emerald-700' },
  maybe:     { label: 'Maybe',     Icon: HelpCircle, solid: 'bg-amber-500 text-white',   soft: 'bg-amber-100 text-amber-700' },
  not_going: { label: 'Not going', Icon: X,          solid: 'bg-ink-300 text-ink-800',   soft: 'bg-ink-100 text-ink-500' },
};

function StatusPill({ status, solid = false }) {
  const s = STATUS[status];
  if (!s) return null;
  const { Icon, label } = s;
  return (
    <span className={`inline-flex items-center gap-1 ${solid ? s.solid : s.soft} text-xs font-semibold px-2.5 py-1 rounded-full`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
  );
}

export default function EventDetail() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myStatus, setMyStatus] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  usePageTitle(event ? event.title : 'Event');

  const userId = Number(localStorage.getItem('userId'));
  const userRole = localStorage.getItem('userRole');
  const isUser = userRole === 'user';

  useEffect(() => {
    fetch(`${api}/events/${eventId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setLoading(false); return; }
        setEvent(d.event);
        setRsvps(d.rsvps || []);
        const mine = d.rsvps.find(r => r.user_id === userId);
        setMyStatus(mine?.status || null);
        setEditForm({
          title: d.event.title,
          description: d.event.description || '',
          datetime: new Date(d.event.datetime).toISOString().slice(0, 16),
          location: d.event.location || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  function flash(m, type = 'success') {
    setMsg(m); setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  }

  async function rsvp(status) {
    try {
      const res = await authFetch(`${api}/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to RSVP');
      setMyStatus(status);
      // Update rsvps list
      const userName = localStorage.getItem('userName');
      setRsvps(prev => {
        const filtered = prev.filter(r => r.user_id !== userId);
        return [...filtered, { user_id: userId, name: userName, status }];
      });
      flash(`You're marked as "${STATUS[status].label}"`);
    } catch (e) { flash(e.message, 'error'); }
  }

  async function removeRsvp() {
    try {
      await authFetch(`${api}/events/${eventId}/rsvp`, { method: 'DELETE' });
      setMyStatus(null);
      setRsvps(prev => prev.filter(r => r.user_id !== userId));
      flash('RSVP removed');
    } catch (e) { flash(e.message, 'error'); }
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      const res = await authFetch(`${api}/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, datetime: new Date(editForm.datetime).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEvent(prev => ({ ...prev, ...data.event }));
      setEditing(false);
      flash('Event updated!');
    } catch (e) { flash(e.message, 'error'); }
  }

  if (loading) return (
    <div className="min-h-screen bg-paper"><Navbar />
      <div className="pt-32 text-center text-ink-400">Loading…</div>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-paper"><Navbar />
      <div className="pt-32 text-center">
        <p className="text-xl font-display font-bold text-ink-800">Event not found.</p>
        <Link to="/groups" className="inline-flex items-center gap-1.5 text-brand-600 font-semibold hover:underline mt-2">
          <ArrowLeft className="w-4 h-4" /> Back to groups
        </Link>
      </div>
    </div>
  );

  const friendlyDate = new Date(event.datetime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const friendlyTime = new Date(event.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const isPast = new Date(event.datetime) < new Date();
  const goingCount = rsvps.filter(r => r.status === 'going').length;
  const maybeCount = rsvps.filter(r => r.status === 'maybe').length;

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-3xl mx-auto">

        {msg && (
          <div className={`mb-6 flex items-center gap-2 p-3 rounded-2xl text-sm font-medium ${msgType === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {msgType === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {msg}
          </div>
        )}

        {/* Breadcrumb */}
        <Link to={`/groups/${event.group_id}`} className="inline-flex items-center gap-1.5 text-sm text-brand-600 font-semibold hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> {event.cover_emoji} {event.group_name}
        </Link>

        {/* Event header */}
        <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {isPast && <span className="text-xs bg-ink-100 text-ink-500 font-semibold px-2.5 py-0.5 rounded-full">Past</span>}
                <h1 className="font-display font-bold text-2xl text-ink-900">{event.title}</h1>
              </div>
              <p className="text-sm text-ink-500 mt-1">Created by {event.creator_name}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm text-ink-700">
            <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-ink-300" />{friendlyDate}</p>
            <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-ink-300" />{friendlyTime}</p>
            {event.location && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-ink-300" />{event.location}</p>}
            {event.description && <p className="mt-3 text-ink-600 whitespace-pre-wrap">{event.description}</p>}
          </div>

          {/* RSVP counts */}
          <div className="flex gap-3 mt-5 pt-5 border-t border-ink-100 text-sm">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold"><Check className="w-4 h-4" />{goingCount} going</span>
            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold"><HelpCircle className="w-4 h-4" />{maybeCount} maybe</span>
          </div>

          {/* RSVP buttons */}
          {isUser && !isPast && (
            <div className="mt-4">
              {myStatus ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusPill status={myStatus} solid />
                  <span className="text-xs text-ink-400">Change:</span>
                  {['going', 'maybe', 'not_going'].filter(s => s !== myStatus).map(s => (
                    <button key={s} onClick={() => rsvp(s)}
                      className="text-xs text-ink-500 hover:text-ink-800 underline">
                      {STATUS[s].label}
                    </button>
                  ))}
                  <button onClick={removeRsvp} className="text-xs text-rose-400 hover:text-rose-600 underline">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {['going', 'maybe', 'not_going'].map(s => {
                    const { Icon, label, solid } = STATUS[s];
                    return (
                      <button key={s} onClick={() => rsvp(s)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${solid} hover:opacity-90`}>
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit form */}
        {editing && (
          <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
            <h2 className="font-display font-bold text-ink-900 mb-4">Edit Event</h2>
            <form onSubmit={saveEdit} className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Title</span>
                <input className={inputClass}
                  value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Date & Time</span>
                <input type="datetime-local" className={inputClass}
                  value={editForm.datetime} onChange={e => setEditForm(f => ({ ...f, datetime: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Location</span>
                <input className={inputClass}
                  placeholder="e.g. Hayarkon Park, Tel Aviv"
                  value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Description</span>
                <textarea rows={3} className={inputClass}
                  value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </label>
              <div className="flex gap-3">
                <button type="submit" className="bg-brand-500 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-brand-600 transition shadow-pill">Save</button>
                <button type="button" onClick={() => setEditing(false)} className="text-ink-500 px-4 py-2.5 rounded-full hover:bg-ink-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Attendees */}
        {rsvps.length > 0 && (
          <div className="bg-white rounded-3xl shadow-card overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-ink-100">
              <h2 className="font-display font-bold text-ink-900">Attendees</h2>
            </div>
            <ul className="divide-y divide-ink-50">
              {rsvps.map(r => (
                <li key={r.user_id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                      {r.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-ink-800">{r.name}</span>
                  </div>
                  <StatusPill status={r.status} />
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
