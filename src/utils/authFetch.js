// Wrapper around fetch that automatically adds Authorization header
// Falls back to cookie-based auth via credentials: 'include'
// SECURITY TODO: the token in localStorage is XSS-readable. It exists because
// cross-site cookies (vercel.app -> onrender.com) get blocked. Fix options are in
// ../FITFLEX_STATUS.md -> "Security Follow-ups" (Vercel proxy or custom domain).
export default function authFetch(url, options = {}) {
  const token = localStorage.getItem('authToken');
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers, credentials: 'include' });
}
