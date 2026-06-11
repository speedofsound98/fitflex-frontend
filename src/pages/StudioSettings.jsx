// src/pages/StudioSettings.jsx
import authFetch from '../utils/authFetch';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';

export default function StudioSettings() {
  const navigate = useNavigate();
  const studioId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const api = import.meta.env.VITE_API_URL;

  const [studio, setStudio] = useState(null);
  const [profileForm, setProfileForm] = useState({
    about: '', phone: '', website: '', instagram: '', city: '', neighbourhood: '', accepts_enquiries: false,
    opening_hour: 9, closing_hour: 18,
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [activeTab, setActiveTab] = useState('profile');
  const [success, setSuccess] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (userRole !== 'studio' || !studioId) navigate('/login');
  }, [userRole, studioId, navigate]);

  useEffect(() => {
    if (!studioId) return;
    authFetch(`${api}/studios/${studioId}`)
      .then(r => r.json())
      .then(d => {
        if (d.studio) {
          setStudio(d.studio);
          setProfileForm({
            about: d.studio.about || '',
            phone: d.studio.phone || '',
            website: d.studio.website || '',
            instagram: d.studio.instagram || '',
            city: d.studio.city || '',
            neighbourhood: d.studio.neighbourhood || '',
            accepts_enquiries: d.studio.accepts_enquiries || false,
            opening_hour: d.studio.opening_hour ?? 9,
            closing_hour: d.studio.closing_hour ?? 18,
          });
        }
      })
      .catch(() => {});
  }, [api, studioId]);

  function flash(msg, type = 'success') {
    if (type === 'success') { setSuccess(msg); setErr(''); }
    else { setErr(msg); setSuccess(''); }
    setTimeout(() => { setSuccess(''); setErr(''); }, 4000);
  }

  async function saveProfile(e) {
    e.preventDefault();
    try {
      const res = await authFetch(`${api}/studios/${studioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setStudio(data.studio);
      flash('Profile saved!');
    } catch (e) { flash(e.message, 'error'); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { flash('New passwords do not match', 'error'); return; }
    if (pwForm.newPassword.length < 8) { flash('New password must be at least 8 characters', 'error'); return; }
    try {
      const res = await authFetch(`${api}/studios/${studioId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      flash('Password updated!');
    } catch (e) { flash(e.message, 'error'); }
  }

  const tabClass = (t) =>
    `px-5 py-2.5 text-sm font-semibold rounded-full transition ${activeTab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`;

  const PROFILE_FIELDS = [
    { key: 'about', label: 'About', type: 'textarea', placeholder: 'Tell people what makes your studio special...' },
    { key: 'city', label: 'City', type: 'text', placeholder: 'e.g. Tel Aviv' },
    { key: 'neighbourhood', label: 'Neighbourhood', type: 'text', placeholder: 'e.g. Florentin' },
    { key: 'phone', label: 'Phone', type: 'text', placeholder: '+1 234 567 8900' },
    { key: 'website', label: 'Website', type: 'text', placeholder: 'https://yourstudio.com' },
    { key: 'instagram', label: 'Instagram', type: 'text', placeholder: '@yourstudio' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-2xl mx-auto">

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Studio Settings</h1>
          <p className="text-gray-500 mt-1">
            {studio?.name}
            {studio?.verified && <span className="ml-2 text-blue-600 text-sm font-medium">✅ Verified</span>}
          </p>
        </div>

        {err && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">{err}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-xl text-sm">{success}</div>}

        <div className="flex gap-2 mb-8 bg-white rounded-full shadow-sm p-1 w-fit">
          <button className={tabClass('profile')} onClick={() => setActiveTab('profile')}>🏢 Public Profile</button>
          <button className={tabClass('account')} onClick={() => setActiveTab('account')}>⚙️ Account</button>
          <button className={tabClass('password')} onClick={() => setActiveTab('password')}>🔒 Password</button>
        </div>

        {/* ── Public Profile tab ── */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-gray-800">Public Profile</h2>
              <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">🌐 Visible to everyone</span>
            </div>
            <p className="text-sm text-gray-400 mb-5">This information appears on your public studio page.</p>
            <form onSubmit={saveProfile} className="space-y-4">
              {PROFILE_FIELDS.map(field => (
                <label key={field.key} className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">{field.label}</span>
                  {field.type === 'textarea' ? (
                    <textarea rows={3}
                      className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder={field.placeholder}
                      value={profileForm[field.key]}
                      onChange={e => setProfileForm(f => ({...f, [field.key]: e.target.value}))} />
                  ) : (
                    <input type="text"
                      className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder={field.placeholder}
                      value={profileForm[field.key]}
                      onChange={e => setProfileForm(f => ({...f, [field.key]: e.target.value}))} />
                  )}
                </label>
              ))}
              {/* Enquiry toggle */}
              <label className="flex items-center justify-between p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">Accept custom time enquiries</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {profileForm.accepts_enquiries
                      ? '💬 Users can send you enquiry messages from your studio page'
                      : '🔒 Enquiry button is hidden on your public page'}
                  </p>
                </div>
                <div
                  onClick={() => setProfileForm(f => ({...f, accepts_enquiries: !f.accepts_enquiries}))}
                  className={`w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex items-center px-0.5 flex-shrink-0 ml-4
                    ${profileForm.accepts_enquiries ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                    ${profileForm.accepts_enquiries ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </label>

              {/* Business hours */}
              <div className="p-4 border border-gray-100 rounded-xl">
                <p className="text-sm font-medium text-gray-800 mb-1">Business Hours</p>
                <p className="text-xs text-gray-400 mb-3">Sets the time range shown on your appointment calendar</p>
                <div className="flex items-center gap-3">
                  <label className="flex flex-col gap-1 flex-1">
                    <span className="text-xs text-gray-500">Opens at</span>
                    <select className="border border-gray-200 rounded-xl p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={profileForm.opening_hour}
                      onChange={e => setProfileForm(f => ({...f, opening_hour: Number(e.target.value)}))}>
                      {Array.from({length: 24}, (_, i) => (
                        <option key={i} value={i}>{i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i-12}:00 PM`}</option>
                      ))}
                    </select>
                  </label>
                  <span className="text-gray-400 mt-4">–</span>
                  <label className="flex flex-col gap-1 flex-1">
                    <span className="text-xs text-gray-500">Closes at</span>
                    <select className="border border-gray-200 rounded-xl p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={profileForm.closing_hour}
                      onChange={e => setProfileForm(f => ({...f, closing_hour: Number(e.target.value)}))}>
                      {Array.from({length: 24}, (_, i) => (
                        <option key={i} value={i}>{i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i-12}:00 PM`}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition">
                Save Profile
              </button>
            </form>
          </div>
        )}

        {/* ── Account tab ── */}
        {activeTab === 'account' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-gray-800">Account Info</h2>
              <span className="text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full">🔒 Private</span>
            </div>
            <p className="text-sm text-gray-400 mb-5">This information is only visible to you.</p>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 mb-0.5">Studio name</p>
                <p className="font-medium text-gray-800">{studio?.name}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Email</p>
                <p className="font-medium text-gray-800">{studio?.email || '—'}</p>
                <p className="text-xs text-gray-400 mt-0.5">Email cannot be changed.</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Verification status</p>
                <p className="font-medium text-gray-800">{studio?.verified ? '✅ Verified' : '⏳ Not yet verified — contact admin'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Password tab ── */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Change Password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Current password</span>
                <input type="password" className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={pwForm.currentPassword} onChange={e => setPwForm(f => ({...f, currentPassword: e.target.value}))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">New password</span>
                <input type="password" className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={pwForm.newPassword} onChange={e => setPwForm(f => ({...f, newPassword: e.target.value}))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Confirm new password</span>
                <input type="password" className="border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={pwForm.confirm} onChange={e => setPwForm(f => ({...f, confirm: e.target.value}))} />
              </label>
              <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition">
                Update Password
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
