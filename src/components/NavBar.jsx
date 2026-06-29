// src/components/NavBar.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authFetch from '../utils/authFetch';

const api = import.meta.env.VITE_API_URL;

function NotificationBell({ role }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  async function fetchNotifications() {
    try {
      const r = await authFetch(`${api}/notifications`);
      if (!r.ok) return;
      const d = await r.json();
      setNotifications(d.notifications || []);
      setUnread(d.unread || 0);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function markAllRead() {
    await authFetch(`${api}/notifications/read-all`, { method: 'PATCH' });
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  const typeIcon = { booking: '📅', cancellation: '❌', message: '📣', enquiry: '💬', dm: '💬', follow: '👤', event: '🎉', post: '📝', comment: '💬', broadcast: '📣' };
  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); if (!open && unread > 0) markAllRead(); }}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border z-30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-gray-800 text-sm">Notifications</span>
            {notifications.some(n => !n.read) && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-400 text-sm">No notifications yet</p>
            ) : notifications.map(n => (
              <div key={n.id} className={`px-4 py-3 ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{typeIcon[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [authed, setAuthed] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    setAuthed(!!userName);
    setName(userName || '');
    setRole(userRole || '');
  }, []);

  const handleLogout = () => {
    // Clear client state immediately — don't wait for the server
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('authToken');
    setAuthed(false);
    setRole('');
    setMenuOpen(false);
    navigate('/');
    // Fire-and-forget to clear the httpOnly cookie on the server
    fetch(`${api}/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  };

  const dashboardPath = role === 'studio' ? '/studio' : '/dashboard';
  const settingsPath = role === 'studio' ? '/studio/settings' : '/settings';
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="fixed top-0 left-0 w-full z-20 bg-white border-b shadow-sm">
      {/* Main bar */}
      <div className="flex justify-between items-center px-4 sm:px-6 py-3">
        <Link to="/" className="text-xl font-bold text-blue-600" onClick={closeMenu}>FitFlex</Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3">
          <Link to="/pricing" className="text-sm text-gray-600 hover:text-blue-600">Pricing</Link>
          <Link to="/blog" className="text-sm text-gray-600 hover:text-blue-600">Blog</Link>
          <Link to="/groups" className="text-sm text-gray-600 hover:text-blue-600">Communities</Link>
          {authed ? (
            <>
              <Link to={dashboardPath} className="text-sm text-gray-600 hover:text-blue-600">Dashboard</Link>
              <Link to={settingsPath} className="text-sm text-gray-600 hover:text-blue-600">Settings</Link>
              <Link to="/messages" className="text-sm text-gray-600 hover:text-blue-600">Messages</Link>
              {role === 'user' && <Link to="/training-plan" className="text-sm text-gray-600 hover:text-blue-600">Training Plan</Link>}
              <NotificationBell role={role} />
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-600">Hi, {name}</span>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signup" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">Sign Up</Link>
              <Link to="/login" className="px-4 py-2 bg-gray-100 text-gray-800 text-sm rounded-lg hover:bg-gray-200 transition">Login</Link>
            </>
          )}
        </div>

        {/* Mobile: bell + hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          {authed && <NotificationBell role={role} />}
          <button
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t bg-white px-4 py-3 flex flex-col gap-3">
          <Link to="/pricing" onClick={closeMenu} className="text-sm text-gray-700 py-2 border-b">Pricing</Link>
          <Link to="/blog" onClick={closeMenu} className="text-sm text-gray-700 py-2 border-b">Blog</Link>
          <Link to="/groups" onClick={closeMenu} className="text-sm text-gray-700 py-2 border-b">Communities</Link>
          {authed ? (
            <>
              <p className="text-xs text-gray-400">Hi, {name}</p>
              <Link to={dashboardPath} onClick={closeMenu} className="text-sm text-gray-700 py-2 border-b">Dashboard</Link>
              <Link to={settingsPath} onClick={closeMenu} className="text-sm text-gray-700 py-2 border-b">Settings</Link>
              <Link to="/messages" onClick={closeMenu} className="text-sm text-gray-700 py-2 border-b">Messages</Link>
              {role === 'user' && <Link to="/training-plan" onClick={closeMenu} className="text-sm text-gray-700 py-2 border-b">Training Plan</Link>}
              <button onClick={handleLogout} className="w-full py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signup" onClick={closeMenu} className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg text-center">Sign Up</Link>
              <Link to="/login" onClick={closeMenu} className="w-full py-2 bg-gray-100 text-gray-800 text-sm rounded-lg text-center">Login</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
