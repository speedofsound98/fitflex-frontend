// src/components/AppointmentMatrix.jsx
// Weekly appointment slot matrix — used in both StudioDashboard (manage) and StudioProfile (book)
import authFetch from '../utils/authFetch';
import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const api = import.meta.env.VITE_API_URL;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function toISODate(date) {
  return date.toISOString().split('T')[0];
}

function getTimeRows(openingHour, closingHour) {
  return Array.from({ length: closingHour - openingHour }, (_, i) => i + openingHour);
}

export default function AppointmentMatrix({ studioId, mode = 'view', userId, openingHour = 9, closingHour = 18 }) {
  // mode: 'manage' (studio creates/deletes) or 'view' (user books)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [slots, setSlots] = useState([]);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  // For manage mode: new slot form
  const [newSlot, setNewSlot] = useState({ duration_minutes: 60, capacity: 1, credit_cost: 1, notes: '' });

  function flash(m, type = 'success') {
    setMsg(m); setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  }

  const weekEnd = addDays(weekStart, 6);
  weekEnd.setHours(23, 59, 59);

  const fetchSlots = useCallback(() => {
    const from = weekStart.toISOString();
    const to = weekEnd.toISOString();
    const userParam = userId ? `&userId=${userId}` : '';
    fetch(`${api}/studios/${studioId}/slots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${userParam}`)
      .then(r => r.json())
      .then(d => setSlots(d.slots || []));
  }, [studioId, weekStart, userId]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  // Group slots by day-of-week index (0=Mon) and hour
  const slotMap = {};
  slots.forEach(s => {
    const d = new Date(s.datetime);
    const dayIdx = (d.getDay() + 6) % 7; // convert Sun=0 → Mon=0
    const hour = d.getHours();
    if (!slotMap[dayIdx]) slotMap[dayIdx] = {};
    if (!slotMap[dayIdx][hour]) slotMap[dayIdx][hour] = [];
    slotMap[dayIdx][hour].push(s);
  });

  const timeRows = getTimeRows(openingHour, closingHour);

  async function createSlot(dayIdx, hour) {
    const day = addDays(weekStart, dayIdx);
    day.setHours(hour, 0, 0, 0);
    try {
      const res = await authFetch(`${api}/studios/${studioId}/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSlot, datetime: day.toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash('Slot added!');
      fetchSlots();
    } catch (e) { flash(e.message, 'error'); }
  }

  async function deleteSlot(slotId) {
    if (!confirm('Delete this slot?')) return;
    await authFetch(`${api}/slots/${slotId}`, { method: 'DELETE' });
    flash('Slot deleted.');
    fetchSlots();
  }

  async function bookSlot(slotId) {
    try {
      const res = await authFetch(`${api}/slots/${slotId}/book`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash('Appointment booked!');
      fetchSlots();
    } catch (e) { flash(e.message, 'error'); }
  }

  async function cancelSlot(slotId) {
    if (!confirm('Cancel this appointment? Credits will be refunded.')) return;
    await authFetch(`${api}/slots/${slotId}/book`, { method: 'DELETE' });
    flash('Appointment cancelled. Credits refunded.');
    fetchSlots();
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-2xl text-sm font-medium ${msgType === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {msgType === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {msg}
        </div>
      )}

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekStart(d => addDays(d, -7))}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-surface shadow-card text-sm font-medium text-ink-600 hover:text-ink-900 transition">
          <ChevronLeft className="w-4 h-4" /> Prev week
        </button>
        <span className="text-sm font-semibold text-ink-700">
          {formatDate(weekStart)} – {formatDate(weekEnd)}
        </span>
        <button onClick={() => setWeekStart(d => addDays(d, 7))}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-surface shadow-card text-sm font-medium text-ink-600 hover:text-ink-900 transition">
          Next week <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Slot settings (manage mode) */}
      {mode === 'manage' && (
        <div className="bg-brand-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-brand-700 mb-3">New slot settings — click a cell to add</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-600">Duration (min)</span>
              <select className="bg-surface rounded-xl p-2 text-sm border border-transparent focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition"
                value={newSlot.duration_minutes} onChange={e => setNewSlot(f => ({...f, duration_minutes: Number(e.target.value)}))}>
                {[30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-600">Capacity</span>
              <input type="number" min="1" max="20" className="bg-surface rounded-xl p-2 text-sm border border-transparent focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition"
                value={newSlot.capacity} onChange={e => setNewSlot(f => ({...f, capacity: Number(e.target.value)}))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-600">Credits</span>
              <input type="number" min="0" className="bg-surface rounded-xl p-2 text-sm border border-transparent focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition"
                value={newSlot.credit_cost} onChange={e => setNewSlot(f => ({...f, credit_cost: Number(e.target.value)}))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-600">Note (optional)</span>
              <input className="bg-surface rounded-xl p-2 text-sm border border-transparent focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition"
                placeholder="e.g. 1-on-1 session"
                value={newSlot.notes} onChange={e => setNewSlot(f => ({...f, notes: e.target.value}))} />
            </label>
          </div>
        </div>
      )}

      {/* Matrix */}
      <div className="bg-surface rounded-2xl shadow-card overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-ink-100">
              <th className="px-3 py-3 text-left text-xs text-ink-400 font-medium w-14">Time</th>
              {DAYS.map((day, i) => (
                <th key={day} className="px-2 py-3 text-center text-xs font-semibold text-ink-600">
                  <div>{day}</div>
                  <div className="text-ink-400 font-normal">{formatDate(addDays(weekStart, i))}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeRows.map(hour => (
              <tr key={hour} className="border-b border-ink-50">
                <td className="px-3 py-2 text-xs text-ink-400 font-medium whitespace-nowrap">
                  {hour % 12 || 12}:00 {hour < 12 ? 'AM' : 'PM'}
                </td>
                {DAYS.map((_, dayIdx) => {
                  const daySlots = slotMap[dayIdx]?.[hour] || [];
                  const isPastDay = addDays(weekStart, dayIdx) < new Date(new Date().setHours(0,0,0,0));

                  return (
                    <td key={dayIdx} className="px-1 py-1 align-top"
                      onClick={() => mode === 'manage' && !isPastDay && createSlot(dayIdx, hour)}
                    >
                      {daySlots.length > 0 ? (
                        <div className="space-y-1">
                          {daySlots.map(slot => {
                            const isFull = slot.is_full;
                            const bookedByUser = slot.booked_by_user;

                            let bg = 'bg-brand-500 hover:bg-brand-600 cursor-pointer text-white';
                            if (isFull && !bookedByUser) bg = 'bg-ink-100 cursor-not-allowed text-ink-400';
                            if (bookedByUser) bg = 'bg-emerald-600 text-white cursor-pointer';

                            return (
                              <div key={slot.id}
                                className={`rounded-xl px-2 py-1.5 text-xs transition select-none ${bg}`}
                                onClick={e => {
                                  e.stopPropagation();
                                  if (mode === 'manage') { deleteSlot(slot.id); }
                                  else if (mode === 'view' && bookedByUser) { cancelSlot(slot.id); }
                                  else if (mode === 'view' && !isFull) { bookSlot(slot.id); }
                                }}
                              >
                                <div className="font-semibold">
                                  {slot.booked_count}/{slot.capacity}
                                  {slot.credit_cost > 0 ? ` · ${slot.credit_cost}cr` : ' · Free'}
                                </div>
                                {slot.notes && <div className="truncate opacity-80">{slot.notes}</div>}
                                {slot.duration_minutes !== 60 && <div className="opacity-70">{slot.duration_minutes}min</div>}
                                {mode === 'manage' && <div className="opacity-60 text-xs mt-0.5">✕ delete</div>}
                                {mode === 'view' && bookedByUser && <div className="text-xs mt-0.5">✓ booked · cancel</div>}
                                {mode === 'view' && isFull && !bookedByUser && <div className="text-xs mt-0.5">Full</div>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        mode === 'manage' && !isPastDay ? (
                          <div className="h-10 rounded-xl border-2 border-dashed border-ink-100 hover:border-brand-300 hover:bg-brand-50 transition cursor-pointer" />
                        ) : null
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {mode === 'manage' && slots.length === 0 && (
          <div className="px-6 py-4 text-center text-ink-400 text-xs">
            Click any cell to add a slot for that time.
          </div>
        )}
      </div>

      {mode === 'view' && (
        <div className="flex gap-4 text-xs text-ink-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-500 inline-block" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-600 inline-block" /> Your booking</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-ink-100 inline-block" /> Full</span>
        </div>
      )}
    </div>
  );
}
