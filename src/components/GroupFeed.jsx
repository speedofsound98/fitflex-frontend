// src/components/GroupFeed.jsx  — posts + comments for a group
import authFetch from '../utils/authFetch';
import React, { useEffect, useState } from 'react';

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
    <div className={`${sz} rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0`}>
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

  if (!loaded) return <p className="text-xs text-gray-400 px-4 pb-3">Loading…</p>;

  return (
    <div className="px-4 pb-4 space-y-3">
      {comments.map(c => (
        <div key={c.id} className="flex gap-2">
          <Avatar name={c.user_name} size="sm" />
          <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">{c.user_name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                {(c.user_id === currentUserId || isAdmin) && (
                  <button onClick={() => deleteComment(c.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-0.5">{c.content}</p>
          </div>
        </div>
      ))}
      {isMember && (
        <form onSubmit={addComment} className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            placeholder="Write a comment…"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button type="submit" disabled={!text.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-40">
            Send
          </button>
        </form>
      )}
    </div>
  );
}

export default function GroupFeed({ groupId, isMember, isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [openComments, setOpenComments] = useState({});
  const [msg, setMsg] = useState('');

  const currentUserId = Number(localStorage.getItem('userId'));

  useEffect(() => {
    fetch(`${api}/groups/${groupId}/posts`)
      .then(r => r.json())
      .then(d => setPosts(d.posts || []));
  }, [groupId]);

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

  return (
    <div className="space-y-4">
      {/* Compose box */}
      {isMember && (
        <div className="bg-white rounded-2xl shadow p-4">
          {msg && <p className="text-red-500 text-sm mb-2">{msg}</p>}
          <form onSubmit={createPost} className="flex flex-col gap-3">
            <textarea
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              placeholder="Share something with the group…"
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div className="flex justify-end">
              <button type="submit" disabled={!text.trim()}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-40">
                Post
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow px-6 py-10 text-center text-gray-400">
          <p className="text-3xl mb-2">💬</p>
          <p className="font-medium">No posts yet.</p>
          {isMember && <p className="text-sm mt-1">Be the first to post something!</p>}
        </div>
      ) : posts.map(post => (
        <div key={post.id} className="bg-white rounded-2xl shadow overflow-hidden">
          {/* Post header */}
          <div className="flex items-start gap-3 px-4 pt-4 pb-3">
            <Avatar name={post.user_name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800">{post.user_name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
                  {(post.user_id === currentUserId || isAdmin) && (
                    <button onClick={() => deletePost(post.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{post.content}</p>
            </div>
          </div>

          {/* Comment toggle */}
          <div className="px-4 pb-3 border-t border-gray-50 pt-2">
            <button
              onClick={() => toggleComments(post.id)}
              className="text-xs text-gray-500 hover:text-blue-600 font-medium transition"
            >
              {openComments[post.id] ? 'Hide' : `💬 ${post.comment_count > 0 ? post.comment_count + ' comment' + (post.comment_count !== 1 ? 's' : '') : 'Comment'}`}
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
