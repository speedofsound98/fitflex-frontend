import authFetch from '../utils/authFetch';
// src/pages/Pricing.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Ticket, CalendarDays, CreditCard, Check } from 'lucide-react';
import Navbar from '../components/NavBar';

const api = import.meta.env.VITE_API_URL;

export default function Pricing() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [searchParams] = useSearchParams();

  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const isUser = userRole === 'user' && userId;

  useEffect(() => {
    authFetch(`${api}/credit-packs`)
      .then(r => r.json())
      .then(d => setPacks(d.packs || []));

    const payment = searchParams.get('payment');
    if (payment === 'success') {
      setMsgType('success');
      setMsg('Payment successful! Your credits have been added to your account. 🎉');
    } else if (payment === 'cancelled') {
      setMsgType('error');
      setMsg('Payment was cancelled. No charge was made.');
    }
  }, []);

  async function buyPack(packId) {
    if (!isUser) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await authFetch(`${api}/payments/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: packId, user_id: Number(userId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');
      window.location.href = data.url; // redirect to Stripe Checkout
    } catch (e) {
      setMsgType('error');
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  const INFO = [
    { Icon: Ticket, title: 'Use to book classes', desc: 'Each class costs a set number of credits. Credits are deducted when you book and refunded if you cancel.' },
    { Icon: CalendarDays, title: '1-year validity', desc: 'Credits expire 1 year from the date of purchase. New purchases get their own 1-year window.' },
    { Icon: CreditCard, title: 'Secure checkout', desc: 'Payments are processed securely via Stripe. We never store your card details.' },
  ];

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="pt-28 pb-16 px-4 max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12 max-w-xl mx-auto">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">Pricing</p>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-ink-900 tracking-tight mb-4">Buy Credits</h1>
          <p className="text-ink-500 text-lg">Use credits to book fitness classes. Credits are valid for 1 year from purchase.</p>
        </div>

        {msg && (
          <div className={`mb-8 p-4 rounded-2xl text-sm font-medium ${msgType === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {msg}
          </div>
        )}

        {/* Packs grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14 items-stretch">
          {packs.map(pack => {
            const popular = pack.popular;
            return (
              <div
                key={pack.id}
                className={`relative rounded-3xl p-8 flex flex-col items-center text-center transition duration-300 hover:-translate-y-1
                  ${popular
                    ? 'text-white shadow-card-lg'
                    : 'bg-white text-ink-900 shadow-card'}`}
                style={popular ? { background: 'linear-gradient(150deg,#e8702a,#d55f1f)' } : undefined}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className={`font-display font-black text-5xl mb-1 ${popular ? 'text-white' : 'text-brand-500'}`}>{pack.credits}</div>
                <div className={`mb-5 ${popular ? 'text-white/80' : 'text-ink-400'}`}>credits</div>
                <div className={`font-display font-bold text-3xl mb-1 ${popular ? 'text-white' : 'text-ink-900'}`}>{formatPrice(pack.price_cents)}</div>
                <div className={`text-sm mb-5 ${popular ? 'text-white/70' : 'text-ink-400'}`}>
                  {formatPrice(Math.round(pack.price_cents / pack.credits * 10) / 10)} per credit
                </div>
                <div className={`flex items-center gap-1.5 text-xs mb-6 ${popular ? 'text-white/80' : 'text-ink-400'}`}>
                  <Check className="w-3.5 h-3.5" /> Valid for 1 year
                </div>

                {isUser ? (
                  <button
                    onClick={() => buyPack(pack.id)}
                    disabled={loading}
                    className={`mt-auto w-full py-3 rounded-full font-semibold transition disabled:opacity-50
                      ${popular
                        ? 'bg-white text-brand-600 hover:bg-brand-50'
                        : 'bg-brand-500 text-white hover:bg-brand-600 shadow-pill'}`}
                  >
                    {loading ? 'Redirecting…' : 'Buy Now'}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className={`mt-auto w-full py-3 rounded-full font-semibold transition text-center block
                      ${popular
                        ? 'bg-white text-brand-600 hover:bg-brand-50'
                        : 'bg-brand-500 text-white hover:bg-brand-600 shadow-pill'}`}
                  >
                    Log in to buy
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ / info */}
        <div className="bg-white rounded-3xl shadow-card p-8 sm:p-10">
          <h2 className="font-display font-bold text-2xl text-ink-900 mb-7">How credits work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-ink-500">
            {INFO.map(({ Icon, title, desc }) => (
              <div key={title}>
                <span className="inline-grid place-items-center w-11 h-11 rounded-2xl bg-brand-100 text-brand-600 mb-3">
                  <Icon className="w-5 h-5" strokeWidth={1.9} />
                </span>
                <p className="font-semibold text-ink-800 mb-1">{title}</p>
                <p className="leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
