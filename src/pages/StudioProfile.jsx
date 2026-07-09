import authFetch from '../utils/authFetch';
// src/pages/StudioProfile.jsx  — public view
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, CheckCircle2, Lock, MessageCircle, Mail, CalendarDays, Clock,
  Tag, Users, Phone, Globe, AtSign, X,
} from 'lucide-react';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';
import AppointmentMatrix from '../components/AppointmentMatrix';
import { sportIcon, chipStyle } from '../utils/sport';

const COVER_GRADIENTS = {
  blue:   'from-ink-800 to-ink-600',
  purple: 'from-purple-700 to-purple-500',
  green:  'from-emerald-700 to-emerald-500',
  orange: 'from-brand-600 to-brand-400',
  rose:   'from-rose-600 to-pink-500',
  teal:   'from-teal-700 to-cyan-500',
  slate:  'from-ink-900 to-ink-700',
};

function formatHour(h) {
  if (h === 0) return '12:00 AM';
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return '12:00 PM';
  return `${h - 12}:00 PM`;
}

export default function StudioProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = import.meta.env.VITE_API_URL;

  const [studio, setStudio] = useState(null);
  usePageTitle(studio ? studio.name : 'Studio');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [enquiryStatus, setEnquiryStatus] = useState('');
  const [guestNotice, setGuestNotice] = useState('');

  const userRole = localStorage.getItem('userRole');
  const isLoggedIn = !!localStorage.getItem('userId');

  useEffect(() => {
    Promise.all([
      fetch(`${api}/studios/${id}`).then(r => r.json()),
      fetch(`${api}/studios/${id}/classes`).then(r => r.json()),
    ]).then(([studioData, classData]) => {
      if (studioData.error) { setNotFound(true); }
      else {
        setStudio(studioData.studio);
        setClasses(classData.classes || []);
      }
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [api, id]);

  if (loading) return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-32 text-center text-ink-400">Loading…</div>
    </div>
  );

  async function sendEnquiry(e) {
    e.preventDefault();
    if (!enquiryMsg.trim()) return;
    try {
      const res = await authFetch(`${api}/studios/${id}/enquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: enquiryMsg.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setEnquiryStatus('success');
      setEnquiryMsg('');
    } catch (err) {
      setEnquiryStatus(err.message);
    }
  }

  function showGuestNotice(msg) {
    setGuestNotice(msg);
    setTimeout(() => setGuestNotice(''), 4000);
  }

  if (notFound) return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-32 text-center">
        <p className="text-xl font-display font-bold text-ink-800">Studio not found.</p>
        <Link to="/" className="text-brand-600 font-semibold hover:underline mt-2 inline-block">Go home</Link>
      </div>
    </div>
  );

  const upcomingClasses = classes.filter(c => new Date(c.datetime) >= new Date())
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  const gradient = COVER_GRADIENTS[studio.cover_color] || COVER_GRADIENTS.blue;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">

        {/* Guest notice toast */}
        {guestNotice && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-ink-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-card-lg flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-300" /> {guestNotice}
            <Link to="/login" className="underline text-brand-300 ml-1">Log in</Link>
          </div>
        )}

        {/* Cover photo (if set) */}
        {studio.cover_photo && (
          <div className="rounded-3xl overflow-hidden -mb-6 relative h-52 sm:h-64">
            <img src={studio.cover_photo} alt={`${studio.name} cover`}
              className="w-full h-full object-cover" />
          </div>
        )}

        {/* Studio header */}
        <div className={`bg-gradient-to-br ${gradient} rounded-3xl shadow-card-lg p-8 text-white mb-8 ${studio.cover_photo ? 'rounded-t-none pt-10' : ''}`}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="font-display font-bold text-3xl sm:text-4xl leading-tight">{studio.name}</h1>
                {studio.verified && (
                  <span className="inline-flex items-center gap-1 bg-white/90 text-brand-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              {(studio.city || studio.neighbourhood) && (
                <p className="text-white/80 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {[studio.neighbourhood, studio.city].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
          {studio.tagline && <p className="mt-3 text-white/90 font-medium italic text-lg">“{studio.tagline}”</p>}
          {studio.about && <p className="mt-3 text-white/75 max-w-xl text-sm leading-relaxed">{studio.about}</p>}

          <div className="flex flex-wrap gap-2 mt-5">
            {!isLoggedIn && (
              <Link to="/login"
                className="inline-flex items-center gap-2 bg-white text-ink-900 font-semibold px-5 py-2.5 rounded-full hover:bg-brand-50 transition text-sm shadow-pill">
                <Lock className="w-4 h-4" /> Log in to book
              </Link>
            )}
            {studio.accepts_enquiries && userRole === 'user' && (
              <button
                onClick={() => { setEnquiryOpen(o => !o); setEnquiryStatus(''); }}
                className="inline-flex items-center gap-2 bg-white text-ink-900 font-semibold px-5 py-2.5 rounded-full hover:bg-brand-50 transition text-sm shadow-pill"
              >
                <MessageCircle className="w-4 h-4" /> Enquire for custom time
              </button>
            )}
            {isLoggedIn && !(userRole === 'studio' && localStorage.getItem('userId') === id) && (
              <button
                onClick={() => navigate(`/messages?type=studio&id=${id}&name=${encodeURIComponent(studio.name)}`)}
                className="inline-flex items-center gap-2 bg-white/15 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-white/25 transition text-sm backdrop-blur-sm"
              >
                <Mail className="w-4 h-4" /> Send message
              </button>
            )}
            {!isLoggedIn && (
              <button
                onClick={() => showGuestNotice('You need to be logged in to send messages.')}
                className="inline-flex items-center gap-2 bg-white/15 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-white/25 transition text-sm backdrop-blur-sm"
              >
                <Mail className="w-4 h-4" /> Send message
              </button>
            )}
          </div>
        </div>

        {/* Enquiry form */}
        {enquiryOpen && studio.accepts_enquiries && (
          <div className="bg-white rounded-3xl shadow-card p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-bold text-ink-900 mb-1">Send an enquiry</h3>
                <p className="text-sm text-ink-500 mb-4">Ask {studio.name} about custom or private session times.</p>
              </div>
              <button onClick={() => setEnquiryOpen(false)} className="text-ink-300 hover:text-ink-500 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            {enquiryStatus === 'success' ? (
              <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4 text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Enquiry sent! The studio will be in touch.
              </div>
            ) : (
              <form onSubmit={sendEnquiry} className="space-y-3">
                {enquiryStatus && <p className="text-rose-600 text-sm">{enquiryStatus}</p>}
                <textarea
                  rows={3}
                  className="w-full bg-paper border border-transparent rounded-2xl p-3 text-sm focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition"
                  placeholder="e.g. I'm looking for a private yoga session on weekday mornings..."
                  value={enquiryMsg}
                  onChange={e => setEnquiryMsg(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="bg-brand-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill">Send enquiry</button>
                  <button type="button" onClick={() => setEnquiryOpen(false)} className="text-ink-500 px-4 py-2.5 rounded-full text-sm hover:bg-ink-50 transition">Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Appointment slots */}
        {studio.offers_appointments && (
          <div className="mb-10">
            <h2 className="font-display font-bold text-2xl text-ink-900 mb-1">Book an Appointment</h2>
            <p className="text-sm text-ink-500 mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Reserve a private session slot directly with {studio.name}.</span>
              {(studio.opening_hour != null && studio.closing_hour != null) && (
                <span className="inline-flex items-center gap-1 text-ink-400">
                  <Clock className="w-3.5 h-3.5" /> {formatHour(studio.opening_hour)} – {formatHour(studio.closing_hour)}
                </span>
              )}
            </p>
            {!isLoggedIn ? (
              <div className="bg-white border border-brand-100 rounded-3xl shadow-card p-8 text-center">
                <span className="inline-grid place-items-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 mx-auto mb-3">
                  <Lock className="w-5 h-5" />
                </span>
                <p className="text-ink-700 font-medium mb-4">Log in to view and book appointment slots</p>
                <Link to="/login" className="inline-block bg-brand-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill">
                  Log in
                </Link>
              </div>
            ) : (
              <AppointmentMatrix
                studioId={id}
                mode="view"
                userId={userRole === 'user' ? localStorage.getItem('userId') : null}
                openingHour={studio.opening_hour ?? 9}
                closingHour={studio.closing_hour ?? 18}
              />
            )}
          </div>
        )}

        {/* Upcoming classes */}
        <h2 className="font-display font-bold text-2xl text-ink-900 mb-4">Upcoming Classes</h2>
        {upcomingClasses.length === 0 ? (
          <p className="text-ink-500">No upcoming classes scheduled.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingClasses.map(cls => (
              <div key={cls.id} className="bg-white rounded-3xl shadow-card hover:-translate-y-1 hover:shadow-card-lg transition duration-300 p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-grid place-items-center w-11 h-11 rounded-2xl text-xl ${chipStyle(cls.sport_type)}`}>
                      {sportIcon(cls.sport_type)}
                    </span>
                    <h3 className="font-display font-bold text-ink-900 text-lg mt-3 leading-tight">{cls.name}</h3>
                  </div>
                  <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                    {cls.credit_cost === 0 ? 'Free' : `${cls.credit_cost} cr`}
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
                  {cls.sport_type && <p className="flex items-center gap-2"><Tag className="w-4 h-4 text-ink-300" />{cls.sport_type}</p>}
                  {cls.capacity && <p className="flex items-center gap-2"><Users className="w-4 h-4 text-ink-300" />{cls.capacity} spots</p>}
                </div>
                {isLoggedIn ? (
                  <Link to="/dashboard" className="mt-auto w-full py-2.5 rounded-full bg-brand-500 text-white text-sm font-semibold text-center hover:bg-brand-600 transition shadow-pill">
                    Book via Dashboard
                  </Link>
                ) : (
                  <button
                    onClick={() => showGuestNotice('You need to log in to book a class.')}
                    className="mt-auto w-full py-2.5 rounded-full bg-brand-500 text-white text-sm font-semibold text-center hover:bg-brand-600 transition shadow-pill"
                  >
                    Book this class
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact info */}
        {(studio.phone || studio.website || studio.instagram) && (
          <div className="mt-10 bg-white rounded-3xl shadow-card p-6">
            <h2 className="font-display font-bold text-lg text-ink-900 mb-4">Contact & Links</h2>
            <div className="flex flex-col gap-3 text-sm text-ink-600">
              {studio.phone && (
                <a href={`tel:${studio.phone}`} className="flex items-center gap-2.5 hover:text-brand-600 transition">
                  <Phone className="w-4 h-4 text-ink-300" /> <span>{studio.phone}</span>
                </a>
              )}
              {studio.website && (
                <a href={studio.website} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 hover:text-brand-600 transition">
                  <Globe className="w-4 h-4 text-ink-300" /> <span className="underline">{studio.website}</span>
                </a>
              )}
              {studio.instagram && (
                <a href={`https://instagram.com/${studio.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 hover:text-brand-600 transition">
                  <AtSign className="w-4 h-4 text-ink-300" /> <span className="underline">{studio.instagram}</span>
                </a>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
