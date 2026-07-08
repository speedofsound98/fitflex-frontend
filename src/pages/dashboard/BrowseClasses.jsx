// src/pages/dashboard/BrowseClasses.jsx
import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search } from 'lucide-react';
import ClassCard from '../../components/ClassCard';

export default function BrowseClasses() {
  const { classes, studios, bookedIds, book } = useOutletContext();
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const locations = useMemo(() => {
    const locs = [
      ...classes.map(c => c.studio_location),
      ...studios.map(s => s.city),
      ...studios.map(s => s.neighbourhood),
    ].filter(Boolean);
    return [...new Set(locs)].sort();
  }, [classes, studios]);

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

  return (
    <div>
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
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
          {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      </div>

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
    </div>
  );
}
