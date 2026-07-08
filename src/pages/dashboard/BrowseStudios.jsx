// src/pages/dashboard/BrowseStudios.jsx
import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search } from 'lucide-react';
import StudioCard from '../../components/StudioCard';

export default function BrowseStudios() {
  const { studios } = useOutletContext();
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const locations = useMemo(() => {
    const locs = [...studios.map(s => s.city), ...studios.map(s => s.neighbourhood)].filter(Boolean);
    return [...new Set(locs)].sort();
  }, [studios]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return studios.filter(s => {
      const matchSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        (s.about || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.neighbourhood || '').toLowerCase().includes(q);
      const matchLocation = !locationFilter || s.city === locationFilter || s.neighbourhood === locationFilter;
      return matchSearch && matchLocation;
    });
  }, [studios, search, locationFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-300" strokeWidth={2} />
          <input
            className="w-full bg-white rounded-full pl-11 pr-4 py-3 text-sm shadow-card border border-transparent focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition"
            placeholder="Search studios..."
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
          {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      </div>

      <h2 className="font-display font-bold text-xl text-ink-900 mb-4">
        {filtered.length} studio{filtered.length !== 1 ? 's' : ''}
        {search && ` for "${search}"`}
        {locationFilter && ` in ${locationFilter}`}
      </h2>

      {filtered.length === 0 ? (
        <p className="text-ink-500">No studios match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(s => <StudioCard key={s.id} studio={s} />)}
        </div>
      )}
    </div>
  );
}
