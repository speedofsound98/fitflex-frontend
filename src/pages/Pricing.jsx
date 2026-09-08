import authFetch from '../utils/authFetch';
// src/pages/Pricing.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Ticket, CalendarDays, CreditCard, Check } from 'lucide-react';
import Navbar from '../components/NavBar';

const api = import.meta.env.VITE_API_URL;

export default function Pricing() {
  const { t } = useTranslation();
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
      setMsg(t('pricing.paySuccess'));
    } else if (payment === 'cancelled') {
      setMsgType('error');
      setMsg(t('pricing.payCancelled'));
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
      if (!res.ok) throw new Error(data.error || t('pricing.paymentFailed'));
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
    { Icon: Ticket, title: t('pricing.info1Title'), desc: t('pricing.info1Desc') },
    { Icon: CalendarDays, title: t('pricing.info2Title'), desc: t('pricing.info2Desc') },
    { Icon: CreditCard, title: t('pricing.info3Title'), desc: t('pricing.info3Desc') },
  ];

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="pt-28 pb-16 px-4 max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12 max-w-xl mx-auto">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">{t('pricing.eyebrow')}</p>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-ink-900 tracking-tight mb-4">{t('pricing.title')}</h1>
          <p className="text-ink-500 text-lg">{t('pricing.subtitle')}</p>
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
                    : 'bg-surface text-ink-900 shadow-card'}`}
                style={popular ? { background: 'linear-gradient(150deg,#e8702a,#d55f1f)' } : undefined}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ink-900 dark:bg-ink-100 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {t('pricing.mostPopular')}
                  </span>
                )}
                <div className={`font-display font-black text-5xl mb-1 ${popular ? 'text-white' : 'text-brand-500'}`}>{pack.credits}</div>
                <div className={`mb-5 ${popular ? 'text-white/80' : 'text-ink-400'}`}>{t('pricing.credits')}</div>
                <div className={`font-display font-bold text-3xl mb-1 ${popular ? 'text-white' : 'text-ink-900'}`}>{formatPrice(pack.price_cents)}</div>
                <div className={`text-sm mb-5 ${popular ? 'text-white/70' : 'text-ink-400'}`}>
                  {t('pricing.perCredit', { price: formatPrice(Math.round(pack.price_cents / pack.credits * 10) / 10) })}
                </div>
                <div className={`flex items-center gap-1.5 text-xs mb-6 ${popular ? 'text-white/80' : 'text-ink-400'}`}>
                  <Check className="w-3.5 h-3.5" /> {t('pricing.validYear')}
                </div>

                {isUser ? (
                  <button
                    onClick={() => buyPack(pack.id)}
                    disabled={loading}
                    className={`mt-auto w-full py-3 rounded-full font-semibold transition disabled:opacity-50
                      ${popular
                        ? 'bg-surface text-brand-600 hover:bg-brand-50'
                        : 'bg-brand-500 text-white hover:bg-brand-600 shadow-pill'}`}
                  >
                    {loading ? t('pricing.redirecting') : t('pricing.buyNow')}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className={`mt-auto w-full py-3 rounded-full font-semibold transition text-center block
                      ${popular
                        ? 'bg-surface text-brand-600 hover:bg-brand-50'
                        : 'bg-brand-500 text-white hover:bg-brand-600 shadow-pill'}`}
                  >
                    {t('pricing.loginToBuy')}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ / info */}
        <div className="bg-surface rounded-3xl shadow-card p-8 sm:p-10">
          <h2 className="font-display font-bold text-2xl text-ink-900 mb-7">{t('pricing.howCreditsWork')}</h2>
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
