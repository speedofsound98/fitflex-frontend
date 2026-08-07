# FitFlex Frontend

React + Vite + Tailwind CSS frontend for the FitFlex fitness marketplace.

---

## Stack

- React 19
- Vite 7 + @tailwindcss/vite
- Tailwind CSS v4 (+ `@tailwindcss/typography` for blog article rendering)
- React Router 7 (nested routes + `useOutletContext` for the dashboard)
- lucide-react — icon set (replaces emoji in the redesigned UI)
- TipTap — rich text WYSIWYG editor for the blog admin
- react-helmet-async — per-page SEO meta tags
- exceljs (backend) + client-side parsing for training plans
- JWT auth via `Authorization: Bearer` header (token stored in localStorage)

---

## Design System

The UI was redesigned around an editorial, light-first look (warm orange on ink & cream). Tokens live in `src/index.css` under Tailwind v4's `@theme` block — use these instead of ad-hoc Tailwind colors so the app stays cohesive. See **REDESIGN.md** for the full plan, reference inspiration, and remaining work.

- **Fonts** — `Archivo` (display / headings, via `font-display`) + `Inter` (body, default). Loaded from Google Fonts in `index.html`.
- **Brand ramp** — `brand-50 … brand-900` (orange, primary `brand-500` `#e8702a`). Used for CTAs, active states, accents.
- **Ink ramp** — `ink-50 … ink-900` (blue-charcoal) for text + dark surfaces. Body text is `ink-800`; muted labels `ink-400`.
- **Surfaces** — `cream` (`#f7f4ee`, landing) and `paper` (`#f3f3f5`, app pages) page backgrounds; cards are white.
- **Elevation** — `shadow-card`, `shadow-card-lg`, `shadow-pill`.
- **Shape** — cards use `rounded-3xl`; pills/buttons `rounded-full`; icon chips `rounded-2xl`.
- **Motion** — cards lift on hover (`hover:-translate-y-1`), pill CTAs, tab transitions.
- Global `-webkit-tap-highlight-color: transparent` (kills the mobile tap flash) with a `:focus-visible` ring for keyboard users.

---

## Folder Structure

```
fitflex-frontend/
├── src/
│   ├── main.jsx                   ← Router + all routes registered here
│   ├── index.css                  ← Tailwind import + @theme design tokens (see Design System)
│   ├── hooks/
│   │   └── usePageTitle.js        ← Sets document.title per page
│   ├── utils/
│   │   ├── authFetch.js           ← fetch wrapper that adds Authorization header
│   │   └── sport.js               ← sportIcon() + chipStyle() helpers (shared by cards)
│   ├── pages/
│   │   ├── Home.jsx               ← Landing page (editorial hero, features, how-it-works, CTA)
│   │   ├── Login.jsx              ← Login form
│   │   ├── Signup.jsx             ← Signup (user / studio, supports ?role=studio)
│   │   ├── Pricing.jsx            ← /pricing — credit packs + Stripe checkout
│   │   ├── Studios.jsx            ← /studios — public studio directory with search + location filter
│   │   ├── dashboard/             ← /dashboard — user dashboard (Overview hub + sub-pages)
│   │   │   ├── UserDashboardLayout.jsx ← fetches shared data, sub-nav tabs, <Outlet context>
│   │   │   ├── Overview.jsx       ← /dashboard — stats, next class, derived booking chart, recommended
│   │   │   ├── BrowseClasses.jsx  ← /dashboard/classes — search + book classes
│   │   │   ├── BrowseStudios.jsx  ← /dashboard/studios — studio directory
│   │   │   └── Bookings.jsx       ← /dashboard/bookings — booking history + cancel
│   │   ├── UserSettings.jsx       ← /settings — profile, credits, notifications, nutrition (private targets), password
│   │   ├── StudioDashboard.jsx    ← /studio — Overview hub + classes (roster), appointments, analytics, profile
│   │   ├── StudioSettings.jsx     ← /studio/settings — profile, cover photo upload, theme, hours
│   │   ├── StudioProfile.jsx      ← /studios/:id — public studio page (no login required)
│   │   ├── WorkoutPlan.jsx        ← /training-plan — upload + display Excel/CSV training plans
│   │   ├── Nutrition.jsx          ← /nutrition — daily food & macro tracker (estimate + exact modes)
│   │   ├── Blog.jsx               ← /blog — public blog listing (featured post, tag filter)
│   │   ├── BlogPost.jsx           ← /blog/:slug — single article (SEO meta tags, prose styling)
│   │   ├── AdminBlog.jsx          ← /admin/blog — TipTap editor + post management (admin secret)
│   │   ├── Groups.jsx             ← /groups — community groups list
│   │   ├── GroupProfile.jsx       ← /groups/:id — group page with feed
│   │   ├── EventDetail.jsx        ← /events/:eventId — single event page
│   │   ├── Messages.jsx           ← /messages — DM inbox
│   │   ├── ForgotPassword.jsx
│   │   └── ResetPassword.jsx
│   └── components/
│       ├── NavBar.jsx             ← Minimal top bar + slide-out side drawer, notification bell
│       ├── ClassCard.jsx          ← Reusable class card (used across dashboard pages)
│       ├── StudioCard.jsx         ← Reusable studio card
│       ├── RoleRoute.jsx          ← Route guard by role
│       ├── AppointmentMatrix.jsx  ← Weekly slot booking matrix
│       └── GroupFeed.jsx          ← Group posts + comments feed
├── vercel.json                    ← SPA routing (all paths → index.html)
├── .env                           ← VITE_API_URL
├── vite.config.js
└── package.json
```

---

## Local Setup

**1. Install dependencies**
```bash
npm install
```

**2. Create `.env`**
```
VITE_API_URL=http://localhost:3000/api
```

**3. Start the backend first**
```bash
# In fitflex-backend/:
brew services start postgresql && node server.js
```

**4. Start the dev server**
```bash
npm run dev
# → http://localhost:5173
```

---

## Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Home | Public |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/pricing` | Credit Packs | Public |
| `/studios` | Studio Directory | Public |
| `/studios/:id` | Studio Profile | Public |
| `/blog` | Blog Listing | Public |
| `/blog/:slug` | Blog Article | Public |
| `/admin/blog` | Blog Management | Admin secret |
| `/forgot` | Forgot Password | Public |
| `/reset` | Reset Password | Public |
| `/groups` | Community Groups | Auth |
| `/groups/:id` | Group Detail + Feed | Auth |
| `/events/:eventId` | Event Detail | Auth |
| `/messages` | DM Inbox | Auth |
| `/dashboard` | User Dashboard — Overview hub | Users only |
| `/dashboard/classes` | Browse + book classes | Users only |
| `/dashboard/studios` | Studio directory | Users only |
| `/dashboard/bookings` | Booking history | Users only |
| `/settings` | User Settings | Users only |
| `/training-plan` | Training Plan Upload | Users only |
| `/nutrition` | Nutrition & macro tracker | Users only |
| `/studio` | Studio Dashboard | Studios only |
| `/studio/settings` | Studio Settings | Studios only |

---

## Auth

- On login/signup, JWT is saved to `localStorage` as `authToken`
- `authFetch` wrapper automatically adds `Authorization: Bearer <token>` to all authenticated requests
- `localStorage` also stores `userId`, `userName`, `userRole` for display/routing
- Logout clears all four keys + calls `POST /api/logout` to clear the server cookie

---

## Session Storage

| Key | Value |
|-----|-------|
| `userId` | Numeric DB id |
| `userName` | Display name |
| `userRole` | `"user"` or `"studio"` |
| `authToken` | JWT (7-day expiry) |

---

## NavBar & Side Drawer

- **Minimal top bar** (floating pill): logo, a `Dashboard` quick link, notification bell, and an avatar/menu button.
- **Side drawer** — the menu button opens a slide-in right drawer holding the full nav (Dashboard, Training Plan, Nutrition, Messages, Communities, Pricing, Blog, Settings) with Log out pinned at the bottom. Backdrop click / Esc closes it; body scroll locks while open.
- Auth state initializes **synchronously** from `localStorage` (`useState(() => …)`), so the navbar never flashes the logged-out state on route changes/remounts.
- Every page renders its own `<Navbar />` (there is no shared app shell), which is why the synchronous init matters.

## Notification Bell

- Polls `GET /api/notifications` every 30 seconds when logged in
- Shows unread badge count
- Click to open dropdown; clicking marks all as read
- Notification types: `booking`, `cancellation`, `message`, `enquiry`, `dm`, `follow`, `event`, `post`, `comment`, `broadcast`

---

## Key Components

### AppointmentMatrix
Weekly slot booking matrix rendered on studio dashboard (manage mode) and studio profile (view mode). Always shows the studio's full business hours range. Props: `studioId`, `mode` (`manage`|`view`), `userId`, `openingHour` (default 9), `closingHour` (default 18). Studios set their hours in Studio Settings → Public Profile.

### GroupFeed
Posts and comments feed used on the `/groups/:id` page. Supports creating posts, replying with comments, and real-time-style updates.

### WorkoutPlan page
Upload an Excel (.xlsx) or CSV file — the backend parses it with `exceljs` and returns every cell's value, background color, text color, and bold flag. The frontend detects whether the file looks like a training plan (contains "week", "phase", "run" keywords) and renders either:
- **Card view** — phase filter buttons, per-week cards with run type chips using the Excel cell colors, summary stats bar, and a collapsible Guide & Legend panel
- **Table view** — editable spreadsheet preserving all cell colors; click any cell to edit inline

**Sprint 14 features (all live):**
- **Full-screen mode** — "⛶ Full screen" button opens a fixed overlay; ESC to exit
- **Column resize** — drag the right edge of any column header to resize
- **Row height** — Compact / Normal / Tall preset picker
- **In-app editing** — click any cell in table view to edit; Enter/Tab commits, Escape cancels
- **Export .xlsx** — sends current (possibly edited) data to `POST /api/workout-plan/export`; downloads file with colors and bold preserved
- **Guide & Legend** — collapsible panel in card view showing phase color swatches + km totals, run type chips with descriptions for ~20 common abbreviations (Easy, Tempo, Long, MP, HMP, Intervals, Fartlek…), and a card-reading guide

Multi-sheet files get a tab switcher. Merged cells are deduplicated before rendering.

### Blog

- **`/blog`** — public listing: featured post hero, tag filter bar, card grid (cover image, excerpt, author, date)
- **`/blog/:slug`** — full article rendered with `@tailwindcss/typography` (`prose`) classes; cover image, tags, author/date
- **`/admin/blog`** — admin-only (gated by admin secret stored in `localStorage`). Uses **TipTap** WYSIWYG editor (bold, italic, headings, lists, blockquote, links, inline images). Slug auto-generates from title; draft/publish toggle; cover image URL; comma-separated tags; excerpt. Lists all posts with status badges + view/publish/edit/delete actions.

Content is stored as HTML and rendered with `dangerouslySetInnerHTML` inside the `prose` container. The backend `blog_posts.status` field (draft/pending/published/rejected) is wired for future studio/user submissions with admin moderation.

---

## SEO

- **Meta tags** via `react-helmet-async` (provider wraps the app in `main.jsx`). Blog post pages set `<title>`, description, canonical URL, Open Graph tags (og:title/description/image/url), Twitter card, and article:tag per post.
- **`public/sitemap.xml`** — static file served directly by Vercel (instant, no backend dependency). Lists static pages + every published blog post. **Add a `<url>` entry whenever a new post is published**, then commit + push.
- **`public/robots.txt`** — allows all crawlers, points to the sitemap.
- **`public/googlefc9079792cd11400.html`** — Google Search Console verification file (do not delete — removing it un-verifies the property).
- **`vercel.json`** uses `rewrites` + `headers` (never legacy `routes`, which breaks asset loading). The `headers` block pins `application/xml` for sitemap.xml and `text/plain` for robots.txt. Real files (assets, sitemap, robots, verification) are served before the SPA catch-all.

> ⚠️ The sitemap must stay a **static file** — do not switch to a backend-generated one. Render's free tier sleeps and times out Google's crawler ("Couldn't fetch").

---

## Deployment (Vercel)

- Auto-deploys on push to `main`
- `vercel.json` handles SPA routing (all paths served by `index.html`)
- Set `VITE_API_URL=https://fitflex-backend-jdd2.onrender.com/api` in Vercel environment variables

**Live URL:** https://your-portfolio-g56q.vercel.app
