// src/pages/Studios.jsx — public studio directory
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';

function StudioCard({ studio }) {
  return (
    <Link to={`/studios/${studio.id}`}
      className="bg-white rounded-2xl shadow hover:shadow-md transition p-5 flex flex-col gap-2">
      {studio.cover_photo && (
        <img src={studio.cover_photo} alt={studio.name}
          className="w-full h-32 object-cover rounded-xl mb-1"
          onError={e => { e.target.style.display = 'none'; }} />
      )}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{studio.name}</h3>
          {(studio.city || studio.neighbourhood) && (
            <p className="text-sm text-gray-500">📍 {[studio.neighbourhood, studio.city].filter(Boolean).join(', ')}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {studio.verified && <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">✅ Verified</span>}
          {studio.offers_appointments && <span className="text-xs bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full">📆 Appointments</span>}
        </div>
      </div>
      {studio.tagline && <p className="text-sm text-blue-600 italic">"{studio.tagline}"</p>}
      {studio.about && <p className="text-sm text-gray-500 line-clamp-2">{studio.about}</p>}
      <span className="text-sm text-blue-600 font-medium mt-auto">View studio →</span>
    </Link>
  );
}

export default function Studios() {
  usePageTitle('Browse Studios');
  const api = import.meta.env.VITE_API_URL;
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    fetch(`${api}/studios`)
      .then(r => r.json())
      .then(d => setStudios(d.studios || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]);

  const locations = useMemo(() => {
    const locs = new Set();
    studios.forEach(s => {
      if (s.city) locs.add(s.city);
      if (s.neighbourhood) locs.add(s.neighbourhood);
    });
    return [...locs].sort();
  }, [studios]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return studios.filter(s => {
      const matchesSearch = !q ||
        s.name?.toLowerCase().includes(q) ||
        s.about?.toLowerCase().includes(q) ||
        s.tagline?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.neighbourhood?.toLowerCase().includes(q);
      const matchesLocation = !locationFilter ||
        s.city === locationFilter || s.neighbourhood === locationFilter;
      return matchesSearch && matchesLocation;
    });
  }, [studios, search, locationFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Browse Studios</h1>
          <p className="text-gray-500 mt-1">Discover fitness studios near you — no account needed.</p>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            placeholder="Search by name, type, location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {locations.length > 0 && (
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">All locations</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <p className="text-gray-400 text-center pt-12">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-center pt-12">No studios found{search ? ` for "${search}"` : ''}.</p>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">{filtered.length} studio{filtered.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(s => <StudioCard key={s.id} studio={s} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
