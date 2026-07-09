// src/components/StudioCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, CheckCircle2, CalendarDays, ArrowRight } from 'lucide-react';

export default function StudioCard({ studio }) {
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
      {studio.tagline && <p className="text-sm text-brand-600 font-medium italic line-clamp-1">“{studio.tagline}”</p>}
      {studio.about && <p className="text-sm text-ink-500 line-clamp-2">{studio.about}</p>}
      <span className="inline-flex items-center gap-1.5 text-sm text-brand-600 font-semibold mt-auto">
        View studio <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </Link>
  );
}
