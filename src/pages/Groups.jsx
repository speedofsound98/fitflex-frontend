// src/pages/Groups.jsx  — browse & create groups
import authFetch from '../utils/authFetch';
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/NavBar';
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
    <div className="bg-white rounded-2xl shadow hover:shadow-md transition p-5 flex flex-col gap-3">
      <Link to={`/groups/${group.id}`} className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{group.cover_emoji}</span>
          <div>
            <h3 className="font-bold text-gray-800">{group.name}</h3>
            {group.sport_type && <p className="text-xs text-blue-600 font-medium">{group.sport_type}</p>}
          </div>
        </div>
        {isMember && (
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">Joined</span>
        )}
      </Link>
      {group.description && (
        <p className="text-sm text-gray-500 line-clamp-2">{group.description}</p>
      )}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {group.city && <span>📍 {group.city}</span>}
          <span>👥 {group.member_count} member{group.member_count !== 1 ? 's' : ''}</span>
        </div>
        {isLoggedIn && (
          isMember ? (
            <button onClick={e => { e.preventDefault(); onLeave(group.id); }}
              className="text-xs text-gray-400 hover:text-red-500 font-semibold transition">
              Leave
            </button>
          ) : (
            !group.is_private && (
              <button onClick={e => { e.preventDefault(); onJoin(group.id, group.name); }}
                className="text-xs bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                + Join
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
      setMyGroups(prev => [...prev, { ...groups.find(g => g.id === groupId), member_count: (groups.find(g => g.id === groupId)?.member_count || 0) + 1, role: 'member' }]);
      setMsgType('success');
      setMsg(`Joined ${groupName}! 🎉`);
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
      setForm({ name: '', sport_type: '', city: '', description: '', cover_emoji: '🏃', is_private: false });
      setMsgType('success');
      setMsg(`Group "${data.group.name}" created! 🎉`);
    } catch (e) {
      setMsgType('error');
      setMsg(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
            <p className="text-gray-500 mt-1">Find your tribe — run clubs, football teams, yoga crews and more.</p>
          </div>
          {isLoggedIn && (
            <button
              onClick={() => setShowCreate(o => !o)}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition text-sm"
            >
              + Create Group
            </button>
          )}
        </div>

        {msg && (
          <div className={`mb-6 p-3 rounded-xl text-sm font-medium ${msgType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {msg}
          </div>
        )}

        {/* Create group form */}
        {showCreate && (
          <div className="bg-white rounded-2xl shadow p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Create a new group</h2>
            <form onSubmit={createGroup} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-sm font-medium text-gray-700">Group name *</span>
                <input className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="e.g. Tel Aviv Running Club" value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Sport type</span>
                <select className="border border-gray-200 p-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.sport_type} onChange={e => setForm(f => ({...f, sport_type: e.target.value}))}>
                  <option value="">— Select —</option>
                  {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">City</span>
                <input className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="e.g. Tel Aviv" value={form.city}
                  onChange={e => setForm(f => ({...f, city: e.target.value}))} />
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-sm font-medium text-gray-700">Description</span>
                <textarea rows={2} className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="What's this group about?" value={form.description}
                  onChange={e => setForm(f => ({...f, description: e.target.value}))} />
              </label>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Group emoji</span>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(emoji => (
                    <button key={emoji} type="button"
                      onClick={() => setForm(f => ({...f, cover_emoji: emoji}))}
                      className={`text-xl p-1.5 rounded-lg transition ${form.cover_emoji === emoji ? 'bg-blue-100 ring-2 ring-blue-400' : 'hover:bg-gray-100'}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Visibility</span>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm(f => ({...f, is_private: !f.is_private}))}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex items-center px-0.5 ${form.is_private ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.is_private ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-gray-600">{form.is_private ? '🔒 Private' : '🌐 Public'}</span>
                </label>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Feed visibility</span>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm(f => ({...f, is_feed_public: !f.is_feed_public}))}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex items-center px-0.5 ${form.is_feed_public ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.is_feed_public ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-gray-600">{form.is_feed_public ? '🌐 Public feed' : '🔒 Members only'}</span>
                </label>
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition">Create Group</button>
                <button type="button" onClick={() => setShowCreate(false)} className="text-gray-500 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* My groups */}
        {isLoggedIn && myGroups.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">My Groups</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myGroups.map(g => <GroupCard key={g.id} group={g} myGroupIds={myGroupIds} onJoin={joinGroup} onLeave={leaveGroup} isLoggedIn={isLoggedIn} />)}
            </div>
          </section>
        )}

        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              placeholder="Search groups…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-600"
            value={sportFilter} onChange={e => setSportFilter(e.target.value)}>
            <option value="">All sports</option>
            {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="📍 Filter by city" value={cityFilter} onChange={e => setCityFilter(e.target.value)} />
        </div>

        {/* All groups */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {search || sportFilter || cityFilter ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : 'All Groups'}
          </h2>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-3">🤷</p>
              <p className="font-medium">No groups found.</p>
              {isLoggedIn && <p className="text-sm mt-1">Why not create the first one?</p>}
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
