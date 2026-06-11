// src/components/AppointmentMatrix.jsx
// Weekly appointment slot matrix — used in both StudioDashboard (manage) and StudioProfile (book)
import authFetch from '../utils/authFetch';
import React, { useEffect, useState, useCallback } from 'react';

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
      flash('Appointment booked! 🎉');
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
        <div className={`p-3 rounded-xl text-sm font-medium ${msgType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {msg}
        </div>
      )}

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekStart(d => addDays(d, -7))}
          className="px-3 py-2 rounded-xl bg-white shadow text-sm font-medium hover:bg-gray-50 transition">
          ← Prev week
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {formatDate(weekStart)} – {formatDate(weekEnd)}
        </span>
        <button onClick={() => setWeekStart(d => addDays(d, 7))}
          className="px-3 py-2 rounded-xl bg-white shadow text-sm font-medium hover:bg-gray-50 transition">
          Next week →
        </button>
      </div>

      {/* Slot settings (manage mode) */}
      {mode === 'manage' && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-blue-700 mb-3">New slot settings — click a cell to add</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-600">Duration (min)</span>
              <select className="border border-gray-200 rounded-lg p-1.5 text-sm bg-white"
                value={newSlot.duration_minutes} onChange={e => setNewSlot(f => ({...f, duration_minutes: Number(e.target.value)}))}>
                {[30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-600">Capacity</span>
              <input type="number" min="1" max="20" className="border border-gray-200 rounded-lg p-1.5 text-sm"
                value={newSlot.capacity} onChange={e => setNewSlot(f => ({...f, capacity: Number(e.target.value)}))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-600">Credits</span>
              <input type="number" min="0" className="border border-gray-200 rounded-lg p-1.5 text-sm"
                value={newSlot.credit_cost} onChange={e => setNewSlot(f => ({...f, credit_cost: Number(e.target.value)}))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-600">Note (optional)</span>
              <input className="border border-gray-200 rounded-lg p-1.5 text-sm"
                placeholder="e.g. 1-on-1 session"
                value={newSlot.notes} onChange={e => setNewSlot(f => ({...f, notes: e.target.value}))} />
            </label>
          </div>
        </div>
      )}

      {/* Matrix */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-3 text-left text-xs text-gray-400 font-medium w-14">Time</th>
              {DAYS.map((day, i) => (
                <th key={day} className="px-2 py-3 text-center text-xs font-semibold text-gray-600">
                  <div>{day}</div>
                  <div className="text-gray-400 font-normal">{formatDate(addDays(weekStart, i))}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeRows.map(hour => (
              <tr key={hour} className="border-b border-gray-50">
                <td className="px-3 py-2 text-xs text-gray-400 font-medium whitespace-nowrap">
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

                            let bg = 'bg-blue-600 hover:bg-blue-700 cursor-pointer text-white';
                            if (isFull && !bookedByUser) bg = 'bg-gray-200 cursor-not-allowed text-gray-400';
                            if (bookedByUser) bg = 'bg-green-600 text-white cursor-pointer';

                            return (
                              <div key={slot.id}
                                className={`rounded-lg px-2 py-1.5 text-xs transition select-none ${bg}`}
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
                          <div className="h-10 rounded-lg border-2 border-dashed border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer" />
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
          <div className="px-6 py-4 text-center text-gray-400 text-xs">
            Click any cell to add a slot for that time.
          </div>
        )}
      </div>

      {mode === 'view' && (
        <div className="flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-600 inline-block" /> Your booking</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Full</span>
        </div>
      )}
    </div>
  );
}
