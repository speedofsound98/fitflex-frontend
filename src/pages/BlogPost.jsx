// src/pages/BlogPost.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, FileText } from 'lucide-react';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';
import { chipStyle } from '../utils/sport';

const api = import.meta.env.VITE_API_URL;

export default function BlogPost() {
  const { slug } = useParams();
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
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 px-4 max-w-3xl mx-auto space-y-4">
        <div className="h-8 bg-white rounded-full animate-pulse w-2/3 shadow-card" />
        <div className="h-64 bg-white rounded-3xl animate-pulse shadow-card" />
        <div className="h-4 bg-white rounded-full animate-pulse shadow-card" />
        <div className="h-4 bg-white rounded-full animate-pulse w-4/5 shadow-card" />
      </div>
    </div>
  );

  if (notFound || !post) return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 px-4 max-w-3xl mx-auto text-center py-20">
        <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 mx-auto mb-4">
          <FileText className="w-6 h-6" />
        </span>
        <h2 className="font-display font-bold text-2xl text-ink-900 mb-2">Post not found</h2>
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-brand-600 font-semibold hover:underline text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </div>
    </div>
  );

  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const siteUrl = 'https://your-portfolio-g56q.vercel.app';

  return (
    <div className="min-h-screen bg-cream">
      <Helmet>
        <title>{post.title} — FitFlex Blog</title>
        <meta name="description" content={post.excerpt || post.title} />
        <link rel="canonical" href={`${siteUrl}/blog/${post.slug}`} />

        {/* Open Graph (Facebook, WhatsApp, LinkedIn) */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || post.title} />
        <meta property="og:url" content={`${siteUrl}/blog/${post.slug}`} />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        <meta property="article:published_time" content={post.published_at} />
        <meta property="article:author" content={post.author_name} />
        {(post.tags || []).map(t => <meta key={t} property="article:tag" content={t} />)}

        {/* Twitter card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt || post.title} />
        {post.cover_image && <meta name="twitter:image" content={post.cover_image} />}
      </Helmet>

      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-3xl mx-auto">

        {/* Back */}
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-600 transition mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {/* Cover */}
        {post.cover_image && (
          <div className="w-full h-72 rounded-3xl overflow-hidden mb-8 shadow-card">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Tags */}
        {(post.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(tag => (
              <span key={tag} className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${chipStyle(tag)}`}>{tag}</span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="font-display font-bold text-4xl text-ink-900 leading-tight mb-4">{post.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-2 text-sm text-ink-400 mb-10 pb-8 border-b border-ink-100">
          <span className="font-semibold text-ink-600">{post.author_name}</span>
          {dateStr && <><span>·</span><span>{dateStr}</span></>}
        </div>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none
            prose-headings:font-display prose-headings:font-bold prose-headings:text-ink-900
            prose-p:text-ink-700 prose-p:leading-relaxed
            prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-3xl prose-img:shadow-card
            prose-strong:text-ink-900
            prose-ul:text-ink-700 prose-ol:text-ink-700
            prose-blockquote:border-brand-400 prose-blockquote:text-ink-500"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </div>
  );
}
