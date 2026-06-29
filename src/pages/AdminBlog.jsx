// src/pages/AdminBlog.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link2 from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import usePageTitle from '../hooks/usePageTitle';

const api = import.meta.env.VITE_API_URL;
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolBtn({ onClick, active, title, children }) {
  return (
    <button type="button" onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`px-2 py-1 rounded text-sm font-mono transition ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
      {children}
    </button>
  );
}

// ── Editor toolbar ────────────────────────────────────────────────────────────
function EditorToolbar({ editor }) {
  if (!editor) return null;

  function addImage() {
    const url = window.prompt('Image URL');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }
  function addLink() {
    const url = window.prompt('URL');
    if (url) editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-xl">
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">B</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><em>I</em></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><s>S</s></ToolBtn>
      <div className="w-px bg-gray-300 mx-1" />
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolBtn>
      <div className="w-px bg-gray-300 mx-1" />
      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">• List</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">1. List</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">"</ToolBtn>
      <div className="w-px bg-gray-300 mx-1" />
      <ToolBtn onClick={addLink} active={editor.isActive('link')} title="Add link">🔗</ToolBtn>
      <ToolBtn onClick={addImage} title="Add image">🖼</ToolBtn>
      <div className="w-px bg-gray-300 mx-1" />
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">↩</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">↪</ToolBtn>
    </div>
  );
}

// ── Post form (create + edit) ─────────────────────────────────────────────────
function PostForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    slug: initial?.slug || '',
    excerpt: initial?.excerpt || '',
    cover_image: initial?.cover_image || '',
    tags: (initial?.tags || []).join(', '),
    author_name: initial?.author_name || 'FitFlex',
    status: initial?.status || 'draft',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slugEdited, setSlugEdited] = useState(!!initial);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link2.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write your post here…' }),
    ],
    content: initial?.content || '',
  });

  function setField(k, v) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === 'title' && !slugEdited) next.slug = slugify(v);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    const html = editor?.getHTML() || '';
    const body = {
      ...form,
      content: html,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      await onSave(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Title *</label>
          <input value={form.title} onChange={e => setField('title', e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Slug *</label>
          <input value={form.slug} onChange={e => { setSlugEdited(true); setField('slug', e.target.value); }} required
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Excerpt (shown in listing)</label>
        <textarea value={form.excerpt} onChange={e => setField('excerpt', e.target.value)} rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Cover Image URL</label>
          <input value={form.cover_image} onChange={e => setField('cover_image', e.target.value)} type="url"
            placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Tags (comma separated)</label>
          <input value={form.tags} onChange={e => setField('tags', e.target.value)}
            placeholder="Running, Jerusalem, Routes"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Author Name</label>
          <input value={form.author_name} onChange={e => setField('author_name', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
          <select value={form.status} onChange={e => setField('status', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {/* Rich text editor */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Content</label>
        <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
          <EditorToolbar editor={editor} />
          <EditorContent editor={editor}
            className="min-h-[320px] p-4 text-sm text-gray-800 focus:outline-none prose prose-sm max-w-none" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          {saving ? 'Saving…' : initial ? 'Update post' : 'Create post'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main Admin Blog page ──────────────────────────────────────────────────────
export default function AdminBlog() {
  usePageTitle('Blog Management — Admin');
  const [secret, setSecret] = useState(localStorage.getItem('adminSecret') || '');
  const [authed, setAuthed] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  function authHeaders() {
    return { 'x-admin-secret': secret, 'Content-Type': 'application/json' };
  }

  async function fetchPosts() {
    setLoading(true);
    try {
      const r = await fetch(`${api}/admin/blog`, { headers: authHeaders() });
      if (r.status === 403) { setAuthed(false); return; }
      const d = await r.json();
      setPosts(d.posts || []);
      setAuthed(true);
    } catch { setError('Failed to load posts'); }
    finally { setLoading(false); }
  }

  function handleLogin(e) {
    e.preventDefault();
    localStorage.setItem('adminSecret', secret);
    fetchPosts();
  }

  async function handleCreate(body) {
    const r = await fetch(`${api}/admin/blog`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Failed to create');
    setView('list'); fetchPosts();
  }

  async function handleUpdate(body) {
    const r = await fetch(`${api}/admin/blog/${editing.id}`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Failed to update');
    setView('list'); setEditing(null); fetchPosts();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this post?')) return;
    await fetch(`${api}/admin/blog/${id}`, { method: 'DELETE', headers: authHeaders() });
    fetchPosts();
  }

  async function togglePublish(post) {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    await fetch(`${api}/admin/blog/${post.id}`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ status: newStatus }),
    });
    fetchPosts();
  }

  const statusBadge = s => ({
    published: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-600');

  if (!authed) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Blog Admin</h2>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Admin secret</label>
        <input type="password" value={secret} onChange={e => setSecret(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          Enter
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin" className="text-sm text-gray-400 hover:text-blue-600 transition">← Admin</Link>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-1">Blog Management</h1>
          </div>
          {view === 'list' && (
            <button onClick={() => setView('create')}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
              + New post
            </button>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-6">{error}</div>}

        {view === 'create' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <h2 className="text-lg font-bold text-gray-900 mb-6">New Post</h2>
            <PostForm onSave={handleCreate} onCancel={() => setView('list')} />
          </div>
        )}

        {view === 'edit' && editing && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Edit Post</h2>
            <PostForm initial={editing} onSave={handleUpdate} onCancel={() => { setView('list'); setEditing(null); }} />
          </div>
        )}

        {view === 'list' && (
          loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">📝</p>
              <p className="font-semibold text-gray-600">No posts yet</p>
              <p className="text-sm mt-1">Click "+ New post" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
                  {post.cover_image && (
                    <img src={post.cover_image} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(post.status)}`}>
                        {post.status}
                      </span>
                      {(post.tags || []).map(t => (
                        <span key={t} className="text-xs text-gray-400 px-1.5 py-0.5 rounded-full bg-gray-50 border">{t}</span>
                      ))}
                    </div>
                    <p className="font-bold text-gray-900 truncate">{post.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      /blog/{post.slug} · {post.author_name}
                      {post.published_at && ` · ${new Date(post.published_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link to={`/blog/${post.slug}`} target="_blank"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                      View
                    </Link>
                    <button onClick={() => togglePublish(post)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${post.status === 'published' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                      {post.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => { setEditing(post); setView('edit'); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(post.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
