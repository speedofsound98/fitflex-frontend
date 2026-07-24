// src/components/GroupFeed.jsx  — posts + comments for a group
import authFetch from '../utils/authFetch';
import React, { useEffect, useState } from 'react';
import { Megaphone, MessageCircle, Lock, Send, X } from 'lucide-react';

const api = import.meta.env.VITE_API_URL;

function timeAgo(date) {
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({ name, size = 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${sz} rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function CommentThread({ postId, isMember, currentUserId, isAdmin }) {
  const [comments, setComments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    fetch(`${api}/posts/${postId}/comments`)
      .then(r => r.json())
      .then(d => { setComments(d.comments || []); setLoaded(true); });
  }, [postId]);

  async function addComment(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await authFetch(`${api}/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text.trim() }),
    });
    const data = await res.json();
    if (res.ok) { setComments(prev => [...prev, data.comment]); setText(''); }
  }

  async function deleteComment(id) {
    await authFetch(`${api}/comments/${id}`, { method: 'DELETE' });
    setComments(prev => prev.filter(c => c.id !== id));
  }

  if (!loaded) return <p className="text-xs text-ink-400 px-4 pb-3">Loading…</p>;

  return (
    <div className="px-4 pb-4 space-y-3">
      {comments.map(c => (
        <div key={c.id} className="flex gap-2">
          <Avatar name={c.user_name} size="sm" />
          <div className="flex-1 bg-paper rounded-2xl px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-700">{c.user_name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-400">{timeAgo(c.created_at)}</span>
                {(c.user_id === currentUserId || isAdmin) && (
                  <button onClick={() => deleteComment(c.id)} className="text-ink-300 hover:text-rose-500 transition"><X className="w-3.5 h-3.5" /></button>
                )}
              </div>
            </div>
            <p className="text-sm text-ink-700 mt-0.5">{c.content}</p>
          </div>
        </div>
      ))}
      {isMember && (
        <form onSubmit={addComment} className="flex gap-2">
          <input
            className="flex-1 bg-paper border border-transparent rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition"
            placeholder="Write a comment…"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button type="submit" disabled={!text.trim()}
            className="inline-flex items-center gap-1.5 bg-brand-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill disabled:opacity-40">
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </form>
      )}
    </div>
  );
}

export default function GroupFeed({ groupId, isMember, isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [feedLocked, setFeedLocked] = useState(false);
  const [text, setText] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [openComments, setOpenComments] = useState({});
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(true);

  const currentUserId = Number(localStorage.getItem('userId'));

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(`${api}/groups/${groupId}/posts`, { headers, credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.feedPrivate) { setFeedLocked(true); return; }
        setPosts(d.posts || []);
      });
  }, [groupId]);

  async function broadcast(e) {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    const res = await authFetch(`${api}/groups/${groupId}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: broadcastText.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsgOk(true);
      setMsg(`Broadcast sent to ${data.sent} member${data.sent !== 1 ? 's' : ''}!`);
      setBroadcastText('');
      setShowBroadcast(false);
      setTimeout(() => setMsg(''), 4000);
    }
  }

  async function createPost(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await authFetch(`${api}/groups/${groupId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setPosts(prev => [data.post, ...prev]);
      setText('');
    } else {
      setMsgOk(false);
      setMsg(data.error || 'Failed to post');
      setTimeout(() => setMsg(''), 3000);
    }
  }

  async function deletePost(id) {
    if (!confirm('Delete this post?')) return;
    await authFetch(`${api}/posts/${id}`, { method: 'DELETE' });
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  function toggleComments(postId) {
    setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  }

  if (feedLocked) {
    return (
      <div className="bg-white rounded-3xl shadow-card px-6 py-12 text-center">
        <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </span>
        <p className="font-display font-bold text-ink-800">This feed is members only</p>
        <p className="text-sm text-ink-400 mt-1">Join the group to see and post in the feed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Broadcast (admin only) */}
      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
              <Megaphone className="w-4 h-4" /> Broadcast to all members
            </p>
            <button onClick={() => setShowBroadcast(o => !o)} className="text-xs text-amber-700 font-semibold hover:underline">
              {showBroadcast ? 'Cancel' : 'Compose'}
            </button>
          </div>
          {showBroadcast && (
            <form onSubmit={broadcast} className="flex flex-col gap-2">
              <textarea rows={2} className="w-full bg-white border border-amber-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                placeholder="Send an announcement to everyone in this group…"
                value={broadcastText} onChange={e => setBroadcastText(e.target.value)} />
              <button type="submit" disabled={!broadcastText.trim()}
                className="self-end bg-amber-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-40">
                Send to all
              </button>
            </form>
          )}
        </div>
      )}

      {isMember && (
        <div className="bg-white rounded-3xl shadow-card p-4">
          {msg && <p className={`text-sm mb-2 ${msgOk ? 'text-emerald-600' : 'text-rose-500'}`}>{msg}</p>}
          <form onSubmit={createPost} className="flex flex-col gap-3">
            <textarea
              rows={2}
              className="w-full bg-paper border border-transparent rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 resize-none transition"
              placeholder="Share something with the group…"
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div className="flex justify-end">
              <button type="submit" disabled={!text.trim()}
                className="bg-brand-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill disabled:opacity-40">
                Post
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-card px-6 py-10 text-center">
          <span className="inline-grid place-items-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 mx-auto mb-2">
            <MessageCircle className="w-5 h-5" />
          </span>
          <p className="font-medium text-ink-700">No posts yet.</p>
          {isMember && <p className="text-sm text-ink-400 mt-1">Be the first to post something!</p>}
        </div>
      ) : posts.map(post => (
        <div key={post.id} className="bg-white rounded-3xl shadow-card overflow-hidden">
          {/* Post header */}
          <div className="flex items-start gap-3 px-4 pt-4 pb-3">
            <Avatar name={post.user_name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-ink-800">{post.user_name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-400">{timeAgo(post.created_at)}</span>
                  {(post.user_id === currentUserId || isAdmin) && (
                    <button onClick={() => deletePost(post.id)} className="text-ink-300 hover:text-rose-500 transition"><X className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
              <p className="text-sm text-ink-700 mt-1 whitespace-pre-wrap">{post.content}</p>
            </div>
          </div>

          {/* Comment toggle */}
          <div className="px-4 pb-3 border-t border-ink-50 pt-2">
            <button
              onClick={() => toggleComments(post.id)}
              className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-brand-600 font-medium transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {openComments[post.id] ? 'Hide' : (post.comment_count > 0 ? `${post.comment_count} comment${post.comment_count !== 1 ? 's' : ''}` : 'Comment')}
            </button>
          </div>

          {/* Comments */}
          {openComments[post.id] && (
            <CommentThread
              postId={post.id}
              isMember={isMember}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          )}
        </div>
      ))}
    </div>
  );
}
