// src/pages/Studios.jsx — public studio directory
import React, { useEffect, useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import Navbar from '../components/NavBar';
import StudioCard from '../components/StudioCard';
import usePageTitle from '../hooks/usePageTitle';

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
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto">

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500 mb-2">Directory</p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-ink-900 leading-[1.05]">
            Find your studio.
          </h1>
          <p className="text-ink-500 mt-3 text-lg max-w-xl">
            Discover fitness studios near you — browse classes, hours, and appointments. No account needed.
          </p>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-300" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search by name, type, location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white rounded-full pl-11 pr-4 py-3 text-sm shadow-card border border-transparent focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition"
            />
          </div>
          {locations.length > 0 && (
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="bg-white rounded-full px-5 py-3 text-sm shadow-card border border-transparent focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 text-ink-600 transition"
            >
              <option value="">All locations</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <p className="text-ink-400 text-center pt-12">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-ink-500 text-center pt-12">No studios found{search ? ` for "${search}"` : ''}.</p>
        ) : (
          <>
            <h2 className="font-display font-bold text-xl text-ink-900 mb-4">
              {filtered.length} studio{filtered.length !== 1 ? 's' : ''}
              {search && ` for "${search}"`}
              {locationFilter && ` in ${locationFilter}`}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(s => <StudioCard key={s.id} studio={s} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
