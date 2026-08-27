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

## Nice-to-have / later

- Favorite/follow a studio → notify on new classes.
- Member calendar view of upcoming bookings (ICS already emitted in emails).
- Membership/subscription option beyond credit packs (unlimited monthly).
- Automated tests (only a `test.js` stub exists today).
- Accessibility + mobile-width audit pass.
