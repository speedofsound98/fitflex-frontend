// src/pages/dashboard/UserDashboardLayout.jsx
import authFetch from '../../utils/authFetch';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Building2, Ticket } from 'lucide-react';
import Navbar from '../../components/NavBar';
import usePageTitle from '../../hooks/usePageTitle';

const TABS = [
  { to: '/dashboard', label: 'Overview', Icon: LayoutDashboard, end: true },
  { to: '/dashboard/classes', label: 'Classes', Icon: Dumbbell },
  { to: '/dashboard/studios', label: 'Studios', Icon: Building2 },
  { to: '/dashboard/bookings', label: 'Bookings', Icon: Ticket },
];

export default function UserDashboardLayout() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const api = import.meta.env.VITE_API_URL;

  usePageTitle('Dashboard');
  const [classes, setClasses] = useState([]);
  const [studios, setStudios] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  useEffect(() => {
    if (userRole !== 'user' || !userId) navigate('/login');
  }, [userRole, userId, navigate]);

  const refreshBookings = useCallback(() => {
    authFetch(`${api}/users/${userId}/bookings`, {})
      .then(r => r.json())
      .then(d => setBookings(d.bookings || []))
      .catch(() => {});
  }, [api, userId]);

  useEffect(() => {
    authFetch(`${api}/classes`, {})
      .then(r => r.json())
      .then(d => setClasses(d.classes || []))
      .catch(() => {});

    fetch(`${api}/studios`)
      .then(r => r.json())
      .then(d => setStudios(d.studios || []))
      .catch(() => {});

    refreshBookings();
  }, [api, userId, refreshBookings]);

  const bookedIds = useMemo(() => new Set(bookings.map(b => b.class_id)), [bookings]);

  function flash(message, type = 'success') {
    setMsgType(type);
    setMsg(message);
    setTimeout(() => setMsg(''), 4000);
  }

  const book = useCallback(async (classId) => {
    try {
      const res = await authFetch(`${api}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: Number(userId), class_id: Number(classId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      flash('Class booked! 🎉');
      refreshBookings();
    } catch (e) { flash(e.message, 'error'); }
  }, [api, userId, refreshBookings]);

  const cancelBooking = useCallback(async (bookingId) => {
    if (!confirm('Cancel this booking? Your credits will be refunded.')) return;
    try {
      const res = await authFetch(`${api}/bookings/${bookingId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancellation failed');
      flash('Booking cancelled. Credits refunded! 💸');
      refreshBookings();
    } catch (e) { flash(e.message, 'error'); }
  }, [api, refreshBookings]);

  const ctx = { classes, studios, bookings, bookedIds, book, cancelBooking, refreshBookings, userName };

  const tabCls = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-sm font-semibold rounded-full transition whitespace-nowrap ${
      isActive ? 'bg-brand-500 text-white shadow-pill' : 'text-ink-500 hover:bg-ink-50'
    }`;

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="pt-28 pb-16 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-ink-900 tracking-tight">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-ink-500 mt-1.5">Find and book your next fitness class.</p>
        </div>

        {/* Sub-nav */}
        <div className="flex gap-1 mb-6 bg-white rounded-full shadow-card p-1.5 w-fit max-w-full overflow-x-auto">
          {TABS.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={tabCls}>
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
        </div>

        {msg && (
          <div className={`mb-6 p-3.5 rounded-2xl text-sm font-medium ${msgType === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {msg}
          </div>
        )}

        <Outlet context={ctx} />
      </div>
    </div>
  );
}
