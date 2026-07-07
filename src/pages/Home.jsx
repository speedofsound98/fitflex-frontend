// src/pages/Home.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, CalendarCheck, CreditCard, ArrowRight, Star } from 'lucide-react';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';

const FEATURES = [
  {
    Icon: Dumbbell,
    title: 'Top Studios',
    desc: 'Discover the best fitness studios near you — yoga, pilates, HIIT, and more.',
  },
  {
    Icon: CalendarCheck,
    title: 'Easy Booking',
    desc: 'Browse class schedules and book a spot in seconds with your credits.',
  },
  {
    Icon: CreditCard,
    title: 'Credit System',
    desc: 'One balance, every studio. Use your credits across any class on the platform.',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create an account', desc: 'Sign up as a user in under a minute.' },
  { step: '02', title: 'Browse classes', desc: 'Explore classes by studio, sport type, and time.' },
  { step: '03', title: 'Book & show up', desc: 'Reserve your spot with credits and enjoy the class.' },
];

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#e8702a,#f1a878)',
  'linear-gradient(135deg,#1e2c3a,#5b6b7b)',
  'linear-gradient(135deg,#d55f1f,#8e3c13)',
  'linear-gradient(135deg,#8494a4,#ccd4dc)',
];

export default function Home() {
  usePageTitle(null); // use default full title
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL;
    if (!base) return;
    fetch(`${base}/ping`)
      .then(r => r.json())
      .then(d => console.log('✅ backend ping:', d))
      .catch(e => console.error('❌ backend ping failed:', e));
  }, []);

  const userName = localStorage.getItem('userName');
  const userRole = localStorage.getItem('userRole');
  const dashboardPath = userRole === 'studio' ? '/studio' : '/dashboard';

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-32 sm:pt-40 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[3fr_2fr] gap-10 lg:gap-16 items-end">
            {/* Editorial headline */}
            <h1 className="font-display font-black uppercase leading-[0.88] tracking-tight">
              <span className="block text-ink-900 text-[clamp(3.2rem,10vw,8.5rem)]">Stronger</span>
              <span className="block text-brand-500 text-[clamp(2.4rem,7.5vw,6.2rem)] lg:text-right">
                Every&nbsp;Day
              </span>
            </h1>

            {/* Right panel — social proof + copy + CTAs */}
            <aside className="pb-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex -space-x-2.5">
                  {AVATAR_GRADIENTS.map((g, i) => (
                    <span
                      key={i}
                      className="w-9 h-9 rounded-full ring-2 ring-cream"
                      style={{ background: g }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-ink-900 font-display font-bold text-lg">
                  <Star className="w-4 h-4 text-brand-500 fill-brand-500" />
                  Loved by our members
                </div>
              </div>
              <p className="text-ink-500 leading-relaxed mb-6">
                Whether you're starting out or deepening your practice, FitFlex connects you
                with hundreds of classes at top studios — yoga, pilates, HIIT and more —
                all on a single credit balance.
              </p>
              {userName ? (
                <div className="flex flex-wrap gap-3">
                  <Link
                    to={dashboardPath}
                    className="inline-flex items-center gap-2 bg-brand-500 text-white font-semibold px-7 py-3 rounded-full hover:bg-brand-600 shadow-pill transition"
                  >
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/studios"
                    className="inline-flex items-center gap-2 border border-ink-300 text-ink-800 font-semibold px-7 py-3 rounded-full hover:border-ink-900 transition"
                  >
                    Browse Studios
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 bg-brand-500 text-white font-semibold px-7 py-3 rounded-full hover:bg-brand-600 shadow-pill transition"
                  >
                    Get Started — It's Free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/studios"
                    className="inline-flex items-center gap-2 border border-ink-300 text-ink-800 font-semibold px-7 py-3 rounded-full hover:border-ink-900 transition"
                  >
                    Browse Studios
                  </Link>
                </div>
              )}
            </aside>
          </div>

          {/* Full-width photo band */}
          <div className="mt-12 sm:mt-16 rounded-t-[2.5rem] overflow-hidden h-[300px] sm:h-[420px]">
            <img
              src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1800&q=70"
              alt="Athlete training with a barbell in a gym"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">Why FitFlex</p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink-900 mb-12 max-w-xl">
            Everything you need for your next workout
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="bg-cream rounded-3xl p-8 hover:-translate-y-1 hover:shadow-card transition duration-300"
              >
                <span className="inline-grid place-items-center w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 mb-5">
                  <Icon className="w-6 h-6" strokeWidth={1.9} />
                </span>
                <h3 className="text-xl font-display font-bold text-ink-900 mb-2">{title}</h3>
                <p className="text-ink-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">Getting started</p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink-900 mb-12 max-w-xl">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map(item => (
              <div key={item.step}>
                <div className="font-display font-black text-5xl text-brand-500/90 mb-4">{item.step}</div>
                <h3 className="text-lg font-display font-bold text-ink-900 mb-1.5">{item.title}</h3>
                <p className="text-ink-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Studio CTA ── */}
      <section className="px-4 sm:px-6 pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto bg-ink-900 rounded-[2.5rem] px-6 sm:px-16 py-14 sm:py-20 text-center sm:text-left sm:flex items-center justify-between gap-10">
          <div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-3">
              Own a fitness studio?
            </h2>
            <p className="text-ink-300 max-w-lg leading-relaxed">
              List your classes on FitFlex and reach thousands of fitness enthusiasts
              looking for their next workout.
            </p>
          </div>
          <Link
            to="/signup?role=studio"
            className="inline-flex items-center gap-2 mt-8 sm:mt-0 shrink-0 bg-brand-500 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-brand-600 transition"
          >
            Join as a Studio <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-ink-100">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="flex items-center gap-2 font-display font-bold text-ink-900">
            <span className="w-7 h-7 rounded-full bg-brand-500 text-white grid place-items-center">
              <Dumbbell className="w-3.5 h-3.5" strokeWidth={2.2} />
            </span>
            FitFlex
          </span>
          <div className="flex items-center gap-6 text-sm text-ink-500">
            <Link to="/pricing" className="hover:text-ink-900 transition">Pricing</Link>
            <Link to="/blog" className="hover:text-ink-900 transition">Blog</Link>
            <Link to="/groups" className="hover:text-ink-900 transition">Communities</Link>
            <Link to="/studios" className="hover:text-ink-900 transition">Studios</Link>
          </div>
          <span className="text-sm text-ink-400">
            © {new Date().getFullYear()} FitFlex. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
