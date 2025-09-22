// src/pages/StudioDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';

export default function StudioDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('userRole');
  const studioId = localStorage.getItem('userId'); // we’ll save this on login (see Login.jsx tweak)
  const api = import.meta.env.VITE_API_URL;

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    name: '',
    date: '',     // yyyy-mm-dd
    time: '',     // HH:MM
    sport_type: '',
    credit_cost: 1,
    capacity: ''
  });

  // Gate: only studios allowed
  useEffect(() => {
    if (role !== 'studio' || !studioId) {
      navigate('/login');
    }
  }, [role, studioId, navigate]);

  const datetimeISO = useMemo(() => {
    if (!form.date || !form.time) return '';
    // Build local ISO string
    return new Date(`${form.date}T${form.time}:00`).toISOString();
  }, [form.date, form.time]);

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
    if (!form.name || !form.date || !form.time) {
      setErr('Please fill name, date and time');
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        datetime: datetimeISO,                 // backend expects a single datetime
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
      setForm({ name: '', date: '', time: '', sport_type: '', credit_cost: 1, capacity: '' });
      // refresh list
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
        <p className="text-gray-700 mb-6">Manage your classes for studio #{studioId}</p>

        {err && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{err}</div>}

        <div className="bg-white rounded-xl shadow p-4 mb-8">
          <h2 className="text-xl font-semibold mb-3">Create a new class</h2>
          <form onSubmit={createClass} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border p-2 rounded" placeholder="Class name"
              value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />

            <input type="date" className="border p-2 rounded"
              value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />

            <input type="time" className="border p-2 rounded"
              value={form.time} onChange={e=>setForm({...form, time:e.target.value})} />

            <input className="border p-2 rounded" placeholder="Sport type (e.g., Yoga)"
              value={form.sport_type} onChange={e=>setForm({...form, sport_type:e.target.value})} />

            <input className="border p-2 rounded" placeholder="Credit cost" type="number" min="1"
              value={form.credit_cost} onChange={e=>setForm({...form, credit_cost:e.target.value})} />

            <input className="border p-2 rounded" placeholder="Capacity (optional)" type="number" min="1"
              value={form.capacity} onChange={e=>setForm({...form, capacity:e.target.value})} />

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
                      {new Date(cls.datetime).toLocaleString()} · {cls.sport_type || '—'} ·
                      {' '}credits: {cls.credit_cost}{' '}
                      {cls.capacity ? `· cap: ${cls.capacity}` : ''}
                    </div>
                  </div>
                  <button onClick={()=>deleteClass(cls.id)} className="text-red-600 hover:underline">
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
