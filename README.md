# FitFlex Frontend

React + Vite + Tailwind CSS frontend for the FitFlex fitness marketplace.

---

## Stack

- React 19
- Vite 7 + @tailwindcss/vite
- Tailwind CSS
- React Router 7
- JWT auth via `Authorization: Bearer` header (token stored in localStorage)

---

## Folder Structure

```
fitflex-frontend/
├── src/
│   ├── main.jsx                   ← Router + all routes registered here
│   ├── index.css                  ← Tailwind import
│   ├── hooks/
│   │   └── usePageTitle.js        ← Sets document.title per page
│   ├── utils/
│   │   └── authFetch.js           ← fetch wrapper that adds Authorization header
│   ├── pages/
│   │   ├── Home.jsx               ← Landing page (Browse Studios button, hero CTAs)
│   │   ├── Login.jsx              ← Login form
│   │   ├── Signup.jsx             ← Signup (user / studio, supports ?role=studio)
│   │   ├── Pricing.jsx            ← /pricing — credit packs + Stripe checkout
│   │   ├── Studios.jsx            ← /studios — public studio directory with search + location filter
│   │   ├── UserDashboard.jsx      ← /dashboard — browse + book classes + studio search
│   │   ├── UserSettings.jsx       ← /settings — profile, credits, password
│   │   ├── StudioDashboard.jsx    ← /studio — manage classes (with roster), analytics, appointments
│   │   ├── StudioSettings.jsx     ← /studio/settings — profile, cover photo upload, theme, hours
│   │   ├── StudioProfile.jsx      ← /studios/:id — public studio page (no login required)
│   │   ├── WorkoutPlan.jsx        ← /training-plan — upload + display Excel/CSV training plans
│   │   ├── Groups.jsx             ← /groups — community groups list
│   │   ├── GroupProfile.jsx       ← /groups/:id — group page with feed
│   │   ├── EventDetail.jsx        ← /events/:eventId — single event page
│   │   ├── Messages.jsx           ← /messages — DM inbox
│   │   ├── ForgotPassword.jsx
│   │   └── ResetPassword.jsx
│   └── components/
│       ├── NavBar.jsx             ← Header, notification bell, hamburger menu
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
| `/forgot` | Forgot Password | Public |
| `/reset` | Reset Password | Public |
| `/groups` | Community Groups | Auth |
| `/groups/:id` | Group Detail + Feed | Auth |
| `/events/:eventId` | Event Detail | Auth |
| `/messages` | DM Inbox | Auth |
| `/dashboard` | User Dashboard | Users only |
| `/settings` | User Settings | Users only |
| `/training-plan` | Training Plan Upload | Users only |
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
- **Rich card view** — phase filter buttons, per-week cards with run type chips using the Excel cell colors, summary stats bar
- **Generic table view** — color-accurate table preserving all cell backgrounds

Multi-sheet files get a tab switcher. Merged cells are deduplicated before rendering.

---

## Deployment (Vercel)

- Auto-deploys on push to `main`
- `vercel.json` handles SPA routing (all paths served by `index.html`)
- Set `VITE_API_URL=https://fitflex-backend-jdd2.onrender.com/api` in Vercel environment variables

**Live URL:** https://your-portfolio-g56q.vercel.app
