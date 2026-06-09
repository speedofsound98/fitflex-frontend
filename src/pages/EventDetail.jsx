// src/pages/EventDetail.jsx
import authFetch from '../utils/authFetch';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';

const api = import.meta.env.VITE_API_URL;

const STATUS_LABELS = { going: '✅ Going', maybe: '🤔 Maybe', not_going: '❌ Not going' };
const STATUS_STYLES = {
  going: 'bg-green-600 text-white',
  maybe: 'bg-yellow-500 text-white',
  not_going: 'bg-gray-300 text-gray-700',
};

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
      flash(STATUS_LABELS[status]);
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
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="pt-32 text-center text-gray-400">Loading…</div>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="pt-32 text-center">
        <p className="text-xl font-semibold text-gray-700">Event not found.</p>
        <Link to="/groups" className="text-blue-600 hover:underline mt-2 block">← Back to groups</Link>
      </div>
    </div>
  );

  const friendlyDate = new Date(event.datetime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const friendlyTime = new Date(event.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const isPast = new Date(event.datetime) < new Date();
  const goingCount = rsvps.filter(r => r.status === 'going').length;
  const maybeCount = rsvps.filter(r => r.status === 'maybe').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-3xl mx-auto">

        {msg && (
          <div className={`mb-6 p-3 rounded-xl text-sm font-medium ${msgType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {msg}
          </div>
        )}

        {/* Breadcrumb */}
        <Link to={`/groups/${event.group_id}`} className="text-sm text-blue-600 hover:underline mb-6 block">
          ← {event.cover_emoji} {event.group_name}
        </Link>

        {/* Event header */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {isPast && <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">Past</span>}
                <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">Created by {event.creator_name}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-700">
            <p>📅 {friendlyDate}</p>
            <p>🕐 {friendlyTime}</p>
            {event.location && <p>📍 {event.location}</p>}
            {event.description && <p className="mt-3 text-gray-600 whitespace-pre-wrap">{event.description}</p>}
          </div>

          {/* RSVP counts */}
          <div className="flex gap-4 mt-5 pt-5 border-t text-sm">
            <span className="text-green-600 font-semibold">✅ {goingCount} going</span>
            <span className="text-yellow-600 font-semibold">🤔 {maybeCount} maybe</span>
          </div>

          {/* RSVP buttons */}
          {isUser && !isPast && (
            <div className="mt-4">
              {myStatus ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-sm font-semibold px-3 py-1.5 rounded-xl ${STATUS_STYLES[myStatus]}`}>
                    {STATUS_LABELS[myStatus]}
                  </span>
                  <span className="text-xs text-gray-400">Change:</span>
                  {['going', 'maybe', 'not_going'].filter(s => s !== myStatus).map(s => (
                    <button key={s} onClick={() => rsvp(s)}
                      className="text-xs text-gray-500 hover:text-gray-800 underline">
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                  <button onClick={removeRsvp} className="text-xs text-red-400 hover:text-red-600 underline">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {['going', 'maybe', 'not_going'].map(s => (
                    <button key={s} onClick={() => rsvp(s)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${STATUS_STYLES[s]} hover:opacity-90`}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit form */}
        {editing && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="font-bold text-gray-800 mb-4">Edit Event</h2>
            <form onSubmit={saveEdit} className="space-y-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Title</span>
                <input className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editForm.title} onChange={e => setEditForm(f => ({...f, title: e.target.value}))} required />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Date & Time</span>
                <input type="datetime-local" className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editForm.datetime} onChange={e => setEditForm(f => ({...f, datetime: e.target.value}))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Location</span>
                <input className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="e.g. Hayarkon Park, Tel Aviv"
                  value={editForm.location} onChange={e => setEditForm(f => ({...f, location: e.target.value}))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Description</span>
                <textarea rows={3} className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editForm.description} onChange={e => setEditForm(f => ({...f, description: e.target.value}))} />
              </label>
              <div className="flex gap-3">
                <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition">Save</button>
                <button type="button" onClick={() => setEditing(false)} className="text-gray-500 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Attendees */}
        {rsvps.length > 0 && (
          <div className="bg-white rounded-2xl shadow overflow-hidden mb-6">
            <div className="px-6 py-4 border-b">
              <h2 className="font-bold text-gray-800">Attendees</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {rsvps.map(r => (
                <li key={r.user_id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {r.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{r.name}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.status === 'going' ? 'bg-green-100 text-green-700' : r.status === 'maybe' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
