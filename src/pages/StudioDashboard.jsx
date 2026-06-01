// src/pages/StudioDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';

export default function StudioDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('userRole');
  const studioId = localStorage.getItem('userId');
  const studioName = localStorage.getItem('userName');
  const api = import.meta.env.VITE_API_URL;

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [err, setErr] = useState('');

  // Default datetime = now rounded up to the next hour
  const defaultDatetime = (() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
  })();

  const [form, setForm] = useState({
    name: '',
    datetime: defaultDatetime,
    sport_type: '',
    credit_cost: 1,
    capacity: ''
  });

  useEffect(() => {
    if (role !== 'studio' || !studioId) {
      navigate('/login');
    }
  }, [role, studioId, navigate]);

  async function fetchClasses() {
    if (!studioId) return;
    try {
      setLoading(true);
      const res = await fetch(`${api}/studios/${studioId}/classes`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load classes');
      setClasses(data.classes || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchClasses(); /* eslint-disable-next-line */ }, [studioId]);

  async function createClass(e) {
    e.preventDefault();
    setErr('');
    const missing = [];
    if (!form.name.trim()) missing.push('class name');
    if (!form.datetime) missing.push('date & time (fill both date AND time)');
    if (missing.length) {
      setErr(`Missing: ${missing.join(', ')}`);
      return;
    }
    const parsedDate = new Date(form.datetime);
    if (isNaN(parsedDate.getTime())) {
      setErr('Invalid date/time — please pick a date and time from the picker');
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        datetime: parsedDate.toISOString(),
        sport_type: form.sport_type || null,
        credit_cost: Number(form.credit_cost) || 1,
        capacity: form.capacity ? Number(form.capacity) : null,
      };
      const res = await fetch(`${api}/studios/${studioId}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create class');
      const next = new Date();
      next.setHours(next.getHours() + 1, 0, 0, 0);
      setForm({ name: '', datetime: next.toISOString().slice(0, 16), sport_type: '', credit_cost: 1, capacity: '' });
      fetchClasses();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function deleteClass(id) {
    if (!confirm('Delete this class?')) return;
    try {
      const res = await fetch(`${api}/classes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete class');
      setClasses(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="pt-24 px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Studio Dashboard</h1>
        <p className="text-gray-700 mb-6">Manage your classes for <strong>{studioName}</strong></p>

        {err && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{err}</div>}

        <div className="bg-white rounded-xl shadow p-4 mb-8">
          <h2 className="text-xl font-semibold mb-3">Create a new class</h2>
          <form onSubmit={createClass} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Class name *</span>
              <input className="border p-2 rounded" placeholder="e.g. Morning Yoga"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Date &amp; Time *</span>
              <input type="datetime-local" className="border p-2 rounded"
                value={form.datetime} onChange={e => setForm({...form, datetime: e.target.value})} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Sport type</span>
              <input className="border p-2 rounded" placeholder="e.g. Yoga, Pilates, HIIT"
                value={form.sport_type} onChange={e => setForm({...form, sport_type: e.target.value})} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Credit cost</span>
              <input className="border p-2 rounded" type="number" min="1" placeholder="1"
                value={form.credit_cost} onChange={e => setForm({...form, credit_cost: e.target.value})} />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Capacity (optional)</span>
              <input className="border p-2 rounded" type="number" min="1" placeholder="e.g. 20"
                value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} />
            </label>

            <button type="submit" className="bg-green-600 text-white p-2 rounded md:col-span-2">
              Create Class
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-xl font-semibold mb-3">Your classes</h2>
          {loading ? (
            <p>Loading…</p>
          ) : classes.length === 0 ? (
            <p className="text-gray-600">No classes yet. Create your first one above.</p>
          ) : (
            <ul className="divide-y">
              {classes.map(cls => (
                <li key={cls.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{cls.name}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(cls.datetime).toLocaleString()} · {cls.sport_type || '—'} · credits: {cls.credit_cost}
                      {cls.capacity ? ` · cap: ${cls.capacity}` : ''}
                    </div>
                  </div>
                  <button onClick={() => deleteClass(cls.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
