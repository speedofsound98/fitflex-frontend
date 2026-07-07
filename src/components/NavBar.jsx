// src/components/NavBar.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, X, Dumbbell } from 'lucide-react';
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
        className="relative p-2 rounded-full text-ink-500 hover:bg-ink-50 hover:text-ink-800 transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" strokeWidth={1.9} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-brand-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-card-lg border border-ink-100 z-30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
            <span className="font-semibold text-ink-800 text-sm">Notifications</span>
            {notifications.some(n => !n.read) && (
              <button onClick={markAllRead} className="text-xs text-brand-600 hover:underline">Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-ink-50">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-ink-300 text-sm">No notifications yet</p>
            ) : notifications.map(n => (
              <div key={n.id} className={`px-4 py-3 ${n.read ? 'bg-white' : 'bg-brand-50'}`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{typeIcon[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-800 truncate">{n.title}</p>
                    <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-ink-300 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1" />}
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
  // Read auth state synchronously so the navbar doesn't flash the
  // logged-out state (orange Get Started) on every route change/remount.
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('userName'));
  const [name, setName] = useState(() => localStorage.getItem('userName') || '');
  const [role, setRole] = useState(() => localStorage.getItem('userRole') || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

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

  const navLink = 'text-sm font-medium text-ink-500 hover:text-ink-900 transition';

  return (
    <div className="fixed top-3 sm:top-4 inset-x-3 sm:inset-x-6 z-20">
      <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-md rounded-full shadow-pill border border-ink-100/60">
        {/* Main bar */}
        <div className="flex justify-between items-center pl-5 pr-3 sm:pl-6 sm:pr-3 py-2.5">
          <Link to="/" className="flex items-center gap-2 group" onClick={closeMenu}>
            <span className="w-8 h-8 rounded-full bg-brand-500 text-white grid place-items-center group-hover:bg-brand-600 transition">
              <Dumbbell className="w-4 h-4" strokeWidth={2.2} />
            </span>
            <span className="text-lg font-display font-bold tracking-tight text-ink-900">FitFlex</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-5">
            <Link to="/pricing" className={navLink}>Pricing</Link>
            <Link to="/blog" className={navLink}>Blog</Link>
            <Link to="/groups" className={navLink}>Communities</Link>
            {authed ? (
              <>
                <Link to={dashboardPath} className={navLink}>Dashboard</Link>
                <Link to={settingsPath} className={navLink}>Settings</Link>
                <Link to="/messages" className={navLink}>Messages</Link>
                {role === 'user' && <Link to="/training-plan" className={navLink}>Training Plan</Link>}
                <NotificationBell role={role} />
                <span className="hidden lg:inline text-sm text-ink-400">Hi, {name}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold text-ink-600 border border-ink-200 rounded-full hover:border-ink-400 hover:text-ink-900 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={navLink}>Log in</Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-full hover:bg-brand-600 shadow-pill transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile: bell + hamburger */}
          <div className="flex items-center gap-1 sm:hidden">
            {authed && <NotificationBell role={role} />}
            <button
              className="p-2 rounded-full text-ink-600 hover:bg-ink-50 transition"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-6 h-6" strokeWidth={2} /> : <Menu className="w-6 h-6" strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden mt-2 max-w-6xl mx-auto bg-white rounded-3xl shadow-card-lg border border-ink-100/60 px-5 py-4 flex flex-col gap-3">
          <Link to="/pricing" onClick={closeMenu} className="text-sm font-medium text-ink-700 py-2 border-b border-ink-50">Pricing</Link>
          <Link to="/blog" onClick={closeMenu} className="text-sm font-medium text-ink-700 py-2 border-b border-ink-50">Blog</Link>
          <Link to="/groups" onClick={closeMenu} className="text-sm font-medium text-ink-700 py-2 border-b border-ink-50">Communities</Link>
          {authed ? (
            <>
              <p className="text-xs text-ink-400">Hi, {name}</p>
              <Link to={dashboardPath} onClick={closeMenu} className="text-sm font-medium text-ink-700 py-2 border-b border-ink-50">Dashboard</Link>
              <Link to={settingsPath} onClick={closeMenu} className="text-sm font-medium text-ink-700 py-2 border-b border-ink-50">Settings</Link>
              <Link to="/messages" onClick={closeMenu} className="text-sm font-medium text-ink-700 py-2 border-b border-ink-50">Messages</Link>
              {role === 'user' && <Link to="/training-plan" onClick={closeMenu} className="text-sm font-medium text-ink-700 py-2 border-b border-ink-50">Training Plan</Link>}
              <button onClick={handleLogout} className="w-full py-2.5 border border-ink-200 text-ink-700 text-sm font-semibold rounded-full hover:border-ink-400 transition">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signup" onClick={closeMenu} className="w-full py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-full text-center">Get Started</Link>
              <Link to="/login" onClick={closeMenu} className="w-full py-2.5 bg-ink-50 text-ink-800 text-sm font-semibold rounded-full text-center">Log in</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
