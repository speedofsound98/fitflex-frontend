# FitFlex UI Redesign — Plan & Progress

Living doc for the visual overhaul. Update the checklist as pages are migrated.

## Goal

Move FitFlex off its default blue-on-white Tailwind look to a cohesive, dynamic,
editorial design. Two visual registers on one shared token layer:

- **Landing / marketing** (Home, Pricing) — light editorial: oversized `Archivo`
  display type, warm orange accent, generous whitespace, social-proof clusters.
  Inspiration: FitNova "STRONGER EVERYDAY" + AROHA "mindful balance method" hero refs.
- **Logged-in app** (dashboards) — card + chart language: stat cards, gradient
  highlight cards, soft icon chips, derived mini-charts, pill tabs. Inspiration:
  the dark/light fitness-dashboard reference (violet accent in the ref → mapped to
  FitFlex's orange brand).

## Design tokens (source of truth: `src/index.css` `@theme`)

| Token | Value / use |
|-------|-------------|
| `font-display` | Archivo — headings |
| `font-sans` | Inter — body (default) |
| `brand-500` | `#e8702a` primary orange (CTAs, active, accents) |
| `brand-50…900` | orange ramp |
| `ink-800` / `ink-400` | body text / muted labels |
| `ink-900` | darkest text + dark CTA panels |
| `cream` `#f7f4ee` | landing page bg |
| `paper` `#f3f3f5` | app page bg |
| `shadow-card` / `-lg` / `-pill` | elevation |
| radius | cards `rounded-3xl`, buttons `rounded-full`, chips `rounded-2xl` |

Rules: use tokens, not ad-hoc Tailwind colors. Icons come from `lucide-react`
(not emoji) — **note the installed v1.23.0 has a limited icon set; verify a name
exists before importing** (e.g. `Instagram` is missing — use `AtSign`).

## Data approach

Charts/stats use **real data + tasteful client-side derivation** (no fabricated
numbers). E.g. the user Overview "booking activity" chart buckets real bookings by
month; the studio Overview "top classes" bars come from the analytics endpoint.

## Architecture notes

- **User dashboard** is a layout + nested routes: `UserDashboardLayout` fetches
  classes/studios/bookings once and shares them via `useOutletContext`; pages
  (`Overview`, `BrowseClasses`, `BrowseStudios`, `Bookings`) read from context.
  Pill `NavLink`s switch sub-routes. `book()` / `cancelBooking()` live in the layout.
- **Studio dashboard** keeps its single-file tab structure; an `overview` tab was
  added as the default landing (stats + derived chart + quick-action tiles).
- Shared cards extracted to `components/ClassCard.jsx` + `StudioCard.jsx`; sport
  icon/chip helpers in `utils/sport.js`.
- NavBar: minimal top bar + slide-out side drawer (see README). Auth state inits
  synchronously from localStorage to avoid a logged-out flash on remount.

## Progress

### Done
- [x] Design token layer + Archivo/Inter fonts (`index.css`, `index.html`)
- [x] NavBar — minimal bar + side drawer (Workout Plan lives here)
- [x] Home — editorial landing rebuild
- [x] Pricing — restyled (orange gradient "Most Popular" card)
- [x] User dashboard — split into Overview hub + `/classes` `/studios` `/bookings`
- [x] Studio dashboard — Overview hub tab + restyled classes/appointments/analytics/profile
- [x] Mobile tap-highlight flash fixed; navbar auth-flash fixed

### Remaining (old blue/default style)
- [ ] **Studios** (`/studios`) + **StudioProfile** (`/studios/:id`) — public-facing pair (recommended next)
- [ ] **Auth pages** — Login, Signup, ForgotPassword, ResetPassword (quick wins)
- [ ] **UserSettings** + **StudioSettings**
- [ ] **Blog**, **BlogPost**, **AdminBlog**
- [ ] **Groups**, **GroupProfile**, **EventDetail**, **Messages**
- [ ] **WorkoutPlan** (`/training-plan`)
- [ ] **AppointmentMatrix** component (used in studio dashboard + studio profile)

### Nice-to-have / follow-ups
- [ ] Replace the Home hero Unsplash hotlink with a real brand asset
- [ ] Consider a shared dashboard shell to avoid per-page `<Navbar/>` duplication
- [ ] Real analytics endpoints so the derived charts can be replaced with server data
- [ ] Dark mode (the original reference had a light/dark toggle) — tokens are ready for it

## Verify before committing

`npm run build` must pass. Spot-check in the browser at mobile + desktop widths.
Main gotcha: unknown `lucide-react` icon imports fail the build (the installed
v1.23.0 has a limited set — verify names). Tailwind v4's spacing scale is dynamic,
so fractional steps like `w-4.5` are valid.
