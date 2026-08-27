# FitFlex — Roadmap

Product backlog beyond the redesign + nutrition work (which are done). Grouped by
leverage. Sprints here are intentionally **unnumbered** — pick by priority, not order.

Stack reminder: Vercel (frontend) → Render (backend server) → Neon (Postgres).

---

## Parked (future, no set date)

### Custom domain + real email
Move off Resend's `onboarding@resend.dev` test sender (which only delivers to the
account owner). Requires a domain **we own**, verified in Resend (DKIM/SPF/DMARC DNS
records), then `RESEND_FROM_EMAIL` on that domain in `.env` + Render. Unlocks sending
to *any* recipient — password resets, booking confirmations, reminders, studio
messages all reach real users. Also lets us later add a branded studio subdomain.
Blocked only on buying/choosing a domain. Nothing to build; it's config + DNS.

---

## Loose ends (small, already scoped)

- **Enable WhatsApp/Twilio** — code + startup diagnostics ready; needs a Twilio
  account (SID/token) + sandbox join, then two env vars. Optional for a 1-user demo.
- **Dark-mode polish** — gradient-header CTA buttons read dark-on-dark; flash banners
  / soft chips stay light-tinted in dark. Cosmetic.
- **Nutrition imperial units** — kg/lb + cm/ft-in toggle (metric-only today).
- **Shared dashboard shell** — dedupe the per-page `<Navbar/>`. Refactor, no UX change.
- **Real analytics endpoints** — replace the dashboard's derived client-side charts
  with server aggregates.

---

## Product sprints — making it a *useful* two-sided marketplace

The core loop today: studios list classes → members spend credits to book. That works,
but several primitives that make a fitness marketplace actually sticky are missing.
Ordered by impact on the **hook** (why anyone signs up / trusts it) and the **studio's
reason to stay**.

### 1. Reviews & ratings  ⭐ (biggest hook)
Members rate + review a studio/class after attending; average rating shows on studio
cards, the directory, and profiles. This is the trust primitive every marketplace
lives on — right now there's zero social proof, so a new visitor has no signal.
- Backend: `reviews` table (user_id, studio_id, class_id?, rating, body, created_at),
  aggregate rating on studio; only after a completed booking (prevents fake reviews).
- Frontend: star input post-class, rating badges on `StudioCard`/directory/profile,
  a reviews section on `StudioProfile`, sort directory by rating.

### 2. Recurring classes + waitlists  (the studio's operational core)
Today each class is a single `datetime` — a studio running a Mon/Wed/Fri 7am class must
re-create it every week. And when a class fills, that's it.
- **Recurring schedules**: define a weekly pattern, auto-generate class instances.
- **Waitlists**: when full, members join a waitlist; auto-promote (+notify) on a
  cancellation. Directly fills empty spots = studio revenue + member happiness.
- Backend: recurrence fields / generator; `waitlist` table + promotion on cancel hook.

### 3. Studio revenue + attendance  (why a studio keeps using it)
Studios currently see booking *counts* but never money or who actually showed.
- **Revenue view**: earnings per class/period (credits booked × value), trend, top
  classes by revenue — not just counts.
- **Check-in / attendance**: mark attended / no-show from the class roster; no-show
  stats. Gives studios the operational value that justifies the platform.
- Backend: `bookings.attended` flag + attendance endpoints; revenue aggregation.

### 4. Discovery upgrade  (turn browsing into booking)
Class-level search/filter is dashboard-only and thin. Make discovery the funnel.
- Filter classes by **day/time, sport, price (credits), location**; "this week near
  me"; sort by soonest / cheapest / top-rated.
- Optional: simple map or neighbourhood grouping of studios.

### 5. Studio onboarding + seed/demo data  (fix cold-start / first impression)
A brand-new studio lands on an empty dashboard; a visitor to an empty marketplace sees
"No studios found" — both kill the first impression (critical for a portfolio demo).
- **Guided studio setup**: checklist — add cover photo, set hours, create first class.
- **Seed script**: a handful of realistic studios + classes + reviews so the directory,
  ratings, and booking flow look alive on day one.

---

### SEO / Google exposure
Symptom: only ~2 pages indexed; GSC "sitemap couldn't fetch". Findings: the sitemap
*is* served fine (200, `application/xml`) — the fetch error is stale/GSC-side. The real
blocker is that the app is a **client-rendered SPA** (`<div id="root"></div>`, no HTML
content until JS runs), so Google indexes almost nothing, and the sitemap misses all
dynamic pages. Layered fix, by impact:
1. **Pre-render public routes to static HTML (SSG)** — the core fix. Each public page
   (`/`, `/studios`, `/studios/:id`, `/pricing`, `/blog`, `/blog/:slug`) ships real
   HTML + unique `<title>`/description/canonical so Google indexes without executing JS.
   Options for a Vite SPA: `vite-react-ssg` or a prerender step in the build.
2. **Dynamic sitemap** — generate at build from the live API: all studios + all
   published blog posts + the static routes (done below).
3. **Per-page canonical + unique meta on every public route** (helmet); JSON-LD
   (`Organization`, `LocalBusiness` per studio, `Article` per post) for rich results.
4. **Real content** — Google won't index thin/empty pages; ties to the seed-data sprint
   (an empty marketplace has little to index).
5. **GSC hygiene** — property must match the exact live host; re-submit sitemap; use
   URL Inspection → Request Indexing on key pages.

### FAQ page
A public `/faq` — helps users *and* SEO (indexable content, eligible for FAQ rich
results). Two audiences: **members** (how credits work, booking/cancelling, refunds,
appointments, communities) and **studios** (listing classes, rosters, messaging
members, how they get paid, verification). Small, high-value, pairs with the SEO work.
- Frontend: `/faq` page with an accordion (reuse tokens + `ChevronDown`), nav/footer
  link, static Q&A arrays to start (CMS later).
- SEO: `FAQPage` JSON-LD; add `/faq` to the sitemap's static routes.

### Internationalization (i18n) — Hebrew first
Add multi-language support, starting with Hebrew. This is one of the **larger** sprints
— not just translating strings, but **RTL layout** and a **Hebrew-capable font**. Phase it:
1. **Framework**: `react-i18next` + `i18next`; resource files `src/locales/en.json`,
   `he.json`; a language switcher in the navbar (next to the theme toggle) that persists
   to `localStorage` and can auto-detect `navigator.language`.
2. **String extraction**: move hardcoded UI text into translation keys. Bulk of the
   effort (~25 pages/components). Do public pages first (Home, Studios, StudioProfile,
   Pricing, Blog, Auth, NavBar), then the app/dashboards.
3. **RTL** (the hard part): set `dir="rtl"` on `<html>` for Hebrew; audit directional
   utilities — migrate `ml-/mr-`→`ms-/me-`, `pl-/pr-`→`ps-/pe-`, `left/right` and
   `text-left/right`→`text-start/end`; use Tailwind `rtl:` variants where needed; mirror
   directional icons (ArrowLeft/ChevronRight) in RTL.
4. **Font**: Archivo/Inter lack Hebrew glyphs — add a Hebrew webfont (Heebo / Rubik /
   Assistant / Noto Sans Hebrew) and wire it into the font stack for `he`.
5. **Formatting**: dates/numbers via `Intl` with the active locale.
6. **SEO**: `<html lang>` per language, `hreflang` alternates, translated meta/canonical
   (pairs with the prerender/SSG sprint).

## Nice-to-have / later

- Favorite/follow a studio → notify on new classes.
- Member calendar view of upcoming bookings (ICS already emitted in emails).
- Membership/subscription option beyond credit packs (unlimited monthly).
- Automated tests (only a `test.js` stub exists today).
- Accessibility + mobile-width audit pass.
