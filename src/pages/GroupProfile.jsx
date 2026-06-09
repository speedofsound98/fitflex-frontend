// src/pages/GroupProfile.jsx  — group detail page
import authFetch from '../utils/authFetch';
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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

export default function GroupProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

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
        setEditForm({
          name: d.group.name,
          sport_type: d.group.sport_type || '',
          city: d.group.city || '',
          description: d.group.description || '',
          cover_emoji: d.group.cover_emoji || '🏃',
          is_private: d.group.is_private || false,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const myMembership = members.find(m => m.id === userId);
  const isMember = !!myMembership;
  const isAdmin = myMembership?.role === 'admin';

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
      flash('You joined the group! 🎉');
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
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="pt-32 text-center text-gray-400">Loading…</div>
    </div>
  );

  if (!group) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="pt-32 text-center">
        <p className="text-xl font-semibold text-gray-700">Group not found.</p>
        <Link to="/groups" className="text-blue-600 hover:underline mt-2 block">← Back to groups</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">

        {msg && (
          <div className={`mb-6 p-3 rounded-xl text-sm font-medium ${msgType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {msg}
          </div>
        )}

        {/* Group header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl p-8 text-white mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-6xl">{group.cover_emoji}</span>
              <div>
                <h1 className="text-3xl font-extrabold">{group.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-blue-100 text-sm">
                  {group.sport_type && <span>🏷️ {group.sport_type}</span>}
                  {group.city && <span>📍 {group.city}</span>}
                  <span>👥 {group.member_count} member{group.member_count !== 1 ? 's' : ''}</span>
                  {group.is_private && <span>🔒 Private</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <>
                  <button onClick={() => setEditing(o => !o)}
                    className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-xl transition font-semibold">
                    Edit
                  </button>
                  <button onClick={deleteGroup}
                    className="bg-red-500/80 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-xl transition font-semibold">
                    Delete
                  </button>
                </>
              )}
              {isUser && !isMember && !group.is_private && (
                <button onClick={join}
                  className="bg-white text-blue-600 font-semibold px-5 py-2 rounded-xl hover:bg-blue-50 transition text-sm">
                  Join Group
                </button>
              )}
              {isUser && isMember && !isAdmin && (
                <button onClick={leave}
                  className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-xl transition font-semibold">
                  Leave
                </button>
              )}
            </div>
          </div>
          {group.description && <p className="mt-4 text-blue-50 max-w-xl">{group.description}</p>}
        </div>

        {/* Edit form */}
        {editing && (
          <div className="bg-white rounded-2xl shadow p-6 mb-8">
            <h2 className="font-bold text-gray-800 mb-4">Edit Group</h2>
            <form onSubmit={saveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-sm font-medium text-gray-700">Group name</span>
                <input className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Sport type</span>
                <select className="border border-gray-200 p-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editForm.sport_type} onChange={e => setEditForm(f => ({...f, sport_type: e.target.value}))}>
                  <option value="">— Select —</option>
                  {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">City</span>
                <input className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editForm.city} onChange={e => setEditForm(f => ({...f, city: e.target.value}))} />
              </label>
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-sm font-medium text-gray-700">Description</span>
                <textarea rows={2} className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editForm.description} onChange={e => setEditForm(f => ({...f, description: e.target.value}))} />
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Emoji</span>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(emoji => (
                    <button key={emoji} type="button"
                      onClick={() => setEditForm(f => ({...f, cover_emoji: emoji}))}
                      className={`text-xl p-1.5 rounded-lg transition ${editForm.cover_emoji === emoji ? 'bg-blue-100 ring-2 ring-blue-400' : 'hover:bg-gray-100'}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Visibility</span>
                <label className="flex items-center gap-3 cursor-pointer mt-1">
                  <div onClick={() => setEditForm(f => ({...f, is_private: !f.is_private}))}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex items-center px-0.5 ${editForm.is_private ? 'bg-blue-600' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${editForm.is_private ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-gray-600">{editForm.is_private ? '🔒 Private' : '🌐 Public'}</span>
                </label>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition">Save</button>
                <button type="button" onClick={() => setEditing(false)} className="text-gray-500 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Members */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Members ({members.length})</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {members.map(m => (
              <li key={m.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{m.name}</span>
                </div>
                {m.role === 'admin' && (
                  <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">Admin</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <Link to="/groups" className="text-sm text-blue-600 hover:underline">← Back to all groups</Link>
        </div>

      </div>
    </div>
  );
}
