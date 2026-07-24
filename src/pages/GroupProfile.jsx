// src/pages/GroupProfile.jsx  — group detail page
import authFetch from '../utils/authFetch';
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MessageCircle, CalendarDays, Users, Tag, MapPin, Lock, Plus,
  ArrowLeft, AlertCircle, CheckCircle2,
} from 'lucide-react';
import Navbar from '../components/NavBar';
import Toggle from '../components/Toggle';
import { inputClass } from '../components/AuthShell';
import usePageTitle from '../hooks/usePageTitle';
import GroupFeed from '../components/GroupFeed';

const api = import.meta.env.VITE_API_URL;

const SPORT_TYPES = [
  'Yoga', 'Pilates', 'HIIT', 'Cycling', 'Boxing',
  'Swimming', 'CrossFit', 'Dance', 'Martial Arts',
  'Shiatsu', 'Running', 'Football', 'Basketball',
  'Tennis', 'Other',
];

const EMOJIS = ['🏃', '⚽', '🏀', '🎾', '🏊', '🚴', '🥊', '🧘', '🤸', '💪', '🏋️', '🥋', '💃', '🏌️', '🎽'];

export default function GroupProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', datetime: '', location: '' });

  function nextHour() {
    const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  }

  usePageTitle(group ? group.name : 'Group');

  const userId = Number(localStorage.getItem('userId'));
  const userRole = localStorage.getItem('userRole');
  const isUser = userRole === 'user';

  useEffect(() => {
    fetch(`${api}/groups/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setLoading(false); return; }
        setGroup(d.group);
        setMembers(d.members || []);
        fetch(`${api}/groups/${id}/events`)
          .then(r => r.json())
          .then(e => setEvents(e.events || []))
          .catch(() => {});
        setEditForm({
          name: d.group.name,
          sport_type: d.group.sport_type || '',
          city: d.group.city || '',
          description: d.group.description || '',
          cover_emoji: d.group.cover_emoji || '🏃',
          is_private: d.group.is_private || false,
          is_feed_public: d.group.is_feed_public || false,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const myMembership = members.find(m => m.id === userId);
  const isMember = !!myMembership;
  const isAdmin = myMembership?.role === 'admin';
  const [activeTab, setActiveTab] = useState('feed');

  const TABS = [
    { key: 'feed', label: 'Feed', icon: MessageCircle },
    { key: 'events', label: 'Events', icon: CalendarDays },
    { key: 'members', label: 'Members', icon: Users },
  ];

  function flash(m, type = 'success') {
    setMsg(m); setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  }

  async function join() {
    try {
      const res = await authFetch(`${api}/groups/${id}/join`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembers(prev => [...prev, { id: userId, name: localStorage.getItem('userName'), role: 'member', joined_at: new Date() }]);
      setGroup(g => ({ ...g, member_count: g.member_count + 1 }));
      flash('You joined the group!');
    } catch (e) { flash(e.message, 'error'); }
  }

  async function leave() {
    if (!confirm('Leave this group?')) return;
    try {
      await authFetch(`${api}/groups/${id}/leave`, { method: 'DELETE' });
      setMembers(prev => prev.filter(m => m.id !== userId));
      setGroup(g => ({ ...g, member_count: g.member_count - 1 }));
      flash('You left the group.');
    } catch (e) { flash(e.message, 'error'); }
  }

  async function createEvent(e) {
    e.preventDefault();
    try {
      const res = await authFetch(`${api}/groups/${id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eventForm, datetime: new Date(eventForm.datetime).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEvents(prev => [...prev, { ...data.event, going_count: 0, maybe_count: 0 }].sort((a, b) => new Date(a.datetime) - new Date(b.datetime)));
      setShowEventForm(false);
      setEventForm({ title: '', description: '', datetime: '', location: '' });
      flash('Event created! Members have been notified.');
    } catch (e) { flash(e.message, 'error'); }
  }

  async function deleteGroup() {
    if (!confirm('Delete this group? This cannot be undone.')) return;
    try {
      await authFetch(`${api}/groups/${id}`, { method: 'DELETE' });
      navigate('/groups');
    } catch (e) { flash(e.message, 'error'); }
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      const res = await authFetch(`${api}/groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGroup(data.group);
      setEditing(false);
      flash('Group updated!');
    } catch (e) { flash(e.message, 'error'); }
  }

  if (loading) return (
    <div className="min-h-screen bg-paper"><Navbar />
      <div className="pt-32 text-center text-ink-400">Loading…</div>
    </div>
  );

  if (!group) return (
    <div className="min-h-screen bg-paper"><Navbar />
      <div className="pt-32 text-center">
        <p className="text-xl font-display font-bold text-ink-800">Group not found.</p>
        <Link to="/groups" className="inline-flex items-center gap-1.5 text-brand-600 font-semibold hover:underline mt-2">
          <ArrowLeft className="w-4 h-4" /> Back to groups
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">

        {msg && (
          <div className={`mb-6 flex items-center gap-2 p-3 rounded-2xl text-sm font-medium ${msgType === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {msgType === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {msg}
          </div>
        )}

        {/* Group header */}
        <div className="bg-gradient-to-br from-ink-800 to-ink-600 rounded-3xl shadow-card-lg p-8 text-white mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-6xl">{group.cover_emoji}</span>
              <div>
                <h1 className="font-display font-bold text-3xl leading-tight">{group.name}</h1>
                <div className="flex items-center gap-3 mt-2 text-white/75 text-sm flex-wrap">
                  {group.sport_type && <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{group.sport_type}</span>}
                  {group.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{group.city}</span>}
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{group.member_count} member{group.member_count !== 1 ? 's' : ''}</span>
                  {group.is_private && <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" />Private</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <>
                  <button onClick={() => setEditing(o => !o)}
                    className="bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2 rounded-full transition font-semibold backdrop-blur-sm">
                    Edit
                  </button>
                  <button onClick={deleteGroup}
                    className="bg-rose-500/90 hover:bg-rose-600 text-white text-sm px-4 py-2 rounded-full transition font-semibold">
                    Delete
                  </button>
                </>
              )}
              {isUser && !isMember && !group.is_private && (
                <button onClick={join}
                  className="bg-white text-ink-900 font-semibold px-5 py-2 rounded-full hover:bg-brand-50 transition text-sm shadow-pill">
                  Join Group
                </button>
              )}
              {isUser && isMember && !isAdmin && (
                <button onClick={leave}
                  className="bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2 rounded-full transition font-semibold backdrop-blur-sm">
                  Leave
                </button>
              )}
            </div>
          </div>
          {group.description && <p className="mt-4 text-white/80 max-w-xl">{group.description}</p>}
        </div>

        {/* Edit form */}
        {editing && (
          <div className="bg-white rounded-3xl shadow-card p-6 mb-8">
            <h2 className="font-display font-bold text-ink-900 mb-4">Edit Group</h2>
            <form onSubmit={saveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-sm font-medium text-ink-700">Group name</span>
                <input className={inputClass}
                  value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Sport type</span>
                <select className={`${inputClass} !bg-white`}
                  value={editForm.sport_type} onChange={e => setEditForm(f => ({ ...f, sport_type: e.target.value }))}>
                  <option value="">— Select —</option>
                  {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">City</span>
                <input className={inputClass}
                  value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-sm font-medium text-ink-700">Description</span>
                <textarea rows={2} className={inputClass}
                  value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Emoji</span>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(emoji => (
                    <button key={emoji} type="button"
                      onClick={() => setEditForm(f => ({ ...f, cover_emoji: emoji }))}
                      className={`text-xl p-1.5 rounded-xl transition ${editForm.cover_emoji === emoji ? 'bg-brand-100 ring-2 ring-brand-400' : 'hover:bg-paper'}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:col-span-1">
                <div className="flex items-center justify-between p-3 bg-paper rounded-2xl">
                  <span className="text-sm text-ink-700">{editForm.is_private ? 'Private group' : 'Public group'}</span>
                  <Toggle checked={editForm.is_private} onChange={() => setEditForm(f => ({ ...f, is_private: !f.is_private }))} />
                </div>
                <div className="flex items-center justify-between p-3 bg-paper rounded-2xl">
                  <span className="text-sm text-ink-700">{editForm.is_feed_public ? 'Public feed' : 'Members-only feed'}</span>
                  <Toggle checked={editForm.is_feed_public} onChange={() => setEditForm(f => ({ ...f, is_feed_public: !f.is_feed_public }))} />
                </div>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="bg-brand-500 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-brand-600 transition shadow-pill">Save</button>
                <button type="button" onClick={() => setEditing(false)} className="text-ink-500 px-4 py-2.5 rounded-full hover:bg-ink-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-full shadow-card p-1 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full transition
                ${activeTab === key ? 'bg-brand-500 text-white shadow-pill' : 'text-ink-500 hover:text-ink-800'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Feed tab */}
        {activeTab === 'feed' && (
          <GroupFeed groupId={id} isMember={isMember} isAdmin={isAdmin} />
        )}

        {/* Events tab */}
        {activeTab === 'events' && (
        <div className="bg-white rounded-3xl shadow-card overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-ink-900">Events</h2>
            {isAdmin && (
              <button onClick={() => { setShowEventForm(o => !o); setEventForm(f => ({ ...f, datetime: nextHour() })); }}
                className="inline-flex items-center gap-1 text-sm text-brand-600 font-semibold hover:underline">
                <Plus className="w-4 h-4" /> New event
              </button>
            )}
          </div>

          {/* Create event form */}
          {showEventForm && (
            <div className="px-6 py-4 border-b border-ink-100 bg-paper">
              <form onSubmit={createEvent} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-xs font-medium text-ink-600">Event title *</span>
                  <input className={`${inputClass} !bg-white`}
                    placeholder="e.g. Sunday morning run" value={eventForm.title}
                    onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-ink-600">Date & Time *</span>
                  <input type="datetime-local" className={`${inputClass} !bg-white`}
                    value={eventForm.datetime} onChange={e => setEventForm(f => ({ ...f, datetime: e.target.value }))} required />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-ink-600">Location</span>
                  <input className={`${inputClass} !bg-white`}
                    placeholder="e.g. Hayarkon Park" value={eventForm.location}
                    onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))} />
                </label>
                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-xs font-medium text-ink-600">Description</span>
                  <textarea rows={2} className={`${inputClass} !bg-white`}
                    placeholder="Details, pace, what to bring..."
                    value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} />
                </label>
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" className="bg-brand-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill">Create</button>
                  <button type="button" onClick={() => setShowEventForm(false)} className="text-ink-500 px-4 py-2 rounded-full text-sm hover:bg-ink-50 transition">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {events.length === 0 ? (
            <p className="px-6 py-8 text-sm text-ink-400">No events yet.{isAdmin ? ' Create the first one!' : ''}</p>
          ) : (
            <ul className="divide-y divide-ink-50">
              {events.map(ev => {
                const isPast = new Date(ev.datetime) < new Date();
                return (
                  <li key={ev.id}>
                    <Link to={`/events/${ev.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-paper transition">
                      <div>
                        <p className={`font-semibold text-sm ${isPast ? 'text-ink-400' : 'text-ink-800'}`}>{ev.title}</p>
                        <p className="text-xs text-ink-400 mt-0.5">
                          {new Date(ev.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' · '}{new Date(ev.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          {ev.location && ` · ${ev.location}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-500 ml-4 shrink-0">
                        <span className="text-emerald-600 font-semibold">{ev.going_count} going</span>
                        <span className="text-amber-600 font-semibold">{ev.maybe_count} maybe</span>
                        {isPast && <span className="bg-ink-100 text-ink-400 px-2 py-0.5 rounded-full font-medium">Past</span>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        )}

        {/* Members tab */}
        {activeTab === 'members' && (
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-ink-900">Members ({members.length})</h2>
          </div>
          <ul className="divide-y divide-ink-50">
            {members.map(m => (
              <li key={m.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-ink-800">{m.name}</span>
                </div>
                {m.role === 'admin' && (
                  <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2.5 py-0.5 rounded-full">Admin</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        )}

        <div className="mt-6">
          <Link to="/groups" className="inline-flex items-center gap-1.5 text-sm text-brand-600 font-semibold hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to all groups
          </Link>
        </div>

      </div>
    </div>
  );
}
