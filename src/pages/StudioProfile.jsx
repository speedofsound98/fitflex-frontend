// src/pages/StudioProfile.jsx  — public view
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/NavBar';

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
  const api = import.meta.env.VITE_API_URL;

  const [studio, setStudio] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">

        {/* Studio header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl p-8 text-white mb-8">
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
          {studio.about && <p className="mt-4 text-blue-50 max-w-xl">{studio.about}</p>}
        </div>

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
                <Link to="/dashboard" className="mt-auto w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold text-center hover:bg-blue-700 transition">
                  Book via Dashboard
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
