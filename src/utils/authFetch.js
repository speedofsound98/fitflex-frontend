// Wrapper around fetch that automatically adds Authorization header
// Falls back to cookie-based auth via credentials: 'include'
export default function authFetch(url, options = {}) {
  const token = localStorage.getItem('authToken');
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers, credentials: 'include' });
}
