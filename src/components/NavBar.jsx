// src/components/NavBar.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell, Menu, X, Dumbbell, LayoutDashboard, CreditCard, Newspaper,
  Users, MessageSquare, Settings, ClipboardList, LogOut, ChevronRight,
} from 'lucide-react';
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
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-card-lg border border-ink-100 z-50 overflow-hidden">
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear client state immediately — don't wait for the server
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('authToken');
    setAuthed(false);
    setRole('');
    setDrawerOpen(false);
    navigate('/');
    // Fire-and-forget to clear the httpOnly cookie on the server
    fetch(`${api}/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  };

  const dashboardPath = role === 'studio' ? '/studio' : '/dashboard';
  const settingsPath = role === 'studio' ? '/studio/settings' : '/settings';
  const closeDrawer = () => setDrawerOpen(false);

  // Lock body scroll + close on Esc while the drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Full menu shown inside the side drawer
  const drawerLinks = authed
    ? [
        { to: dashboardPath, label: 'Dashboard', Icon: LayoutDashboard },
        ...(role === 'user' ? [{ to: '/training-plan', label: 'Training Plan', Icon: ClipboardList }] : []),
        { to: '/messages', label: 'Messages', Icon: MessageSquare },
        { to: '/groups', label: 'Communities', Icon: Users },
        { to: '/pricing', label: 'Pricing', Icon: CreditCard },
        { to: '/blog', label: 'Blog', Icon: Newspaper },
        { to: settingsPath, label: 'Settings', Icon: Settings },
      ]
    : [
        { to: '/pricing', label: 'Pricing', Icon: CreditCard },
        { to: '/blog', label: 'Blog', Icon: Newspaper },
        { to: '/groups', label: 'Communities', Icon: Users },
        { to: '/studios', label: 'Browse Studios', Icon: Dumbbell },
      ];

  const drawerItem = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
    }`;

  return (
    <>
      <div className="fixed top-3 sm:top-4 inset-x-3 sm:inset-x-6 z-30">
        <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-md rounded-full shadow-pill border border-ink-100/60">
          <div className="flex justify-between items-center pl-5 pr-3 sm:pl-6 sm:pr-3 py-2.5">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group" onClick={closeDrawer}>
              <span className="w-8 h-8 rounded-full bg-brand-500 text-white grid place-items-center group-hover:bg-brand-600 transition">
                <Dumbbell className="w-4 h-4" strokeWidth={2.2} />
              </span>
              <span className="text-lg font-display font-bold tracking-tight text-ink-900">FitFlex</span>
            </Link>

            {/* Right cluster — minimal */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {authed ? (
                <>
                  <Link
                    to={dashboardPath}
                    className="hidden sm:inline-flex text-sm font-medium text-ink-600 hover:text-ink-900 px-3 py-2 transition"
                  >
                    Dashboard
                  </Link>
                  <NotificationBell role={role} />
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-2 pl-1 pr-1 sm:pr-2 py-1 rounded-full hover:bg-ink-50 transition"
                    aria-label="Open menu"
                  >
                    <span
                      className="w-8 h-8 rounded-full grid place-items-center text-white text-sm font-semibold shrink-0"
                      style={{ background: 'linear-gradient(135deg,#e8702a,#1e2c3a)' }}
                    >
                      {(name || 'U').charAt(0).toUpperCase()}
                    </span>
                    <Menu className="hidden sm:block w-4 h-4 text-ink-500" strokeWidth={2} />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hidden sm:inline-flex text-sm font-medium text-ink-600 hover:text-ink-900 px-3 py-2 transition">Log in</Link>
                  <Link
                    to="/signup"
                    className="hidden sm:inline-flex px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-full hover:bg-brand-600 shadow-pill transition"
                  >
                    Get Started
                  </Link>
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="p-2 rounded-full text-ink-600 hover:bg-ink-50 transition"
                    aria-label="Open menu"
                  >
                    <Menu className="w-6 h-6" strokeWidth={2} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Side drawer ── */}
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!drawerOpen}
      />
      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-[300px] max-w-[85vw] bg-white shadow-card-lg flex flex-col transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
          <span className="flex items-center gap-2 font-display font-bold text-ink-900">
            <span className="w-8 h-8 rounded-full bg-brand-500 text-white grid place-items-center">
              <Dumbbell className="w-4 h-4" strokeWidth={2.2} />
            </span>
            FitFlex
          </span>
          <button onClick={closeDrawer} className="p-2 rounded-full text-ink-500 hover:bg-ink-50 transition" aria-label="Close menu">
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {authed && (
          <div className="px-5 py-4 border-b border-ink-50">
            <p className="text-xs text-ink-400">Signed in as</p>
            <p className="font-semibold text-ink-900">{name}</p>
            <span className="inline-block mt-1 text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full capitalize">{role}</span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {drawerLinks.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end onClick={closeDrawer} className={drawerItem}>
              <Icon className="w-5 h-5" strokeWidth={1.9} />
              <span className="flex-1">{label}</span>
              <ChevronRight className="w-4 h-4 text-ink-300" />
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-ink-50">
          {authed ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-5 h-5" strokeWidth={1.9} /> Log out
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/signup" onClick={closeDrawer} className="w-full py-3 bg-brand-500 text-white text-sm font-semibold rounded-full text-center hover:bg-brand-600 transition">Get Started</Link>
              <Link to="/login" onClick={closeDrawer} className="w-full py-3 bg-ink-50 text-ink-800 text-sm font-semibold rounded-full text-center hover:bg-ink-100 transition">Log in</Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
