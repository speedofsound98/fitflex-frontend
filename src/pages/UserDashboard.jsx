import authFetch from '../utils/authFetch';
// src/pages/UserDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';

const SPORT_ICONS = {
  yoga: '🧘', pilates: '🤸', hiit: '🔥', cycling: '🚴', boxing: '🥊',
  swimming: '🏊', crossfit: '💪', dance: '💃', 'martial arts': '🥋',
  shiatsu: '🙌', default: '🏃',
};

function sportIcon(type) {
  if (!type) return SPORT_ICONS.default;
  return SPORT_ICONS[type.toLowerCase()] || SPORT_ICONS.default;
}

function ClassCard({ cls, onBook, bookedIds }) {
  const alreadyBooked = bookedIds.has(cls.id);
  const isPast = new Date(cls.datetime) < new Date();

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-md transition p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-2xl">{sportIcon(cls.sport_type)}</span>
          <h3 className="font-bold text-gray-800 text-lg mt-1">{cls.name}</h3>
          <Link to={`/studios/${cls.studio_id}`} className="text-sm text-blue-600 font-medium hover:underline">{cls.studio_name}</Link>
        </div>
        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
          {cls.credit_cost} credit{cls.credit_cost !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="text-sm text-gray-500 space-y-1">
        <p>📅 {new Date(cls.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
        <p>🕐 {new Date(cls.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
        {cls.studio_location && <p>📍 {cls.studio_location}</p>}
        {cls.sport_type && <p>🏷️ {cls.sport_type}</p>}
        {cls.capacity && <p>👥 {cls.capacity} spots</p>}
      </div>

      <button
        onClick={() => onBook(cls.id)}
        disabled={alreadyBooked || isPast}
        className={`mt-auto w-full py-2 rounded-xl text-sm font-semibold transition
          ${alreadyBooked ? 'bg-green-100 text-green-700 cursor-default'
          : isPast ? 'bg-gray-100 text-gray-400 cursor-default'
          : 'bg-blue-600 text-white hover:bg-blue-700'}`}
      >
        {alreadyBooked ? '✓ Booked' : isPast ? 'Past' : 'Book Class'}
      </button>
    </div>
  );
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const api = import.meta.env.VITE_API_URL;

  usePageTitle('Dashboard');
  const [classes, setClasses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  useEffect(() => {
    if (userRole !== 'user' || !userId) navigate('/login');
  }, [userRole, userId, navigate]);

  useEffect(() => {
    authFetch(`${api}/classes`, { })
      .then(r => r.json())
      .then(d => setClasses(d.classes || []))
      .catch(() => {});

    authFetch(`${api}/users/${userId}/bookings`, { })
      .then(r => r.json())
      .then(d => setBookings(d.bookings || []))
      .catch(() => {});
  }, [api, userId]);

  const bookedIds = useMemo(() => new Set(bookings.map(b => b.class_id)), [bookings]);

  // All unique locations for the filter dropdown
  const locations = useMemo(() => {
    const locs = classes.map(c => c.studio_location).filter(Boolean);
    return [...new Set(locs)].sort();
  }, [classes]);

  // Upcoming unbooked classes sorted by datetime
  const upcomingClasses = useMemo(() => {
    return classes
      .filter(c => new Date(c.datetime) >= new Date())
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }, [classes]);

  // Recommended: next 4 upcoming classes not yet booked
  const recommended = useMemo(() => {
    return upcomingClasses.filter(c => !bookedIds.has(c.id)).slice(0, 4);
  }, [upcomingClasses, bookedIds]);

  // Search + filter results
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return classes.filter(c => {
      const matchSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        c.studio_name.toLowerCase().includes(q) ||
        (c.sport_type || '').toLowerCase().includes(q);
      const matchLocation = !locationFilter || c.studio_location === locationFilter;
      return matchSearch && matchLocation;
    });
  }, [classes, search, locationFilter]);

  async function cancelBooking(bookingId) {
    if (!confirm('Cancel this booking? Your credits will be refunded.')) return;
    setMsg('');
    try {
      const res = await authFetch(`${api}/bookings/${bookingId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancellation failed');
      setMsgType('success');
      setMsg('Booking cancelled. Credits refunded! 💸');
      authFetch(`${api}/users/${userId}/bookings`, { })
        .then(r => r.json())
        .then(d => setBookings(d.bookings || []));
    } catch (e) {
      setMsgType('error');
      setMsg(e.message);
    }
  }

  async function book(classId) {
    setMsg('');
    try {
      const res = await authFetch(`${api}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: Number(userId), class_id: Number(classId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setMsgType('success');
      setMsg('Class booked! 🎉');
      // Refresh bookings
      authFetch(`${api}/users/${userId}/bookings`, { })
        .then(r => r.json())
        .then(d => setBookings(d.bookings || []));
    } catch (e) {
      setMsgType('error');
      setMsg(e.message);
    }
  }

  const showSearch = search || locationFilter;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userName} 👋</h1>
          <p className="text-gray-500 mt-1">Find and book your next fitness class.</p>
        </div>

        {msg && (
          <div className={`mb-6 p-3 rounded-xl text-sm font-medium ${msgType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {msg}
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              placeholder="Search classes, studios or sport types..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-600"
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
          >
            <option value="">📍 All locations</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Search results */}
        {showSearch && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              {search && ` for "${search}"`}
              {locationFilter && ` in ${locationFilter}`}
            </h2>
            {filtered.length === 0 ? (
              <p className="text-gray-500">No classes match your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map(c => <ClassCard key={c.id} cls={c} onBook={book} bookedIds={bookedIds} />)}
              </div>
            )}
          </section>
        )}

        {/* Recommended */}
        {!showSearch && recommended.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Recommended for you</h2>
            <p className="text-sm text-gray-500 mb-4">Upcoming classes you haven't booked yet</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {recommended.map(c => <ClassCard key={c.id} cls={c} onBook={book} bookedIds={bookedIds} />)}
            </div>
          </section>
        )}

        {/* All classes */}
        {!showSearch && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-800 mb-1">All classes</h2>
            <p className="text-sm text-gray-500 mb-4">Everything available on the platform</p>
            {classes.length === 0 ? (
              <p className="text-gray-500">No classes available yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {classes.map(c => <ClassCard key={c.id} cls={c} onBook={book} bookedIds={bookedIds} />)}
              </div>
            )}
          </section>
        )}

        {/* Booking history */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-1">My bookings</h2>
          <p className="text-sm text-gray-500 mb-4">Classes you've reserved</p>
          {bookings.length === 0 ? (
            <p className="text-gray-500">You haven't booked any classes yet.</p>
          ) : (
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {bookings.map(b => {
                  const isPast = new Date(b.datetime) < new Date();
                  return (
                    <li key={b.id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="font-semibold text-gray-800">{b.class_name}</p>
                        <p className="text-sm text-gray-500">
                          {b.studio_name}
                          {b.studio_location ? ` · ${b.studio_location}` : ''}
                          {' · '}{new Date(b.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' '}{new Date(b.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isPast ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                          {isPast ? 'Completed' : 'Upcoming'}
                        </span>
                        {!isPast && (
                          <button
                            onClick={() => cancelBooking(b.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
