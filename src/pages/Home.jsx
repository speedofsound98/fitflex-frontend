// src/pages/Home.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';

const FEATURES = [
  {
    icon: '🏋️',
    title: 'Top Studios',
    desc: 'Discover the best fitness studios near you — yoga, pilates, HIIT, and more.',
  },
  {
    icon: '📅',
    title: 'Easy Booking',
    desc: 'Browse class schedules and book a spot in seconds with your credits.',
  },
  {
    icon: '💳',
    title: 'Credit System',
    desc: 'One balance, every studio. Use your credits across any class on the platform.',
  },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Create an account', desc: 'Sign up as a user in under a minute.' },
  { step: '2', title: 'Browse classes', desc: 'Explore classes by studio, sport type, and time.' },
  { step: '3', title: 'Book & show up', desc: 'Reserve your spot with credits and enjoy the class.' },
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
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-400 text-white pt-32 pb-24 px-6 text-center">
        <h1 className="text-5xl font-extrabold mb-4 leading-tight">
          Find Your Next<br />Fitness Class
        </h1>
        <p className="text-xl text-blue-100 mb-8 max-w-xl mx-auto">
          One platform. Hundreds of classes. Yoga, pilates, HIIT — book any studio with a single credit balance.
        </p>
        {userName ? (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={dashboardPath}
              className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-full hover:bg-blue-50 transition"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/studios"
              className="border border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-blue-500 transition"
            >
              Browse Studios
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-full hover:bg-blue-50 transition"
            >
              Get Started — It's Free
            </Link>
            <Link
              to="/studios"
              className="border border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-blue-500 transition"
            >
              Browse Studios
            </Link>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gray-50">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why FitFlex?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl shadow p-8 text-center">
              <div className="text-5xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">How It Works</h2>
        <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto">
          {HOW_IT_WORKS.map(item => (
            <div key={item.step} className="flex-1 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Studio CTA */}
      <section className="py-16 px-6 bg-blue-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-3">Own a fitness studio?</h2>
        <p className="text-blue-100 mb-6 max-w-lg mx-auto">
          List your classes on FitFlex and reach thousands of fitness enthusiasts looking for their next workout.
        </p>
        <Link
          to="/signup?role=studio"
          className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-full hover:bg-blue-50 transition"
        >
          Join as a Studio
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-gray-400 text-sm bg-gray-50">
        © {new Date().getFullYear()} FitFlex. All rights reserved.
      </footer>
    </div>
  );
}
