// src/pages/Groups.jsx  — browse & create groups
import authFetch from '../utils/authFetch';
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Users, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/NavBar';
import Toggle from '../components/Toggle';
import { inputClass } from '../components/AuthShell';
import usePageTitle from '../hooks/usePageTitle';

const api = import.meta.env.VITE_API_URL;

const SPORT_TYPES = [
  'Yoga', 'Pilates', 'HIIT', 'Cycling', 'Boxing',
  'Swimming', 'CrossFit', 'Dance', 'Martial Arts',
  'Shiatsu', 'Running', 'Football', 'Basketball',
  'Tennis', 'Other',
];

const EMOJIS = ['🏃', '⚽', '🏀', '🎾', '🏊', '🚴', '🥊', '🧘', '🤸', '💪', '🏋️', '🥋', '💃', '🏌️', '🎽'];

function GroupCard({ group, myGroupIds, onJoin, onLeave, isLoggedIn }) {
  const isMember = myGroupIds.has(group.id);
  return (
    <div className="bg-white rounded-3xl shadow-card hover:-translate-y-1 hover:shadow-card-lg transition duration-300 p-6 flex flex-col gap-3">
      <Link to={`/groups/${group.id}`} className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{group.cover_emoji}</span>
          <div>
            <h3 className="font-display font-bold text-ink-900 leading-tight">{group.name}</h3>
            {group.sport_type && <p className="text-xs text-brand-600 font-semibold mt-0.5">{group.sport_type}</p>}
          </div>
        </div>
        {isMember && (
          <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">Joined</span>
        )}
      </Link>
      {group.description && (
        <p className="text-sm text-ink-500 line-clamp-2">{group.description}</p>
      )}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3 text-xs text-ink-400">
          {group.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{group.city}</span>}
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{group.member_count} member{group.member_count !== 1 ? 's' : ''}</span>
        </div>
        {isLoggedIn && (
          isMember ? (
            <button onClick={e => { e.preventDefault(); onLeave(group.id); }}
              className="text-xs text-ink-400 hover:text-rose-500 font-semibold transition">
              Leave
            </button>
          ) : (
            !group.is_private && (
              <button onClick={e => { e.preventDefault(); onJoin(group.id, group.name); }}
                className="inline-flex items-center gap-1 text-xs bg-brand-500 text-white font-semibold px-3 py-1.5 rounded-full hover:bg-brand-600 transition shadow-pill">
                <Plus className="w-3.5 h-3.5" /> Join
              </button>
            )
          )
        )}
      </div>
    </div>
  );
}

export default function Groups() {
  usePageTitle('Communities');
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', sport_type: '', city: '', description: '', cover_emoji: '🏃', is_private: false, is_feed_public: false });
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const uid = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    setUserId(uid);
    // Show join/leave for any logged-in non-studio account
    setIsLoggedIn(!!uid && role !== 'studio');
  }, []);

  useEffect(() => {
    fetch(`${api}/groups`)
      .then(r => r.json())
      .then(d => setGroups(d.groups || []));
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !userId) return;
    authFetch(`${api}/users/${userId}/groups`)
      .then(r => r.json())
      .then(d => setMyGroups(d.groups || []));
  }, [isLoggedIn, userId]);

  const myGroupIds = useMemo(() => new Set(myGroups.map(g => g.id)), [myGroups]);

  const filtered = useMemo(() => {
    return groups.filter(g => {
      const q = search.toLowerCase();
      const matchSearch = !q || g.name.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q) || (g.city || '').toLowerCase().includes(q);
      const matchSport = !sportFilter || g.sport_type === sportFilter;
      const matchCity = !cityFilter || (g.city || '').toLowerCase().includes(cityFilter.toLowerCase());
      return matchSearch && matchSport && matchCity;
    });
  }, [groups, search, sportFilter, cityFilter]);

  async function joinGroup(groupId, groupName) {
    if (!isLoggedIn) return;
    try {
      const res = await authFetch(`${api}/groups/${groupId}/join`, { method: 'POST' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, member_count: g.member_count + 1 } : g));
      setMyGroups(prev => {
        const g = groups.find(g => g.id === groupId);
        return [...prev, { ...(g || {}), id: groupId, name: groupName, role: 'member' }];
      });
      setMsgType('success');
      setMsg(`Joined ${groupName}!`);
    } catch (e) { setMsgType('error'); setMsg(e.message); }
  }

  async function leaveGroup(groupId) {
    try {
      await authFetch(`${api}/groups/${groupId}/leave`, { method: 'DELETE' });
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, member_count: Math.max(0, g.member_count - 1) } : g));
      setMyGroups(prev => prev.filter(g => g.id !== groupId));
      setMsgType('success');
      setMsg('Left the group.');
    } catch (e) { setMsgType('error'); setMsg(e.message); }
  }

  async function createGroup(e) {
    e.preventDefault();
    try {
      const res = await authFetch(`${api}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create group');
      setGroups(prev => [{ ...data.group, member_count: 1 }, ...prev]);
      setMyGroups(prev => [{ ...data.group, member_count: 1, role: 'admin' }, ...prev]);
      setShowCreate(false);
      setForm({ name: '', sport_type: '', city: '', description: '', cover_emoji: '🏃', is_private: false, is_feed_public: false });
      setMsgType('success');
      setMsg(`Group "${data.group.name}" created!`);
    } catch (e) {
      setMsgType('error');
      setMsg(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500 mb-2">Communities</p>
            <h1 className="font-display font-bold text-4xl text-ink-900 leading-tight">Find your tribe.</h1>
            <p className="text-ink-500 mt-2">Run clubs, football teams, yoga crews and more.</p>
          </div>
          {isLoggedIn && (
            <button
              onClick={() => setShowCreate(o => !o)}
              className="inline-flex items-center gap-1.5 bg-brand-500 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-brand-600 transition text-sm shadow-pill"
            >
              <Plus className="w-4 h-4" /> Create Group
            </button>
          )}
        </div>

        {msg && (
          <div className={`mb-6 flex items-center gap-2 p-3 rounded-2xl text-sm font-medium ${msgType === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {msgType === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {msg}
          </div>
        )}

        {/* Create group form */}
        {showCreate && (
          <div className="bg-white rounded-3xl shadow-card p-6 mb-8">
            <h2 className="font-display font-bold text-lg text-ink-900 mb-4">Create a new group</h2>
            <form onSubmit={createGroup} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-sm font-medium text-ink-700">Group name *</span>
                <input className={inputClass}
                  placeholder="e.g. Tel Aviv Running Club" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Sport type</span>
                <select className={`${inputClass} !bg-white`}
                  value={form.sport_type} onChange={e => setForm(f => ({ ...f, sport_type: e.target.value }))}>
                  <option value="">— Select —</option>
                  {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">City</span>
                <input className={inputClass}
                  placeholder="e.g. Tel Aviv" value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </label>

              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-sm font-medium text-ink-700">Description</span>
                <textarea rows={2} className={inputClass}
                  placeholder="What's this group about?" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </label>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Group emoji</span>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(emoji => (
                    <button key={emoji} type="button"
                      onClick={() => setForm(f => ({ ...f, cover_emoji: emoji }))}
                      className={`text-xl p-1.5 rounded-xl transition ${form.cover_emoji === emoji ? 'bg-brand-100 ring-2 ring-brand-400' : 'hover:bg-paper'}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-paper rounded-2xl">
                  <span className="text-sm text-ink-700">{form.is_private ? 'Private group' : 'Public group'}</span>
                  <Toggle checked={form.is_private} onChange={() => setForm(f => ({ ...f, is_private: !f.is_private }))} />
                </div>
                <div className="flex items-center justify-between p-3 bg-paper rounded-2xl">
                  <span className="text-sm text-ink-700">{form.is_feed_public ? 'Public feed' : 'Members-only feed'}</span>
                  <Toggle checked={form.is_feed_public} onChange={() => setForm(f => ({ ...f, is_feed_public: !f.is_feed_public }))} />
                </div>
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="bg-brand-500 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-brand-600 transition shadow-pill">Create Group</button>
                <button type="button" onClick={() => setShowCreate(false)} className="text-ink-500 px-4 py-2.5 rounded-full hover:bg-ink-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* My groups */}
        {isLoggedIn && myGroups.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display font-bold text-xl text-ink-900 mb-4">My Groups</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myGroups.map(g => <GroupCard key={g.id} group={g} myGroupIds={myGroupIds} onJoin={joinGroup} onLeave={leaveGroup} isLoggedIn={isLoggedIn} />)}
            </div>
          </section>
        )}

        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-300" strokeWidth={2} />
            <input className="w-full bg-white rounded-full pl-11 pr-4 py-3 text-sm shadow-card border border-transparent focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition"
              placeholder="Search groups…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="bg-white rounded-full px-5 py-3 text-sm shadow-card border border-transparent focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 text-ink-600 transition"
            value={sportFilter} onChange={e => setSportFilter(e.target.value)}>
            <option value="">All sports</option>
            {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="bg-white rounded-full px-5 py-3 text-sm shadow-card border border-transparent focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition"
            placeholder="Filter by city" value={cityFilter} onChange={e => setCityFilter(e.target.value)} />
        </div>

        {/* All groups */}
        <section>
          <h2 className="font-display font-bold text-xl text-ink-900 mb-4">
            {search || sportFilter || cityFilter ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : 'All Groups'}
          </h2>
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 mx-auto mb-3">
                <Users className="w-6 h-6" />
              </span>
              <p className="font-medium text-ink-700">No groups found.</p>
              {isLoggedIn && <p className="text-sm text-ink-400 mt-1">Why not create the first one?</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(g => <GroupCard key={g.id} group={g} myGroupIds={myGroupIds} onJoin={joinGroup} onLeave={leaveGroup} isLoggedIn={isLoggedIn} />)}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
