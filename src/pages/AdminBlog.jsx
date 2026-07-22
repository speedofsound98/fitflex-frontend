// src/pages/AdminBlog.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link2 from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered, Quote,
  Link as LinkIcon, Image as ImageIcon, Undo2, Redo2, Plus, ArrowLeft,
  ExternalLink, Pencil, Trash2, FileText, AlertCircle,
} from 'lucide-react';
import { inputClass } from '../components/AuthShell';
import usePageTitle from '../hooks/usePageTitle';

const api = import.meta.env.VITE_API_URL;

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
      className={`inline-grid place-items-center w-8 h-8 rounded-lg transition ${active ? 'bg-brand-500 text-white' : 'text-ink-600 hover:bg-white'}`}>
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

  const Divider = () => <div className="w-px bg-ink-200 mx-1 self-stretch my-1" />;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-ink-100 bg-paper rounded-t-2xl">
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold className="w-4 h-4" /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic className="w-4 h-4" /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough className="w-4 h-4" /></ToolBtn>
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 className="w-4 h-4" /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 className="w-4 h-4" /></ToolBtn>
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><List className="w-4 h-4" /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><ListOrdered className="w-4 h-4" /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote className="w-4 h-4" /></ToolBtn>
      <Divider />
      <ToolBtn onClick={addLink} active={editor.isActive('link')} title="Add link"><LinkIcon className="w-4 h-4" /></ToolBtn>
      <ToolBtn onClick={addImage} title="Add image"><ImageIcon className="w-4 h-4" /></ToolBtn>
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 className="w-4 h-4" /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 className="w-4 h-4" /></ToolBtn>
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

  const label = 'block text-xs font-semibold text-ink-500 uppercase tracking-[0.1em] mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-700 rounded-2xl p-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Title *</label>
          <input value={form.title} onChange={e => setField('title', e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={label}>Slug *</label>
          <input value={form.slug} onChange={e => { setSlugEdited(true); setField('slug', e.target.value); }} required
            className={`${inputClass} font-mono`} />
        </div>
      </div>

      <div>
        <label className={label}>Excerpt (shown in listing)</label>
        <textarea value={form.excerpt} onChange={e => setField('excerpt', e.target.value)} rows={2} className={`${inputClass} resize-none`} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Cover Image URL</label>
          <input value={form.cover_image} onChange={e => setField('cover_image', e.target.value)} type="url"
            placeholder="https://..." className={inputClass} />
        </div>
        <div>
          <label className={label}>Tags (comma separated)</label>
          <input value={form.tags} onChange={e => setField('tags', e.target.value)}
            placeholder="Running, Jerusalem, Routes" className={inputClass} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Author Name</label>
          <input value={form.author_name} onChange={e => setField('author_name', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={label}>Status</label>
          <select value={form.status} onChange={e => setField('status', e.target.value)} className={`${inputClass} !bg-white`}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {/* Rich text editor */}
      <div>
        <label className={label}>Content</label>
        <div className="border border-ink-100 rounded-2xl overflow-hidden focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-200 transition">
          <EditorToolbar editor={editor} />
          <EditorContent editor={editor}
            className="min-h-[320px] p-4 text-sm text-ink-800 focus:outline-none prose prose-sm max-w-none prose-headings:font-display prose-headings:text-ink-900 prose-a:text-brand-600" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 bg-brand-500 text-white rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill disabled:opacity-50">
          {saving ? 'Saving…' : initial ? 'Update post' : 'Create post'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 bg-ink-50 text-ink-600 rounded-full text-sm font-semibold hover:bg-ink-100 transition">
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
    published: 'bg-emerald-100 text-emerald-700',
    draft: 'bg-ink-100 text-ink-600',
    pending: 'bg-amber-100 text-amber-700',
    rejected: 'bg-rose-100 text-rose-700',
  }[s] || 'bg-ink-100 text-ink-600');

  if (!authed) return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="bg-white rounded-3xl shadow-card p-8 w-full max-w-sm">
        <h2 className="font-display font-bold text-xl text-ink-900 mb-6">Blog Admin</h2>
        <label className="block text-xs font-semibold text-ink-500 uppercase tracking-[0.1em] mb-1.5">Admin secret</label>
        <input type="password" value={secret} onChange={e => setSecret(e.target.value)} className={`${inputClass} mb-4`} />
        <button className="w-full py-3 bg-brand-500 text-white rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill">
          Enter
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-brand-600 transition">
              <ArrowLeft className="w-4 h-4" /> Admin
            </Link>
            <h1 className="font-display font-bold text-3xl text-ink-900 mt-1">Blog Management</h1>
          </div>
          {view === 'list' && (
            <button onClick={() => setView('create')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-500 text-white rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill">
              <Plus className="w-4 h-4" /> New post
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-rose-50 text-rose-700 rounded-2xl p-3 text-sm mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {view === 'create' && (
          <div className="bg-white rounded-3xl shadow-card p-7">
            <h2 className="font-display font-bold text-lg text-ink-900 mb-6">New Post</h2>
            <PostForm onSave={handleCreate} onCancel={() => setView('list')} />
          </div>
        )}

        {view === 'edit' && editing && (
          <div className="bg-white rounded-3xl shadow-card p-7">
            <h2 className="font-display font-bold text-lg text-ink-900 mb-6">Edit Post</h2>
            <PostForm initial={editing} onSave={handleUpdate} onCancel={() => { setView('list'); setEditing(null); }} />
          </div>
        )}

        {view === 'list' && (
          loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-3xl animate-pulse shadow-card" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 mx-auto mb-4">
                <FileText className="w-6 h-6" />
              </span>
              <p className="font-display font-bold text-ink-800">No posts yet</p>
              <p className="text-sm text-ink-400 mt-1">Click "New post" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-3xl shadow-card p-5 flex items-start gap-4">
                  {post.cover_image && (
                    <img src={post.cover_image} alt="" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusBadge(post.status)}`}>
                        {post.status}
                      </span>
                      {(post.tags || []).map(t => (
                        <span key={t} className="text-xs text-ink-500 px-2 py-0.5 rounded-full bg-paper">{t}</span>
                      ))}
                    </div>
                    <p className="font-display font-bold text-ink-900 truncate">{post.title}</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      /blog/{post.slug} · {post.author_name}
                      {post.published_at && ` · ${new Date(post.published_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link to={`/blog/${post.slug}`} target="_blank"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-ink-50 text-ink-600 hover:bg-ink-100 transition">
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </Link>
                    <button onClick={() => togglePublish(post)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${post.status === 'published' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                      {post.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => { setEditing(post); setView('edit'); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700 hover:bg-brand-200 transition">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDelete(post.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 transition">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
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
