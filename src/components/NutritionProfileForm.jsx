// src/components/NutritionProfileForm.jsx
// Private per-user body + training profile that auto-computes daily macro targets.
// Self-contained: loads the current profile, previews targets live, saves both.
import authFetch from '../utils/authFetch';
import React, { useEffect, useState } from 'react';
import { Lock, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { inputClass } from './AuthShell';
import { computeTargets } from '../utils/nutritionCalc';

const api = import.meta.env.VITE_API_URL;

const BLANK = {
  sex: 'other', goalDir: 'maintain', age: '', weight: '', height: '',
  runsPerWeek: '', runMin: '', strengthPerWeek: '', strengthMin: '',
};

const NUM_FIELDS = [
  { key: 'age', label: 'Age', unit: 'years' },
  { key: 'weight', label: 'Weight', unit: 'kg' },
  { key: 'height', label: 'Height', unit: 'cm' },
  { key: 'runsPerWeek', label: 'Runs / week', unit: 'count' },
  { key: 'runMin', label: 'Minutes per run', unit: 'min' },
  { key: 'strengthPerWeek', label: 'Strength / week', unit: 'count' },
  { key: 'strengthMin', label: 'Minutes per session', unit: 'min' },
];

export default function NutritionProfileForm({ onSaved }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  useEffect(() => {
    authFetch(`${api}/nutrition`)
      .then(r => r.json())
      .then(d => { if (d.profile) setForm(f => ({ ...f, ...d.profile })); })
      .catch(() => {});
  }, []);

  const preview = computeTargets(form);

  function flash(m, type = 'success') {
    setMsg(m); setMsgType(type);
    setTimeout(() => setMsg(''), 3500);
  }

  const seg = (field, value, label) => (
    <button
      type="button"
      onClick={() => setForm(f => ({ ...f, [field]: value }))}
      className={`flex-1 py-2 rounded-full text-sm font-semibold transition capitalize
        ${form[field] === value ? 'bg-white text-ink-900 shadow-card' : 'text-ink-500 hover:text-ink-700'}`}
    >
      {label}
    </button>
  );

  async function save(e) {
    e.preventDefault();
    if (!preview) { flash('Fill in age, weight and height to compute targets', 'error'); return; }
    setSaving(true);
    try {
      const profile = {
        sex: form.sex, goalDir: form.goalDir,
        age: Number(form.age) || 0, weight: Number(form.weight) || 0, height: Number(form.height) || 0,
        runsPerWeek: Number(form.runsPerWeek) || 0, runMin: Number(form.runMin) || 0,
        strengthPerWeek: Number(form.strengthPerWeek) || 0, strengthMin: Number(form.strengthMin) || 0,
      };
      const res = await authFetch(`${api}/nutrition/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, goal: preview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      flash('Targets calculated and saved');
      onSaved?.(data.goal);
    } catch (err) { flash(err.message, 'error'); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <p className="flex items-center gap-1.5 text-xs text-ink-400">
        <Lock className="w-3.5 h-3.5" /> Private — only you can see this. Used to calculate your daily targets.
      </p>

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-2xl text-sm font-medium ${msgType === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {msgType === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {msg}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <span className="block text-xs font-medium text-ink-600 mb-1.5">Sex</span>
          <div className="flex gap-1 bg-paper rounded-full p-1">
            {seg('sex', 'male', 'Male')}
            {seg('sex', 'female', 'Female')}
            {seg('sex', 'other', 'N/A')}
          </div>
        </div>
        <div>
          <span className="block text-xs font-medium text-ink-600 mb-1.5">Goal</span>
          <div className="flex gap-1 bg-paper rounded-full p-1">
            {seg('goalDir', 'lose', 'Lose')}
            {seg('goalDir', 'maintain', 'Maintain')}
            {seg('goalDir', 'gain', 'Gain')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {NUM_FIELDS.map(({ key, label, unit }) => (
          <label key={key} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-600">{label} <span className="text-ink-400">({unit})</span></span>
            <input type="number" min="0" step="any" className={inputClass} placeholder="0"
              value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
          </label>
        ))}
      </div>

      {/* Live preview */}
      <div className="bg-paper rounded-2xl p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">
          <Sparkles className="w-4 h-4 text-brand-500" /> Calculated targets
        </p>
        {preview ? (
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span><b className="text-brand-600">{preview.protein}g</b> protein</span>
            <span><b className="text-sky-600">{preview.carbs}g</b> carbs</span>
            <span><b className="text-amber-600">{preview.fat}g</b> fat</span>
            <span><b className="text-ink-800">{preview.calories}</b> kcal</span>
          </div>
        ) : (
          <p className="text-sm text-ink-400">Enter age, weight and height to see your targets.</p>
        )}
      </div>

      <button type="submit" disabled={saving || !preview}
        className="w-full bg-brand-500 text-white py-3 rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill disabled:opacity-50">
        {saving ? 'Saving…' : 'Calculate & save my targets'}
      </button>
    </form>
  );
}
