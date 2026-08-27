// Build-time sitemap generator.
// Writes public/sitemap.xml from the static public routes + every studio and every
// published blog post pulled from the live API. Resilient: if the API is unreachable
// (e.g. Render cold-start), it falls back to just the static routes so the build never
// fails. Runs via the `prebuild` npm script.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'sitemap.xml');

const SITE = (process.env.VITE_SITE_URL || 'https://your-portfolio-g56q.vercel.app').replace(/\/$/, '');
const API = (process.env.VITE_API_URL || '').replace(/\/$/, '');

// Public, indexable routes (auth-gated app pages are intentionally excluded).
const STATIC = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/studios', changefreq: 'weekly', priority: '0.8' },
  { loc: '/pricing', changefreq: 'weekly', priority: '0.8' },
  { loc: '/blog', changefreq: 'weekly', priority: '0.8' },
];

async function getJSON(path, ms = 8000) {
  if (!API) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${API}${path}`, { signal: ctrl.signal });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function urlTag({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${SITE}${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ].filter(Boolean).join('\n');
}

const entries = [...STATIC];

// Studios → /studios/:id
const studiosData = await getJSON('/studios');
const studios = studiosData?.studios || [];
for (const s of studios) {
  entries.push({ loc: `/studios/${s.id}`, changefreq: 'weekly', priority: '0.7' });
}

// Published blog posts → /blog/:slug
const blogData = await getJSON('/blog');
const posts = blogData?.posts || [];
for (const p of posts) {
  const lastmod = (p.published_at || p.created_at || '').slice(0, 10) || undefined;
  entries.push({ loc: `/blog/${p.slug}`, lastmod, changefreq: 'monthly', priority: '0.7' });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(urlTag).join('\n')}
</urlset>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, xml);
console.log(`[sitemap] wrote ${entries.length} URLs (${studios.length} studios, ${posts.length} posts) → ${API ? 'API ok' : 'no API — static only'}`);
