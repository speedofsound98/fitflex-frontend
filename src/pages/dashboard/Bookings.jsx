// src/pages/dashboard/Bookings.jsx
import React, { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';

export default function Bookings() {
  const { bookings, cancelBooking } = useOutletContext();

  const sorted = useMemo(
    () => [...bookings].sort((a, b) => new Date(b.datetime) - new Date(a.datetime)),
    [bookings]
  );

  return (
    <section>
      <h2 className="font-display font-bold text-xl text-ink-900 mb-1">My bookings</h2>
      <p className="text-sm text-ink-400 mb-4">Classes you've reserved</p>

      {sorted.length === 0 ? (
        <div className="rounded-3xl bg-white shadow-card p-10 text-center">
          <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 mb-3">
            <CalendarDays className="w-7 h-7" strokeWidth={1.8} />
          </span>
          <p className="font-semibold text-ink-800">No bookings yet</p>
          <p className="text-sm text-ink-400 mt-1 mb-4">Reserve a class and it'll show up here.</p>
          <Link to="/dashboard/classes" className="inline-flex items-center gap-1.5 bg-brand-500 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-brand-600 shadow-pill transition">
            Browse classes <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <ul className="divide-y divide-ink-50">
            {sorted.map(b => {
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
                      <button onClick={() => cancelBooking(b.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">
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
  );
}
