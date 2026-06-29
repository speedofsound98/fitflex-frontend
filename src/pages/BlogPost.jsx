// src/pages/BlogPost.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';

const api = import.meta.env.VITE_API_URL;

const TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
];
function tagColor(tag) {
  let n = 0;
  for (let i = 0; i < tag.length; i++) n += tag.charCodeAt(i);
  return TAG_COLORS[n % TAG_COLORS.length];
}

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  usePageTitle(post ? `${post.title} — FitFlex Blog` : 'Blog — FitFlex');

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`${api}/blog/${slug}`)
      .then(r => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setPost(d.post); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 px-4 max-w-3xl mx-auto space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-2/3" />
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5" />
      </div>
    </div>
  );

  if (notFound || !post) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 px-4 max-w-3xl mx-auto text-center py-20">
        <p className="text-5xl mb-4">📄</p>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Post not found</h2>
        <Link to="/blog" className="text-blue-600 hover:underline text-sm">← Back to Blog</Link>
      </div>
    </div>
  );

  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-3xl mx-auto">

        {/* Back */}
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition mb-8">
          ← Back to Blog
        </Link>

        {/* Cover */}
        {post.cover_image && (
          <div className="w-full h-72 rounded-3xl overflow-hidden mb-8 shadow-sm">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Tags */}
        {(post.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(tag => (
              <span key={tag} className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tagColor(tag)}`}>{tag}</span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">{post.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-10 pb-8 border-b border-gray-100">
          <span className="font-semibold text-gray-600">{post.author_name}</span>
          {dateStr && <><span>·</span><span>{dateStr}</span></>}
        </div>

        {/* Content */}
        <div
          className="prose prose-gray max-w-none
            prose-headings:font-extrabold prose-headings:text-gray-900
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-2xl prose-img:shadow-sm
            prose-strong:text-gray-900
            prose-ul:text-gray-700 prose-ol:text-gray-700
            prose-blockquote:border-blue-400 prose-blockquote:text-gray-500"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </div>
  );
}
