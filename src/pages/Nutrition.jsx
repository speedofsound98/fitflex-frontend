// src/pages/Nutrition.jsx — per-user daily food & macro tracker
import authFetch from '../utils/authFetch';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronDown, Plus, Minus, Trash2, Target, Pencil,
  AlertCircle, CheckCircle2, Sparkles, Calculator, Droplet,
} from 'lucide-react';
import Navbar from '../components/NavBar';
import { inputClass } from '../components/AuthShell';
import NutritionProfileForm from '../components/NutritionProfileForm';
import usePageTitle from '../hooks/usePageTitle';

const api = import.meta.env.VITE_API_URL;

// ── Date helpers (local, not UTC) ─────────────────────────────────────────────
function localISO(d) {
  const t = new Date(d);
  t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
  return t.toISOString().slice(0, 10);
}
function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return localISO(d);
}
function prettyDate(iso) {
  const today = localISO(new Date());
  if (iso === today) return 'Today';
  if (iso === addDays(today, -1)) return 'Yesterday';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Preset foods for "estimate" mode (per typical serving) ────────────────────
const PRESETS = [
  { name: 'Chicken breast', unit: '100g', p: 31, c: 0, f: 3.6, kcal: 165 },
  { name: 'Egg', unit: '1 large', p: 6, c: 0.6, f: 5, kcal: 72 },
  { name: 'Greek yogurt', unit: '170g', p: 17, c: 6, f: 0, kcal: 100 },
  { name: 'Whey protein', unit: '1 scoop', p: 24, c: 3, f: 1.5, kcal: 120 },
  { name: 'Salmon', unit: '100g', p: 20, c: 0, f: 13, kcal: 208 },
  { name: 'Cooked rice', unit: '1 cup', p: 4, c: 45, f: 0.4, kcal: 205 },
  { name: 'Oats', unit: '40g dry', p: 5, c: 27, f: 3, kcal: 150 },
  { name: 'Banana', unit: '1 medium', p: 1.3, c: 27, f: 0.3, kcal: 105 },
  { name: 'Almonds', unit: '28g', p: 6, c: 6, f: 14, kcal: 164 },
  { name: 'Tofu', unit: '100g', p: 8, c: 2, f: 4.8, kcal: 76 },
  { name: 'Lentils', unit: '1 cup', p: 18, c: 40, f: 0.8, kcal: 230 },
  { name: 'Lean beef mince', unit: '100g', p: 21, c: 0, f: 5, kcal: 137 },
  { name: 'Peanut butter', unit: '2 tbsp', p: 7, c: 7, f: 16, kcal: 190 },
  { name: 'Protein bar', unit: '1 bar', p: 20, c: 22, f: 7, kcal: 220 },
  { name: 'Milk', unit: '1 cup', p: 8, c: 12, f: 8, kcal: 149 },
  { name: 'Cottage cheese', unit: '100g', p: 11, c: 3.4, f: 4.3, kcal: 98 },
  { name: 'Canned tuna', unit: '100g', p: 26, c: 0, f: 1, kcal: 116 },
  { name: 'Sweet potato', unit: '130g', p: 2, c: 26, f: 0.1, kcal: 112 },
  { name: 'Broccoli', unit: '100g', p: 2.8, c: 7, f: 0.4, kcal: 34 },
  { name: 'Bread', unit: '1 slice', p: 4, c: 14, f: 1, kcal: 80 },
  { name: 'Carrots', unit: '100g', p: 0.9, c: 10, f: 0.2, kcal: 41 },
  { name: 'Cucumber & tomato salad', unit: '1 bowl', p: 1.5, c: 7, f: 0.4, kcal: 40 },
  // Composite plate: ~250g pasta + 250g tomato sauce + 125ml 15% cream + 25g parmesan + pesto/spinach
  { name: 'Creamy tomato pasta plate', unit: 'full plate', p: 32, c: 97, f: 39, kcal: 860 },
  { name: 'Croissant', unit: '1 pastry', p: 5, c: 26, f: 12, kcal: 272 },
  { name: 'Sushi roll', unit: '1 roll (6–8 pc)', p: 7, c: 35, f: 5, kcal: 230 },
  { name: 'Chocolate', unit: '25g', p: 2, c: 15, f: 7.5, kcal: 135 },
  { name: "Ben & Jerry's ice cream", unit: '¼ can', p: 4, c: 32, f: 15, kcal: 280 },
  { name: 'Tuna in oil', unit: '1 can (~100g)', p: 26, c: 0, f: 8, kcal: 190 },
  { name: 'Cappuccino', unit: '100ml milk', p: 3, c: 5, f: 4, kcal: 65 },
  { name: 'Date', unit: '1 pitted', p: 0.4, c: 18, f: 0, kcal: 66 },
  { name: 'Tahini', unit: '1 tbsp', p: 2.6, c: 3.2, f: 8, kcal: 89 },
  { name: 'Eggplant', unit: '100g cooked', p: 0.8, c: 9, f: 0.2, kcal: 35 },
];

const round1 = n => Math.round(n * 10) / 10;
const MACROS = [
  { key: 'protein', label: 'Protein', dot: 'bg-brand-500', unit: 'g' },
  { key: 'carbs', label: 'Carbs', dot: 'bg-sky-500', unit: 'g' },
  { key: 'fat', label: 'Fat', dot: 'bg-amber-500', unit: 'g' },
  { key: 'calories', label: 'Calories', dot: 'bg-ink-700', unit: 'kcal' },
];

// ── Progress bar for a single macro/calorie goal ──────────────────────────────
function GoalBar({ label, dot, value, goal, unit }) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  const over = goal > 0 && value > goal;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink-700">
          <span className={`w-2.5 h-2.5 rounded-full ${dot}`} /> {label}
        </span>
        <span className="text-sm text-ink-500">
          <span className={`font-semibold ${over ? 'text-amber-600' : 'text-ink-800'}`}>{round1(value)}</span>
          {goal > 0 && <span className="text-ink-400"> / {goal} {unit}</span>}
        </span>
      </div>
      <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
        <div className={`h-full rounded-full ${over ? 'bg-amber-500' : dot}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Nutrition() {
  usePageTitle('Nutrition');
  const [date, setDate] = useState(() => localISO(new Date()));
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ protein: 0, carbs: 0, fat: 0, calories: 0 });
  const [goal, setGoal] = useState({ protein: 0, carbs: 0, fat: 0, calories: 0, water: 2000 });
  const [water, setWater] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  const [mode, setMode] = useState('estimate'); // 'estimate' | 'exact'
  const [exact, setExact] = useState({ name: '', protein: '', carbs: '', fat: '', calories: '' });
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState(null); // preset object
  const [servings, setServings] = useState(1);

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState(goal);
  const [showProfile, setShowProfile] = useState(false);

  const isToday = date === localISO(new Date());

  function flash(m, type = 'success') {
    setMsg(m); setMsgType(type);
    setTimeout(() => setMsg(''), 3500);
  }

  const load = useCallback(() => {
    setLoading(true);
    authFetch(`${api}/nutrition?date=${date}`)
      .then(r => r.json())
      .then(d => {
        setEntries(d.entries || []);
        setTotals(d.totals || { protein: 0, carbs: 0, fat: 0, calories: 0 });
        setWater(d.water || 0);
        if (d.goal) { setGoal(d.goal); setGoalForm(d.goal); }
      })
      .catch(() => flash('Could not load your log', 'error'))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => { load(); }, [load]);

  async function addEntry(payload) {
    try {
      const res = await authFetch(`${api}/nutrition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, date }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add');
      setEntries(prev => [...prev, data.entry]);
      setTotals(prev => ({
        protein: prev.protein + data.entry.protein,
        carbs: prev.carbs + data.entry.carbs,
        fat: prev.fat + data.entry.fat,
        calories: prev.calories + data.entry.calories,
      }));
      flash('Added to your log');
    } catch (e) { flash(e.message, 'error'); }
  }

  function submitExact(e) {
    e.preventDefault();
    if (!exact.name.trim()) return flash('Give the food a name', 'error');
    addEntry({
      name: exact.name.trim(),
      protein: Number(exact.protein) || 0,
      carbs: Number(exact.carbs) || 0,
      fat: Number(exact.fat) || 0,
      calories: Number(exact.calories) || 0,
      mode: 'exact',
    });
    setExact({ name: '', protein: '', carbs: '', fat: '', calories: '' });
  }

  function autoCalories() {
    const kcal = round1(4 * (Number(exact.protein) || 0) + 4 * (Number(exact.carbs) || 0) + 9 * (Number(exact.fat) || 0));
    setExact(f => ({ ...f, calories: String(kcal) }));
  }

  function submitEstimate() {
    if (!picked) return;
    const q = Number(servings) || 1;
    addEntry({
      name: `${picked.name} × ${q} (${picked.unit})`,
      protein: round1(picked.p * q),
      carbs: round1(picked.c * q),
      fat: round1(picked.f * q),
      calories: round1(picked.kcal * q),
      mode: 'estimate',
    });
    setPicked(null); setServings(1); setSearch('');
  }

  async function deleteEntry(id) {
    const entry = entries.find(e => e.id === id);
    try {
      const res = await authFetch(`${api}/nutrition/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setEntries(prev => prev.filter(e => e.id !== id));
      if (entry) setTotals(prev => ({
        protein: round1(prev.protein - entry.protein),
        carbs: round1(prev.carbs - entry.carbs),
        fat: round1(prev.fat - entry.fat),
        calories: round1(prev.calories - entry.calories),
      }));
    } catch (e) { flash(e.message, 'error'); }
  }

  async function adjustWater(delta) {
    // Optimistic; clamp to >= 0 locally to keep the UI snappy.
    const prev = water;
    setWater(w => Math.max(0, w + delta));
    try {
      const res = await authFetch(`${api}/nutrition/water`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta, date }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setWater(data.water);
    } catch (e) { setWater(prev); flash(e.message, 'error'); }
  }

  async function saveGoal(e) {
    e.preventDefault();
    try {
      const res = await authFetch(`${api}/nutrition/goal`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protein: Number(goalForm.protein) || 0,
          carbs: Number(goalForm.carbs) || 0,
          fat: Number(goalForm.fat) || 0,
          calories: Number(goalForm.calories) || 0,
          water: Number(goalForm.water) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setGoal(data.goal); setEditingGoal(false);
      flash('Daily goals updated');
    } catch (e) { flash(e.message, 'error'); }
  }

  const filteredPresets = PRESETS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const q = Number(servings) || 1;

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-3xl mx-auto">

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500 mb-2">Nutrition</p>
          <h1 className="font-display font-bold text-4xl text-ink-900 leading-tight">Food &amp; macros</h1>
          <p className="text-ink-500 mt-2">Log meals by quick estimate or exact amounts, and track your daily targets.</p>
        </div>

        {msg && (
          <div className={`mb-5 flex items-center gap-2 p-3 rounded-2xl text-sm font-medium ${msgType === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {msgType === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {msg}
          </div>
        )}

        {/* Date navigation */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setDate(d => addDays(d, -1))}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-white shadow-card text-sm font-medium text-ink-600 hover:text-ink-900 transition">
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <div className="text-center">
            <p className="font-display font-bold text-ink-900">{prettyDate(date)}</p>
            {!isToday && (
              <button onClick={() => setDate(localISO(new Date()))} className="text-xs text-brand-600 font-semibold hover:underline">
                Jump to today
              </button>
            )}
          </div>
          <button onClick={() => setDate(d => addDays(d, 1))} disabled={isToday}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-white shadow-card text-sm font-medium text-ink-600 hover:text-ink-900 transition disabled:opacity-40">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Daily totals + goals */}
        <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg text-ink-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-500" /> Daily totals
            </h2>
            <button onClick={() => { setEditingGoal(o => !o); setGoalForm(goal); }}
              className="inline-flex items-center gap-1.5 text-sm text-ink-500 font-semibold hover:text-brand-600 transition">
              <Pencil className="w-3.5 h-3.5" /> {editingGoal ? 'Cancel' : 'Edit goals'}
            </button>
          </div>

          {editingGoal ? (
            <form onSubmit={saveGoal} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MACROS.map(m => (
                <label key={m.key} className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-ink-600">{m.label} goal ({m.unit})</span>
                  <input type="number" min="0" className={inputClass}
                    value={goalForm[m.key]} onChange={e => setGoalForm(f => ({ ...f, [m.key]: e.target.value }))} />
                </label>
              ))}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-600">Water goal (ml)</span>
                <input type="number" min="0" step="250" className={inputClass}
                  value={goalForm.water ?? 2000} onChange={e => setGoalForm(f => ({ ...f, water: e.target.value }))} />
              </label>
              <div className="col-span-2 sm:col-span-4">
                <button type="submit" className="bg-brand-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill">
                  Save goals
                </button>
              </div>
            </form>
          ) : (
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {MACROS.map(m => (
                <GoalBar key={m.key} label={m.label} dot={m.dot} unit={m.unit}
                  value={totals[m.key] || 0} goal={Number(goal[m.key]) || 0} />
              ))}
            </div>
          )}
        </div>

        {/* Auto-calculate targets from a private profile */}
        <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
          <button onClick={() => setShowProfile(o => !o)}
            className="w-full flex items-center justify-between text-left">
            <span className="font-display font-bold text-lg text-ink-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" /> Auto-calculate my targets
            </span>
            {showProfile ? <ChevronDown className="w-5 h-5 text-ink-400" /> : <ChevronRight className="w-5 h-5 text-ink-400" />}
          </button>
          {!showProfile && (
            <p className="text-sm text-ink-500 mt-1">Set your body &amp; weekly training and we'll compute protein/carbs/fat/calories for you.</p>
          )}
          {showProfile && (
            <div className="mt-5">
              <NutritionProfileForm onSaved={(g) => { if (g) { setGoal(g); setGoalForm(g); } setShowProfile(false); }} />
            </div>
          )}
        </div>

        {/* Water */}
        {(() => {
          const goalMl = Number(goal.water) || 2000;
          const pct = goalMl > 0 ? Math.min(100, Math.round((water / goalMl) * 100)) : 0;
          return (
            <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-lg text-ink-900 flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-sky-500" /> Water
                </h2>
                <span className="text-sm text-ink-500">
                  <span className="font-semibold text-ink-800">{water}</span>
                  <span className="text-ink-400"> / {goalMl} ml</span>
                  <span className="text-ink-400"> · {Math.round(water / 250)} cups</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-ink-100 overflow-hidden mb-4">
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => adjustWater(-250)} disabled={water <= 0}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-paper text-ink-700 text-sm font-semibold hover:bg-ink-100 transition disabled:opacity-40">
                  <Minus className="w-4 h-4" /> 250 ml
                </button>
                <button onClick={() => adjustWater(250)}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition shadow-pill">
                  <Plus className="w-4 h-4" /> 250 ml
                </button>
                <button onClick={() => adjustWater(500)}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-paper text-ink-700 text-sm font-semibold hover:bg-ink-100 transition">
                  <Plus className="w-4 h-4" /> 500 ml
                </button>
              </div>
            </div>
          );
        })()}

        {/* Add entry */}
        <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
          <div className="flex gap-1 bg-paper rounded-full p-1 mb-5 w-fit">
            <button onClick={() => setMode('estimate')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${mode === 'estimate' ? 'bg-white text-ink-900 shadow-card' : 'text-ink-500 hover:text-ink-700'}`}>
              <Sparkles className="w-4 h-4" /> Estimate
            </button>
            <button onClick={() => setMode('exact')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${mode === 'exact' ? 'bg-white text-ink-900 shadow-card' : 'text-ink-500 hover:text-ink-700'}`}>
              <Pencil className="w-4 h-4" /> Exact
            </button>
          </div>

          {mode === 'estimate' ? (
            <div>
              <input
                className={`${inputClass} mb-3`}
                placeholder="Search common foods…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 mb-4 max-h-40 overflow-y-auto">
                {filteredPresets.map(p => (
                  <button key={p.name} onClick={() => setPicked(p)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition border
                      ${picked?.name === p.name ? 'bg-brand-500 text-white border-brand-500' : 'bg-paper text-ink-700 border-transparent hover:border-brand-200'}`}>
                    {p.name} <span className="opacity-60 text-xs">{p.unit}</span>
                  </button>
                ))}
                {filteredPresets.length === 0 && (
                  <p className="text-sm text-ink-400">No match — switch to <button onClick={() => setMode('exact')} className="text-brand-600 font-semibold underline">Exact</button> to enter it manually.</p>
                )}
              </div>

              {picked && (
                <div className="bg-paper rounded-2xl p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-ink-800">{picked.name}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setServings(s => Math.max(0.5, round1((Number(s) || 1) - 0.5)))}
                          className="w-7 h-7 grid place-items-center rounded-full bg-white shadow-card text-ink-600 hover:text-ink-900">–</button>
                        <input type="number" step="0.5" min="0.5" value={servings}
                          onChange={e => setServings(e.target.value)}
                          className="w-14 text-center bg-white rounded-full py-1 text-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-brand-200" />
                        <button type="button" onClick={() => setServings(s => round1((Number(s) || 1) + 0.5))}
                          className="w-7 h-7 grid place-items-center rounded-full bg-white shadow-card text-ink-600 hover:text-ink-900">+</button>
                      </div>
                      <span className="text-xs text-ink-400">servings</span>
                    </div>
                    <button onClick={submitEstimate}
                      className="inline-flex items-center gap-1.5 bg-brand-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill">
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-ink-500">
                    <span><b className="text-brand-600">{round1(picked.p * q)}g</b> protein</span>
                    <span><b className="text-sky-600">{round1(picked.c * q)}g</b> carbs</span>
                    <span><b className="text-amber-600">{round1(picked.f * q)}g</b> fat</span>
                    <span><b className="text-ink-800">{round1(picked.kcal * q)}</b> kcal</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={submitExact} className="space-y-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-600">Food name</span>
                <input className={inputClass} placeholder="e.g. Chicken & rice bowl"
                  value={exact.name} onChange={e => setExact(f => ({ ...f, name: e.target.value }))} required />
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['protein', 'carbs', 'fat', 'calories'].map(k => (
                  <label key={k} className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-ink-600 capitalize">{k} {k === 'calories' ? '(kcal)' : '(g)'}</span>
                    <input type="number" min="0" step="0.1" className={inputClass} placeholder="0"
                      value={exact[k]} onChange={e => setExact(f => ({ ...f, [k]: e.target.value }))} />
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" className="inline-flex items-center gap-1.5 bg-brand-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill">
                  <Plus className="w-4 h-4" /> Add entry
                </button>
                <button type="button" onClick={autoCalories}
                  className="inline-flex items-center gap-1.5 text-sm text-ink-500 font-semibold hover:text-brand-600 transition"
                  title="Estimate calories from macros (4/4/9)">
                  <Calculator className="w-4 h-4" /> Calc calories
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Entry list */}
        <h2 className="font-display font-bold text-lg text-ink-900 mb-3">
          {prettyDate(date)}'s log {entries.length > 0 && <span className="text-ink-400 font-normal text-base">· {entries.length} item{entries.length !== 1 ? 's' : ''}</span>}
        </h2>
        {loading ? (
          <p className="text-ink-400 text-sm">Loading…</p>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-card px-6 py-10 text-center">
            <span className="inline-grid place-items-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 mx-auto mb-2">
              <Target className="w-5 h-5" />
            </span>
            <p className="font-medium text-ink-700">Nothing logged {isToday ? 'today' : 'this day'}.</p>
            <p className="text-sm text-ink-400 mt-1">Add your first food above.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-card divide-y divide-ink-50 overflow-hidden">
            {entries.map(e => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-ink-800 truncate">{e.name}</p>
                    <span className={`text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded-full ${e.mode === 'estimate' ? 'bg-sky-100 text-sky-700' : 'bg-ink-100 text-ink-500'}`}>
                      {e.mode === 'estimate' ? 'Est.' : 'Exact'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-400 mt-0.5">
                    <b className="text-brand-600">{round1(e.protein)}g</b> P · {round1(e.carbs)}g C · {round1(e.fat)}g F · <b className="text-ink-700">{round1(e.calories)}</b> kcal
                  </p>
                </div>
                <button onClick={() => deleteEntry(e.id)} className="text-ink-300 hover:text-rose-500 transition shrink-0" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
