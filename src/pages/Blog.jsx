// src/pages/Blog.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto">

        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900">FitFlex Blog</h1>
          <p className="text-gray-500 mt-2">Training tips, running routes, and fitness inspiration.</p>
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8">
            <button onClick={() => setActiveTag('')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition
                ${!activeTag ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              All
            </button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition
                  ${activeTag === tag ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {tag}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-40 animate-pulse border border-gray-100" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">📝</p>
            <p className="font-semibold text-gray-600">No posts yet</p>
            <p className="text-sm mt-1">Check back soon.</p>
          </div>
        )}

        {!loading && featured && (
          <>
            {/* Featured post */}
            <Link to={`/blog/${featured.slug}`} className="block group mb-8">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
                {featured.cover_image && (
                  <div className="w-full h-64 overflow-hidden">
                    <img src={featured.cover_image} alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-7">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(featured.tags || []).map(tag => (
                      <span key={tag} className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tagColor(tag)}`}>{tag}</span>
                    ))}
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 group-hover:text-blue-600 transition mb-2">
                    {featured.title}
                  </h2>
                  {featured.excerpt && <p className="text-gray-500 text-sm line-clamp-3 mb-4">{featured.excerpt}</p>}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="font-medium text-gray-600">{featured.author_name}</span>
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
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition h-full flex flex-col">
                      {post.cover_image && (
                        <div className="w-full h-44 overflow-hidden flex-shrink-0">
                          <img src={post.cover_image} alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {(post.tags || []).map(tag => (
                            <span key={tag} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tagColor(tag)}`}>{tag}</span>
                          ))}
                        </div>
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition text-lg mb-1">
                          {post.title}
                        </h3>
                        {post.excerpt && <p className="text-gray-500 text-sm line-clamp-2 flex-1">{post.excerpt}</p>}
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-3">
                          <span className="font-medium text-gray-600">{post.author_name}</span>
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
