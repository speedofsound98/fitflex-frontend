import authFetch from '../utils/authFetch';
// src/pages/StudioProfile.jsx  — public view
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';
import AppointmentMatrix from '../components/AppointmentMatrix';

const COVER_GRADIENTS = {
  blue:   'from-blue-600 to-blue-400',
  purple: 'from-purple-600 to-purple-400',
  green:  'from-green-600 to-green-400',
  orange: 'from-orange-500 to-amber-400',
  rose:   'from-rose-500 to-pink-400',
  teal:   'from-teal-600 to-cyan-400',
  slate:  'from-slate-700 to-slate-500',
};

const SPORT_ICONS = {
  yoga: '🧘', pilates: '🤸', hiit: '🔥', cycling: '🚴', boxing: '🥊',
  swimming: '🏊', crossfit: '💪', dance: '💃', 'martial arts': '🥋',
  shiatsu: '🙌', running: '🏃', default: '🏋️',
};
function sportIcon(type) {
  return SPORT_ICONS[(type||'').toLowerCase()] || SPORT_ICONS.default;
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
  const userRole = localStorage.getItem('userRole');

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-32 text-center text-gray-400">Loading…</div>
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

  if (notFound) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-32 text-center">
        <p className="text-xl font-semibold text-gray-700">Studio not found.</p>
        <Link to="/" className="text-blue-600 hover:underline mt-2 block">Go home</Link>
      </div>
    </div>
  );

  const upcomingClasses = classes.filter(c => new Date(c.datetime) >= new Date())
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  const gradient = COVER_GRADIENTS[studio.cover_color] || COVER_GRADIENTS.blue;
  const isLoggedIn = !!localStorage.getItem('userId');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">

        {/* Studio header */}
        <div className={`bg-gradient-to-br ${gradient} rounded-3xl p-8 text-white mb-8`}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-extrabold">{studio.name}</h1>
                {studio.verified && <span className="bg-white text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">✅ Verified</span>}
              </div>
              {(studio.city || studio.neighbourhood) && (
                <p className="text-blue-100">📍 {[studio.neighbourhood, studio.city].filter(Boolean).join(', ')}</p>
              )}
            </div>
            <div className="flex flex-col gap-1 text-sm text-blue-100">
              {studio.phone && <span>📞 {studio.phone}</span>}
              {studio.website && (
                <a href={studio.website} target="_blank" rel="noreferrer" className="hover:text-white underline">🌐 Website</a>
              )}
              {studio.instagram && (
                <a href={`https://instagram.com/${studio.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="hover:text-white underline">📸 {studio.instagram}</a>
              )}
            </div>
          </div>
          {studio.tagline && <p className="mt-2 text-white/90 font-medium italic">"{studio.tagline}"</p>}
          {studio.about && <p className="mt-3 text-white/80 max-w-xl text-sm">{studio.about}</p>}
          <div className="flex flex-wrap gap-2 mt-4">
            {!isLoggedIn && (
              <Link to="/login"
                className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-5 py-2 rounded-full hover:bg-blue-50 transition text-sm">
                🔑 Log in to book
              </Link>
            )}
            {studio.accepts_enquiries && userRole === 'user' && (
              <button
                onClick={() => { setEnquiryOpen(o => !o); setEnquiryStatus(''); }}
                className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-5 py-2 rounded-full hover:bg-blue-50 transition text-sm"
              >
                💬 Enquire for custom time
              </button>
            )}
            {userRole && !(userRole === 'studio' && localStorage.getItem('userId') === id) && (
              <button
                onClick={() => navigate(`/messages?type=studio&id=${id}&name=${encodeURIComponent(studio.name)}`)}
                className="inline-flex items-center gap-2 bg-white/20 text-white font-semibold px-5 py-2 rounded-full hover:bg-white/30 transition text-sm"
              >
                ✉️ Send message
              </button>
            )}
          </div>
        </div>

        {/* Enquiry form */}
        {enquiryOpen && studio.accepts_enquiries && (
          <div className="bg-white rounded-2xl shadow p-6 mb-8">
            <h3 className="font-bold text-gray-800 mb-1">Send an enquiry</h3>
            <p className="text-sm text-gray-500 mb-4">Ask {studio.name} about custom or private session times.</p>
            {enquiryStatus === 'success' ? (
              <div className="bg-green-100 text-green-700 rounded-xl p-4 text-sm font-medium">
                Enquiry sent! The studio will be in touch. ✅
              </div>
            ) : (
              <form onSubmit={sendEnquiry} className="space-y-3">
                {enquiryStatus && <p className="text-red-600 text-sm">{enquiryStatus}</p>}
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="e.g. I'm looking for a private yoga session on weekday mornings..."
                  value={enquiryMsg}
                  onChange={e => setEnquiryMsg(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">Send</button>
                  <button type="button" onClick={() => setEnquiryOpen(false)} className="text-gray-500 px-4 py-2 rounded-xl text-sm hover:bg-gray-100 transition">Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Appointment slots */}
        {studio.offers_appointments && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Book an Appointment</h2>
            <p className="text-sm text-gray-500 mb-4">
              Reserve a private session slot directly with {studio.name}.
              {(studio.opening_hour != null && studio.closing_hour != null) && (
                <span className="ml-2 text-gray-400">
                  🕐 Business hours: {studio.opening_hour < 12 ? `${studio.opening_hour}:00 AM` : studio.opening_hour === 12 ? '12:00 PM' : `${studio.opening_hour - 12}:00 PM`}
                  {' – '}
                  {studio.closing_hour < 12 ? `${studio.closing_hour}:00 AM` : studio.closing_hour === 12 ? '12:00 PM' : `${studio.closing_hour - 12}:00 PM`}
                </span>
              )}
            </p>
            <AppointmentMatrix
              studioId={id}
              mode="view"
              userId={localStorage.getItem('userRole') === 'user' ? localStorage.getItem('userId') : null}
              openingHour={studio.opening_hour ?? 9}
              closingHour={studio.closing_hour ?? 18}
            />
          </div>
        )}

        {/* Upcoming classes */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Classes</h2>
        {upcomingClasses.length === 0 ? (
          <p className="text-gray-500">No upcoming classes scheduled.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingClasses.map(cls => (
              <div key={cls.id} className="bg-white rounded-2xl shadow p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-2xl">{sportIcon(cls.sport_type)}</span>
                    <h3 className="font-bold text-gray-800 mt-1">{cls.name}</h3>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                    {cls.credit_cost === 0 ? 'Free' : `${cls.credit_cost} credit${cls.credit_cost !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>📅 {new Date(cls.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  <p>🕐 {new Date(cls.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  {cls.sport_type && <p>🏷️ {cls.sport_type}</p>}
                  {cls.capacity && <p>👥 {cls.capacity} spots</p>}
                </div>
                <Link to={isLoggedIn ? "/dashboard" : "/login"} className="mt-auto w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold text-center hover:bg-blue-700 transition">
                  {isLoggedIn ? 'Book via Dashboard' : 'Log in to Book'}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
