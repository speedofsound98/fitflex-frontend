# FitFlex Frontend

React + Vite + Tailwind CSS frontend for the FitFlex fitness marketplace.

---

## Tech Stack

- [React 19](https://react.dev/)
- [Vite 7](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) (via `@tailwindcss/vite`)
- [React Router 7](https://reactrouter.com/)

---

## Folder Structure

```
fitflex-frontend/
├── src/
│   ├── main.jsx              ← Router entry point
│   ├── index.css             ← Global styles + Tailwind import
│   ├── pages/
│   │   ├── Home.jsx          ← Landing page
│   │   ├── Login.jsx         ← Login form
│   │   ├── Signup.jsx        ← Signup (user / studio toggle)
│   │   ├── UserDashboard.jsx ← Browse and book classes
│   │   ├── StudioDashboard.jsx ← Create and manage classes
│   │   ├── ForgotPassword.jsx
│   │   └── ResetPassword.jsx
│   └── components/
│       ├── NavBar.jsx        ← Header with auth state + logout
│       └── RoleRoute.jsx     ← Route guard by role
├── .env                      ← VITE_API_URL
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

**3. Make sure the backend is running first**
```bash
# In the fitflex-backend folder:
node server.js
```

**4. Start the dev server**
```bash
npm run dev
# → http://localhost:5173
```

---

## Routes

| Path | Page | Who can access |
|------|------|----------------|
| `/` | Home | Anyone |
| `/login` | Login | Anyone |
| `/signup` | Signup | Anyone |
| `/forgot` | Forgot Password | Anyone |
| `/reset?token=X` | Reset Password | Anyone |
| `/dashboard` | User Dashboard | Logged-in users only |
| `/studio` | Studio Dashboard | Logged-in studios only |

Route guards are enforced by `RoleRoute.jsx` using `localStorage.userRole`.

---

## Session Storage

After login or signup, three keys are saved to `localStorage`:

| Key | Value |
|-----|-------|
| `userId` | Numeric ID from the database |
| `userName` | Display name |
| `userRole` | `"user"` or `"studio"` |

Logout clears all three.

---

## Git Workflow

```bash
git add <files>
git commit -m "Describe your change"
git pull origin main
git push origin main
```

Vercel auto-redeploys on push to `main`.

---

## Deployment (Vercel)

1. Connect the `fitflex-frontend` GitHub repo to Vercel
2. Add environment variable in Vercel dashboard:
   ```
   VITE_API_URL=https://<your-render-backend-url>/api
   ```
3. Push to `main` — Vercel builds and deploys automatically

See `../DEPLOY_WORKFLOW.md` for full step-by-step instructions.
