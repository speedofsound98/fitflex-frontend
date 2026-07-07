import authFetch from '../utils/authFetch';
// src/pages/UserDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, MapPin, CalendarDays, Clock, Users, Tag, Building2,
  Dumbbell, CheckCircle2, Sparkles, ArrowRight,
} from 'lucide-react';

import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';

const SPORT_ICONS = {
  yoga: '🧘', pilates: '🤸', hiit: '🔥', cycling: '🚴', boxing: '🥊',
  swimming: '🏊', crossfit: '💪', dance: '💃', 'martial arts': '🥋',
  shiatsu: '🙌', default: '🏃',
};

// Soft chip backgrounds cycled per sport for variety (reference-style icon chips)
const CHIP_STYLES = [
  'bg-brand-100 text-brand-700',
  'bg-ink-100 text-ink-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
];

function sportIcon(type) {
  if (!type) return SPORT_ICONS.default;
  return SPORT_ICONS[type.toLowerCase()] || SPORT_ICONS.default;
}

function chipStyle(type) {
  const key = (type || 'default').toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return CHIP_STYLES[Math.abs(hash) % CHIP_STYLES.length];
}

function StudioCard({ studio }) {
  return (
    <Link to={`/studios/${studio.id}`}
      className="bg-white rounded-3xl shadow-card hover:-translate-y-1 hover:shadow-card-lg transition duration-300 p-6 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 rounded-2xl bg-ink-100 text-ink-700 grid place-items-center shrink-0">
            <Building2 className="w-5 h-5" strokeWidth={1.9} />
          </span>
          <div>
            <h3 className="font-display font-bold text-ink-900 text-lg leading-tight">{studio.name}</h3>
            {(studio.city || studio.neighbourhood) && (
              <p className="text-sm text-ink-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {[studio.neighbourhood, studio.city].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {studio.verified && (
            <span className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-600 font-semibold px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          )}
          {studio.offers_appointments && (
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">
              <CalendarDays className="w-3 h-3" /> Appointments
            </span>
          )}
        </div>
      </div>
      {studio.about && <p className="text-sm text-ink-500 line-clamp-2">{studio.about}</p>}
      <span className="inline-flex items-center gap-1.5 text-sm text-brand-600 font-semibold mt-auto">
        View studio <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </Link>
  );
}

function ClassCard({ cls, onBook, bookedIds }) {
  const alreadyBooked = bookedIds.has(cls.id);
  const isPast = new Date(cls.datetime) < new Date();

  return (
    <div className="bg-white rounded-3xl shadow-card hover:-translate-y-1 hover:shadow-card-lg transition duration-300 p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`inline-grid place-items-center w-11 h-11 rounded-2xl text-xl ${chipStyle(cls.sport_type)}`}>
            {sportIcon(cls.sport_type)}
          </span>
          <h3 className="font-display font-bold text-ink-900 text-lg mt-3 leading-tight">{cls.name}</h3>
          <Link to={`/studios/${cls.studio_id}`} className="text-sm text-brand-600 font-medium hover:underline">
            {cls.studio_name}
          </Link>
        </div>
        <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
          {cls.credit_cost} cr
        </span>
      </div>

      <div className="text-sm text-ink-500 space-y-1.5">
        <p className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-ink-300" />
          {new Date(cls.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
        <p className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-ink-300" />
          {new Date(cls.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {cls.studio_location && (
          <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-ink-300" />{cls.studio_location}</p>
        )}
        {cls.sport_type && (
          <p className="flex items-center gap-2"><Tag className="w-4 h-4 text-ink-300" />{cls.sport_type}</p>
        )}
        {cls.capacity && (
          <p className="flex items-center gap-2"><Users className="w-4 h-4 text-ink-300" />{cls.capacity} spots</p>
        )}
      </div>

      <button
        onClick={() => onBook(cls.id)}
        disabled={alreadyBooked || isPast}
        className={`mt-auto w-full py-2.5 rounded-full text-sm font-semibold transition
          ${alreadyBooked ? 'bg-emerald-100 text-emerald-700 cursor-default'
          : isPast ? 'bg-ink-50 text-ink-300 cursor-default'
          : 'bg-brand-500 text-white hover:bg-brand-600 shadow-pill'}`}
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
  const [studios, setStudios] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'studios'
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

    fetch(`${api}/studios`)
      .then(r => r.json())
      .then(d => setStudios(d.studios || []))
      .catch(() => {});

    authFetch(`${api}/users/${userId}/bookings`, { })
      .then(r => r.json())
      .then(d => setBookings(d.bookings || []))
      .catch(() => {});
  }, [api, userId]);

  const bookedIds = useMemo(() => new Set(bookings.map(b => b.class_id)), [bookings]);

  // All unique locations for the filter dropdown (classes + studio cities)
  const locations = useMemo(() => {
    const locs = [
      ...classes.map(c => c.studio_location),
      ...studios.map(s => s.city),
      ...studios.map(s => s.neighbourhood),
    ].filter(Boolean);
    return [...new Set(locs)].sort();
  }, [classes, studios]);

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

  // Upcoming bookings count for the stat row
  const upcomingBookings = useMemo(
    () => bookings.filter(b => new Date(b.datetime) >= new Date()).length,
    [bookings]
  );

  // Search + filter results — classes
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

  // Search + filter results — studios
  const filteredStudios = useMemo(() => {
    const q = search.toLowerCase();
    return studios.filter(s => {
      const matchSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        (s.about || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.neighbourhood || '').toLowerCase().includes(q);
      const matchLocation = !locationFilter ||
        s.city === locationFilter ||
        s.neighbourhood === locationFilter;
      return matchSearch && matchLocation;
    });
  }, [studios, search, locationFilter]);

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
    <div className="min-h-screen bg-paper">
      <Navbar />

      <div className="pt-28 pb-16 px-4 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-ink-900 tracking-tight">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-ink-500 mt-1.5">Find and book your next fitness class.</p>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="rounded-3xl p-5 text-white shadow-card flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg,#e8702a,#f1a878)' }}>
            <span className="w-12 h-12 rounded-2xl bg-white/20 grid place-items-center shrink-0">
              <CalendarDays className="w-6 h-6" strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-sm/tight opacity-90">Upcoming bookings</p>
              <p className="font-display font-black text-2xl">{upcomingBookings}</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-card flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 grid place-items-center shrink-0">
              <Dumbbell className="w-6 h-6" strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-sm/tight text-ink-400">Classes available</p>
              <p className="font-display font-black text-2xl text-ink-900">{classes.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-card flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-ink-100 text-ink-700 grid place-items-center shrink-0">
              <Building2 className="w-6 h-6" strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-sm/tight text-ink-400">Studios on FitFlex</p>
              <p className="font-display font-black text-2xl text-ink-900">{studios.length}</p>
            </div>
          </div>
        </div>

        {msg && (
          <div className={`mb-6 p-3.5 rounded-2xl text-sm font-medium ${msgType === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {msg}
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 bg-white rounded-full shadow-card p-1.5 w-fit">
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-5 py-2 text-sm font-semibold rounded-full transition ${activeTab === 'classes' ? 'bg-brand-500 text-white shadow-pill' : 'text-ink-500 hover:bg-ink-50'}`}>
            Classes
          </button>
          <button
            onClick={() => setActiveTab('studios')}
            className={`px-5 py-2 text-sm font-semibold rounded-full transition ${activeTab === 'studios' ? 'bg-brand-500 text-white shadow-pill' : 'text-ink-500 hover:bg-ink-50'}`}>
            Studios
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-300" strokeWidth={2} />
            <input
              className="w-full bg-white rounded-full pl-11 pr-4 py-3 text-sm shadow-card border border-transparent focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition"
              placeholder="Search classes, studios or sport types..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-white rounded-full px-5 py-3 text-sm shadow-card border border-transparent focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 text-ink-600 transition"
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
          >
            <option value="">All locations</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* ── Classes tab ── */}
        {activeTab === 'classes' && (
          <>
            {showSearch ? (
              <>
                {filteredStudios.length > 0 && (
                  <section className="mb-10">
                    <h2 className="font-display font-bold text-xl text-ink-900 mb-4">
                      {filteredStudios.length} studio{filteredStudios.length !== 1 ? 's' : ''}
                      {search && ` for "${search}"`}
                      {locationFilter && ` in ${locationFilter}`}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredStudios.map(s => <StudioCard key={s.id} studio={s} />)}
                    </div>
                  </section>
                )}
                <section className="mb-12">
                  <h2 className="font-display font-bold text-xl text-ink-900 mb-4">
                    {filtered.length} class{filtered.length !== 1 ? 'es' : ''}
                    {search && ` for "${search}"`}
                    {locationFilter && ` in ${locationFilter}`}
                  </h2>
                  {filtered.length === 0 ? (
                    <p className="text-ink-500">No classes match your search.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {filtered.map(c => <ClassCard key={c.id} cls={c} onBook={book} bookedIds={bookedIds} />)}
                    </div>
                  )}
                </section>
              </>
            ) : (
              <>
                {recommended.length > 0 && (
                  <section className="mb-12">
                    <h2 className="font-display font-bold text-xl text-ink-900 mb-1 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-brand-500" /> Recommended for you
                    </h2>
                    <p className="text-sm text-ink-400 mb-4">Upcoming classes you haven't booked yet</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {recommended.map(c => <ClassCard key={c.id} cls={c} onBook={book} bookedIds={bookedIds} />)}
                    </div>
                  </section>
                )}
                <section className="mb-12">
                  <h2 className="font-display font-bold text-xl text-ink-900 mb-1">All classes</h2>
                  <p className="text-sm text-ink-400 mb-4">Everything available on the platform</p>
                  {classes.length === 0 ? (
                    <p className="text-ink-500">No classes available yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {classes.map(c => <ClassCard key={c.id} cls={c} onBook={book} bookedIds={bookedIds} />)}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}

        {/* ── Studios tab ── */}
        {activeTab === 'studios' && (
          <section className="mb-12">
            <h2 className="font-display font-bold text-xl text-ink-900 mb-1">
              {showSearch
                ? `${filteredStudios.length} studio${filteredStudios.length !== 1 ? 's' : ''}${search ? ` for "${search}"` : ''}${locationFilter ? ` in ${locationFilter}` : ''}`
                : 'All Studios'}
            </h2>
            <p className="text-sm text-ink-400 mb-4">Browse studios — click to view classes and book appointments</p>
            {filteredStudios.length === 0 ? (
              <p className="text-ink-500">No studios match your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStudios.map(s => <StudioCard key={s.id} studio={s} />)}
              </div>
            )}
          </section>
        )}

        {/* Booking history */}
        <section>
          <h2 className="font-display font-bold text-xl text-ink-900 mb-1">My bookings</h2>
          <p className="text-sm text-ink-400 mb-4">Classes you've reserved</p>
          {bookings.length === 0 ? (
            <p className="text-ink-500">You haven't booked any classes yet.</p>
          ) : (
            <div className="bg-white rounded-3xl shadow-card overflow-hidden">
              <ul className="divide-y divide-ink-50">
                {bookings.map(b => {
                  const isPast = new Date(b.datetime) < new Date();
                  return (
                    <li key={b.id} className="flex items-center justify-between px-6 py-4 hover:bg-paper/60 transition">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className={`hidden sm:grid place-items-center w-10 h-10 rounded-2xl shrink-0 ${isPast ? 'bg-ink-50 text-ink-300' : 'bg-brand-100 text-brand-600'}`}>
                          <CalendarDays className="w-5 h-5" strokeWidth={1.9} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-800 truncate">{b.class_name}</p>
                          <p className="text-sm text-ink-400 truncate">
                            {b.studio_name}
                            {b.studio_location ? ` · ${b.studio_location}` : ''}
                            {' · '}{new Date(b.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {' '}{new Date(b.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isPast ? 'bg-ink-50 text-ink-400' : 'bg-emerald-100 text-emerald-700'}`}>
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
