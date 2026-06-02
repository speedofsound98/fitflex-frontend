import authFetch from '../utils/authFetch';
// src/pages/Pricing.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Buy Credits</h1>
          <p className="text-gray-500 text-lg">Use credits to book fitness classes. Credits are valid for 1 year from purchase.</p>
        </div>

        {msg && (
          <div className={`mb-8 p-4 rounded-xl text-sm font-medium ${msgType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {msg}
          </div>
        )}

        {/* Packs grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {packs.map(pack => (
            <div
              key={pack.id}
              className={`bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center relative ${pack.popular ? 'ring-2 ring-blue-600' : ''}`}
            >
              {pack.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <div className="text-5xl font-bold text-blue-600 mb-1">{pack.credits}</div>
              <div className="text-gray-500 mb-4">credits</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{formatPrice(pack.price_cents)}</div>
              <div className="text-sm text-gray-400 mb-6">{formatPrice(Math.round(pack.price_cents / pack.credits * 10) / 10)} per credit</div>
              <div className="text-xs text-gray-400 mb-6">Valid for 1 year</div>

              {isUser ? (
                <button
                  onClick={() => buyPack(pack.id)}
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-semibold transition ${pack.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} disabled:opacity-50`}
                >
                  {loading ? 'Redirecting…' : 'Buy Now'}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="w-full py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition text-center block"
                >
                  Log in to buy
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* FAQ / info */}
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-5">How credits work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <p className="text-2xl mb-2">🎟️</p>
              <p className="font-semibold text-gray-800 mb-1">Use to book classes</p>
              <p>Each class costs a set number of credits. Credits are deducted when you book and refunded if you cancel.</p>
            </div>
            <div>
              <p className="text-2xl mb-2">📅</p>
              <p className="font-semibold text-gray-800 mb-1">1-year validity</p>
              <p>Credits expire 1 year from the date of purchase. New purchases get their own 1-year window.</p>
            </div>
            <div>
              <p className="text-2xl mb-2">💳</p>
              <p className="font-semibold text-gray-800 mb-1">Secure checkout</p>
              <p>Payments are processed securely via Stripe. We never store your card details.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
