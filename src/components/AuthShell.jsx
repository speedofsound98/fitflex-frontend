// src/components/AuthShell.jsx
// Shared editorial layout for auth pages (Login, Signup, Forgot/Reset password).
import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import Navbar from './NavBar';

export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-28 pb-16 px-4 flex justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <Link to="/" className="inline-grid place-items-center w-12 h-12 rounded-2xl bg-brand-500 text-white shadow-pill mb-4">
              <Dumbbell className="w-6 h-6" strokeWidth={2.2} />
            </Link>
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500 mb-2">{eyebrow}</p>
            )}
            <h1 className="font-display font-bold text-3xl text-ink-900 leading-tight">{title}</h1>
            {subtitle && <p className="text-ink-500 mt-2">{subtitle}</p>}
          </div>

          <div className="bg-white rounded-3xl shadow-card p-8">
            {children}
          </div>

          {footer && <div className="text-center text-sm text-ink-500 mt-6">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

// Shared input styling used across the auth forms.
export const inputClass =
  'w-full bg-paper border border-transparent rounded-2xl px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition';
