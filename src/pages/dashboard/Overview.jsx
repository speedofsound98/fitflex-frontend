// src/pages/dashboard/Overview.jsx
import React, { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  CalendarDays, Dumbbell, Building2, Ticket, Sparkles, ArrowRight, Clock, MapPin,
} from 'lucide-react';
import ClassCard from '../../components/ClassCard';
import { sportIcon, chipStyle } from '../../utils/sport';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Overview() {
  const { classes, studios, bookings, bookedIds, book } = useOutletContext();

  const now = new Date();

  const upcoming = useMemo(
    () => bookings
      .filter(b => new Date(b.datetime) >= now)
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime)),
    [bookings]
  );
  const nextClass = upcoming[0];

  const recommended = useMemo(
    () => classes
      .filter(c => new Date(c.datetime) >= now && !bookedIds.has(c.id))
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
      .slice(0, 3),
    [classes, bookedIds]
  );

  // Derived: bookings per month over the trailing 6 months (from real booking history)
  const activity = useMemo(() => {
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()], count: 0 });
    }
    const index = new Map(buckets.map((b, i) => [b.key, i]));
    bookings.forEach(b => {
      const d = new Date(b.datetime);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (index.has(k)) buckets[index.get(k)].count += 1;
    });
    return buckets;
  }, [bookings]);

  const maxCount = Math.max(1, ...activity.map(a => a.count));
  const totalBookings = bookings.length;

  const STATS = [
    { label: 'Upcoming bookings', value: upcoming.length, Icon: CalendarDays, gradient: true },
    { label: 'Classes available', value: classes.length, Icon: Dumbbell, chip: 'bg-brand-100 text-brand-600' },
    { label: 'Studios on FitFlex', value: studios.length, Icon: Building2, chip: 'bg-ink-100 text-ink-700' },
    { label: 'Total bookings', value: totalBookings, Icon: Ticket, chip: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, Icon, gradient, chip }) => (
          <div
            key={label}
            className={`rounded-3xl p-5 flex items-center gap-4 shadow-card ${gradient ? 'text-white' : 'bg-white'}`}
            style={gradient ? { background: 'linear-gradient(135deg,#e8702a,#f1a878)' } : undefined}
          >
            <span className={`w-12 h-12 rounded-2xl grid place-items-center shrink-0 ${gradient ? 'bg-white/20' : chip}`}>
              <Icon className="w-6 h-6" strokeWidth={1.9} />
            </span>
            <div>
              <p className={`text-sm/tight ${gradient ? 'opacity-90' : 'text-ink-400'}`}>{label}</p>
              <p className={`font-display font-black text-2xl ${gradient ? '' : 'text-ink-900'}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
        {/* Next class */}
        <section>
          <h2 className="font-display font-bold text-xl text-ink-900 mb-4">Your next class</h2>
          {nextClass ? (
            <div className="rounded-3xl p-6 text-white shadow-card h-[calc(100%-2.75rem)] flex flex-col justify-between min-h-[200px]"
              style={{ background: 'linear-gradient(150deg,#6b4bff,#9b7bff)' }}>
              <div className="flex items-center justify-between">
                <span className="w-14 h-14 rounded-2xl bg-white/20 grid place-items-center text-2xl">
                  {sportIcon(nextClass.sport_type)}
                </span>
                <span className="bg-white/20 text-xs font-semibold px-3 py-1 rounded-full">
                  {nextClass.sport_type || 'Class'}
                </span>
              </div>
              <div>
                <h3 className="font-display font-bold text-2xl leading-tight">{nextClass.class_name}</h3>
                <p className="opacity-90 text-sm mt-1">{nextClass.studio_name}</p>
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />
                    {new Date(nextClass.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />
                    {new Date(nextClass.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  {nextClass.studio_location && (
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{nextClass.studio_location}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl p-6 bg-white shadow-card min-h-[200px] flex flex-col items-center justify-center text-center">
              <span className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 grid place-items-center mb-3">
                <CalendarDays className="w-7 h-7" strokeWidth={1.8} />
              </span>
              <p className="font-semibold text-ink-800">No upcoming classes</p>
              <p className="text-sm text-ink-400 mt-1 mb-4">Book a class to see it here.</p>
              <Link to="/dashboard/classes" className="inline-flex items-center gap-1.5 bg-brand-500 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-brand-600 shadow-pill transition">
                Browse classes <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Booking activity chart (derived) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-ink-900">Booking activity</h2>
            <span className="text-sm text-ink-400">Last 6 months</span>
          </div>
          <div className="rounded-3xl p-6 bg-white shadow-card">
            {totalBookings === 0 ? (
              <div className="h-[180px] grid place-items-center text-center text-ink-400 text-sm">
                Your booking history will chart here once you start booking.
              </div>
            ) : (
              <div className="flex items-end justify-between gap-3 h-[180px]">
                {activity.map((m, i) => {
                  const h = Math.round((m.count / maxCount) * 140);
                  const isCurrent = i === activity.length - 1;
                  return (
                    <div key={m.key} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-semibold text-ink-500">{m.count || ''}</span>
                      <div
                        className={`w-full max-w-[46px] rounded-t-xl rounded-b-md transition-all duration-500 ${isCurrent ? 'bg-brand-500' : 'bg-brand-200'}`}
                        style={{ height: `${Math.max(h, 6)}px` }}
                      />
                      <span className={`text-xs ${isCurrent ? 'text-brand-600 font-bold' : 'text-ink-400'}`}>{m.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Recommended preview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl text-ink-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" /> Recommended for you
          </h2>
          <Link to="/dashboard/classes" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {recommended.length === 0 ? (
          <p className="text-ink-500">No upcoming classes to recommend right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommended.map(c => <ClassCard key={c.id} cls={c} onBook={book} bookedIds={bookedIds} />)}
          </div>
        )}
      </section>
    </div>
  );
}
