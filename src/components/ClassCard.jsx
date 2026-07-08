// src/components/ClassCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, Tag, Users } from 'lucide-react';
import { sportIcon, chipStyle } from '../utils/sport';

export default function ClassCard({ cls, onBook, bookedIds }) {
  const alreadyBooked = bookedIds.has(cls.id);
  const isPast = new Date(cls.datetime) < new Date();

  return (
    <div className="bg-white rounded-3xl shadow-card hover:-translate-y-1 hover:shadow-card-lg transition duration-300 p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`inline-grid place-items-center w-11 h-11 rounded-2xl text-xl ${chipStyle(cls.sport_type)}`}>
            {sportIcon(cls.sport_type)}
          </span>
          <h3 className="font-display font-bold text-ink-900 text-lg mt-3 leading-tight">{cls.name}</h3>
          <Link to={`/studios/${cls.studio_id}`} className="text-sm text-brand-600 font-medium hover:underline">
            {cls.studio_name}
          </Link>
        </div>
        <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
          {cls.credit_cost} cr
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
        {cls.studio_location && (
          <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-ink-300" />{cls.studio_location}</p>
        )}
        {cls.sport_type && (
          <p className="flex items-center gap-2"><Tag className="w-4 h-4 text-ink-300" />{cls.sport_type}</p>
        )}
        {cls.capacity && (
          <p className="flex items-center gap-2"><Users className="w-4 h-4 text-ink-300" />{cls.capacity} spots</p>
        )}
      </div>

      <button
        onClick={() => onBook(cls.id)}
        disabled={alreadyBooked || isPast}
        className={`mt-auto w-full py-2.5 rounded-full text-sm font-semibold transition
          ${alreadyBooked ? 'bg-emerald-100 text-emerald-700 cursor-default'
          : isPast ? 'bg-ink-50 text-ink-300 cursor-default'
          : 'bg-brand-500 text-white hover:bg-brand-600 shadow-pill'}`}
      >
        {alreadyBooked ? '✓ Booked' : isPast ? 'Past' : 'Book Class'}
      </button>
    </div>
  );
}
