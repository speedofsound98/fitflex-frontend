// src/pages/Blog.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileText } from 'lucide-react';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';
import { chipStyle } from '../utils/sport';

const api = import.meta.env.VITE_API_URL;

function timeAgo(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const days = Math.floor((now - d) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function Blog() {
  usePageTitle('Blog — FitFlex');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('');

  useEffect(() => {
    fetch(`${api}/blog`)
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allTags = [...new Set(posts.flatMap(p => p.tags || []))].sort();
  const filtered = activeTag ? posts.filter(p => (p.tags || []).includes(activeTag)) : posts;
  const [featured, ...rest] = filtered;

  return (
    <div className="min-h-screen bg-cream">
      <Helmet>
        <title>Blog — FitFlex</title>
        <meta name="description" content="Training tips, running routes, and fitness inspiration from the FitFlex community." />
        <meta property="og:title" content="FitFlex Blog" />
        <meta property="og:description" content="Training tips, running routes, and fitness inspiration from the FitFlex community." />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto">

        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500 mb-2">The Journal</p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-ink-900 leading-[1.05]">FitFlex Blog</h1>
          <p className="text-ink-500 mt-3 text-lg max-w-xl">Training tips, running routes, and fitness inspiration.</p>
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8">
            <button onClick={() => setActiveTag('')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition
                ${!activeTag ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 shadow-card hover:text-ink-900'}`}>
              All
            </button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition
                  ${activeTag === tag ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 shadow-card hover:text-ink-900'}`}>
                {tag}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl h-40 animate-pulse shadow-card" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 mx-auto mb-4">
              <FileText className="w-6 h-6" />
            </span>
            <p className="font-display font-bold text-ink-800">No posts yet</p>
            <p className="text-sm text-ink-400 mt-1">Check back soon.</p>
          </div>
        )}

        {!loading && featured && (
          <>
            {/* Featured post */}
            <Link to={`/blog/${featured.slug}`} className="block group mb-8">
              <div className="bg-white rounded-3xl shadow-card overflow-hidden hover:-translate-y-1 hover:shadow-card-lg transition duration-300">
                {featured.cover_image && (
                  <div className="w-full h-64 overflow-hidden">
                    <img src={featured.cover_image} alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-7">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(featured.tags || []).map(tag => (
                      <span key={tag} className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${chipStyle(tag)}`}>{tag}</span>
                    ))}
                  </div>
                  <h2 className="font-display font-bold text-2xl text-ink-900 group-hover:text-brand-600 transition mb-2 leading-tight">
                    {featured.title}
                  </h2>
                  {featured.excerpt && <p className="text-ink-500 text-sm line-clamp-3 mb-4">{featured.excerpt}</p>}
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <span className="font-semibold text-ink-600">{featured.author_name}</span>
                    <span>·</span>
                    <span>{timeAgo(featured.published_at)}</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Rest of posts */}
            {rest.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-5">
                {rest.map(post => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="block group">
                    <div className="bg-white rounded-3xl shadow-card overflow-hidden hover:-translate-y-1 hover:shadow-card-lg transition duration-300 h-full flex flex-col">
                      {post.cover_image && (
                        <div className="w-full h-44 overflow-hidden flex-shrink-0">
                          <img src={post.cover_image} alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {(post.tags || []).map(tag => (
                            <span key={tag} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${chipStyle(tag)}`}>{tag}</span>
                          ))}
                        </div>
                        <h3 className="font-display font-bold text-ink-900 group-hover:text-brand-600 transition text-lg mb-1 leading-tight">
                          {post.title}
                        </h3>
                        {post.excerpt && <p className="text-ink-500 text-sm line-clamp-2 flex-1">{post.excerpt}</p>}
                        <div className="flex items-center gap-2 text-xs text-ink-400 mt-3">
                          <span className="font-semibold text-ink-600">{post.author_name}</span>
                          <span>·</span>
                          <span>{timeAgo(post.published_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
