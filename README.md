---

## **README for Frontend (fitflex-frontend/README.md)**

''markdown
# FitFlex Frontend

This is the frontend for the FitFlex project, built with **React**, **Vite**, and **Tailwind CSS**.

## Tech Stack
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)

---

## 📂 Folder Structure

fitflex-frontend/
├── public/
├── src/
│   ├── pages/
│   │   └── Home.jsx
│   │   └── Signup.jsx
│   │   └── Login.jsx
│   │   └── Dashboard.jsx
│   ├── components/
│   │   └── Navbar.jsx
│   │   └── SignupForm.jsx
│   ├── App.jsx
│   └── main.jsx
├── tailwind.config.js
├── index.html
|── package.json
├── .env # Environment variables (VITE_API_URL, etc.)
└── README.md


---

## Setup

### Install dependencies
```bash
npm install

Environment variables
Create .env in the frontend folder:
VITE_API_URL=http://localhost:3000

Running Locally
npm run dev

App runs on:
http://localhost:5173

Git Workflow
git add .
git commit -m "Describe your change"
git pull origin main   # Pull before pushing
git push origin main

Checklist for Starting Work
Open Terminal in fitflex-frontend
Ensure backend is already running
Start frontend:
npm run dev
Visit:
http://localhost:5173

Deployment
Frontend is deployed on Vercel:
https://fitflex-frontend.vercel.app
To redeploy:

Push changes to main branch in GitHub — Vercel auto-redeploys.

Author:
Nadav Hardof