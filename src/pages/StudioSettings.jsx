// src/pages/StudioSettings.jsx
import authFetch from '../utils/authFetch';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Settings, Lock, AlertCircle, CheckCircle2, Camera, Loader2, Clock } from 'lucide-react';
import Navbar from '../components/NavBar';
import Toggle from '../components/Toggle';
import { inputClass } from '../components/AuthShell';
import usePageTitle from '../hooks/usePageTitle';

function CoverPhotoUpload({ studioId, api, current, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(current);
  const inputRef = React.useRef();

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setError('');
    const form = new FormData();
    form.append('photo', file);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${api}/studios/${studioId}/cover-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setPreview(data.url);
      onUploaded(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="p-4 bg-paper rounded-2xl">
      <p className="text-sm font-medium text-ink-800 mb-1">Cover Photo</p>
      <p className="text-xs text-ink-400 mb-3">Upload a photo — appears at the top of your public studio page (max 5 MB, JPG/PNG/WebP)</p>
      {preview && (
        <img src={preview} alt="Current cover"
          className="w-full h-36 object-cover rounded-2xl mb-3"
          onError={e => { e.target.style.display = 'none'; }} />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current && inputRef.current.click()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed border-brand-300 text-brand-600 text-sm font-medium hover:bg-brand-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
          : <><Camera className="w-4 h-4" /> {preview ? 'Change photo' : 'Upload photo'}</>}
      </button>
      {error && <p className="text-rose-500 text-xs mt-2">{error}</p>}
    </div>
  );
}

const TABS = [
  { key: 'profile', label: 'Public Profile', icon: Building2 },
  { key: 'account', label: 'Account', icon: Settings },
  { key: 'password', label: 'Password', icon: Lock },
];

export default function StudioSettings() {
  const navigate = useNavigate();
  const studioId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const api = import.meta.env.VITE_API_URL;

  usePageTitle('Studio Settings');
  const [studio, setStudio] = useState(null);
  const [profileForm, setProfileForm] = useState({
    about: '', phone: '', website: '', instagram: '', city: '', neighbourhood: '', accepts_enquiries: false,
    opening_hour: 9, closing_hour: 18, tagline: '', cover_color: 'blue', cover_photo: '',
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
            tagline: d.studio.tagline || '',
            cover_color: d.studio.cover_color || 'blue',
            cover_photo: d.studio.cover_photo || '',
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

  const PROFILE_FIELDS = [
    { key: 'tagline', label: 'Tagline', type: 'text', placeholder: 'e.g. "Where strength meets serenity"' },
    { key: 'about', label: 'About', type: 'textarea', placeholder: 'Tell people what makes your studio special...' },
    { key: 'city', label: 'City', type: 'text', placeholder: 'e.g. Tel Aviv' },
    { key: 'neighbourhood', label: 'Neighbourhood', type: 'text', placeholder: 'e.g. Florentin' },
    { key: 'phone', label: 'Phone', type: 'text', placeholder: '+1 234 567 8900' },
    { key: 'website', label: 'Website', type: 'text', placeholder: 'https://yourstudio.com' },
    { key: 'instagram', label: 'Instagram', type: 'text', placeholder: '@yourstudio' },
  ];

  // Swatches mirror the gradients rendered on the public StudioProfile header.
  const COVER_COLORS = [
    { key: 'blue',   label: 'Ink',    from: 'from-ink-800',    to: 'to-ink-600' },
    { key: 'purple', label: 'Violet', from: 'from-purple-700', to: 'to-purple-500' },
    { key: 'green',  label: 'Forest', from: 'from-emerald-700', to: 'to-emerald-500' },
    { key: 'orange', label: 'Ember',  from: 'from-brand-600',  to: 'to-brand-400' },
    { key: 'rose',   label: 'Rose',   from: 'from-rose-600',   to: 'to-pink-500' },
    { key: 'teal',   label: 'Teal',   from: 'from-teal-700',   to: 'to-cyan-500' },
    { key: 'slate',  label: 'Slate',  from: 'from-ink-900',    to: 'to-ink-700' },
  ];

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-2xl mx-auto">

        <div className="mb-6">
          <h1 className="font-display font-bold text-3xl text-ink-900">Studio Settings</h1>
          <p className="text-ink-500 mt-1 flex items-center gap-2">
            {studio?.name}
            {studio?.verified && (
              <span className="inline-flex items-center gap-1 text-brand-600 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> Verified
              </span>
            )}
          </p>
        </div>

        {err && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-2xl text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {err}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-2xl text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}

        <div className="flex gap-1 mb-8 bg-white rounded-full shadow-card p-1 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-full transition
                ${activeTab === key ? 'bg-brand-500 text-white shadow-pill' : 'text-ink-500 hover:text-ink-800'}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── Public Profile tab ── */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl shadow-card p-6">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="font-display font-bold text-lg text-ink-900">Public Profile</h2>
              <span className="text-xs bg-brand-50 text-brand-600 font-medium px-2.5 py-0.5 rounded-full">Visible to everyone</span>
            </div>
            <p className="text-sm text-ink-400 mb-5">This information appears on your public studio page.</p>
            <form onSubmit={saveProfile} className="space-y-4">
              {PROFILE_FIELDS.map(field => (
                <label key={field.key} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink-700">{field.label}</span>
                  {field.type === 'textarea' ? (
                    <textarea rows={3}
                      className={inputClass}
                      placeholder={field.placeholder}
                      value={profileForm[field.key]}
                      onChange={e => setProfileForm(f => ({ ...f, [field.key]: e.target.value }))} />
                  ) : (
                    <input type="text"
                      className={inputClass}
                      placeholder={field.placeholder}
                      value={profileForm[field.key]}
                      onChange={e => setProfileForm(f => ({ ...f, [field.key]: e.target.value }))} />
                  )}
                </label>
              ))}
              {/* Enquiry toggle */}
              <div className="flex items-center justify-between p-4 bg-paper rounded-2xl">
                <div className="pr-4">
                  <p className="text-sm font-medium text-ink-800">Accept custom time enquiries</p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {profileForm.accepts_enquiries
                      ? 'Users can send you enquiry messages from your studio page'
                      : 'Enquiry button is hidden on your public page'}
                  </p>
                </div>
                <Toggle
                  checked={profileForm.accepts_enquiries}
                  onChange={() => setProfileForm(f => ({ ...f, accepts_enquiries: !f.accepts_enquiries }))}
                />
              </div>

              {/* Page theme */}
              <div className="p-4 bg-paper rounded-2xl">
                <p className="text-sm font-medium text-ink-800 mb-1">Page Theme</p>
                <p className="text-xs text-ink-400 mb-3">Colour of your public studio page header</p>
                <div className="flex flex-wrap gap-2">
                  {COVER_COLORS.map(c => (
                    <button key={c.key} type="button"
                      onClick={() => setProfileForm(f => ({ ...f, cover_color: c.key }))}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition bg-white
                        ${profileForm.cover_color === c.key ? 'border-ink-800' : 'border-transparent'}`}>
                      <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${c.from} ${c.to}`} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover photo */}
              <CoverPhotoUpload
                studioId={studioId}
                api={api}
                current={profileForm.cover_photo}
                onUploaded={url => setProfileForm(f => ({ ...f, cover_photo: url }))}
              />

              {/* Business hours */}
              <div className="p-4 bg-paper rounded-2xl">
                <p className="text-sm font-medium text-ink-800 mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-ink-400" /> Business Hours
                </p>
                <p className="text-xs text-ink-400 mb-3">Sets the time range shown on your appointment calendar</p>
                <div className="flex items-center gap-3">
                  <label className="flex flex-col gap-1 flex-1">
                    <span className="text-xs text-ink-500">Opens at</span>
                    <select className={`${inputClass} !bg-white`}
                      value={profileForm.opening_hour}
                      onChange={e => setProfileForm(f => ({ ...f, opening_hour: Number(e.target.value) }))}>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}</option>
                      ))}
                    </select>
                  </label>
                  <span className="text-ink-400 mt-4">–</span>
                  <label className="flex flex-col gap-1 flex-1">
                    <span className="text-xs text-ink-500">Closes at</span>
                    <select className={`${inputClass} !bg-white`}
                      value={profileForm.closing_hour}
                      onChange={e => setProfileForm(f => ({ ...f, closing_hour: Number(e.target.value) }))}>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full bg-brand-500 text-white py-3 rounded-full font-semibold hover:bg-brand-600 transition shadow-pill">
                Save Profile
              </button>
            </form>
          </div>
        )}

        {/* ── Account tab ── */}
        {activeTab === 'account' && (
          <div className="bg-white rounded-3xl shadow-card p-6">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="font-display font-bold text-lg text-ink-900">Account Info</h2>
              <span className="text-xs bg-ink-100 text-ink-500 font-medium px-2.5 py-0.5 rounded-full">Private</span>
            </div>
            <p className="text-sm text-ink-400 mb-5">This information is only visible to you.</p>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-ink-500 mb-0.5">Studio name</p>
                <p className="font-medium text-ink-800">{studio?.name}</p>
              </div>
              <div>
                <p className="text-ink-500 mb-0.5">Email</p>
                <p className="font-medium text-ink-800">{studio?.email || '—'}</p>
                <p className="text-xs text-ink-400 mt-0.5">Email cannot be changed.</p>
              </div>
              <div>
                <p className="text-ink-500 mb-0.5">Verification status</p>
                <p className="font-medium text-ink-800">{studio?.verified ? 'Verified' : 'Not yet verified — contact admin'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Password tab ── */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-3xl shadow-card p-6">
            <h2 className="font-display font-bold text-lg text-ink-900 mb-5">Change Password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Current password</span>
                <input type="password" className={inputClass}
                  value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">New password</span>
                <input type="password" className={inputClass}
                  value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Confirm new password</span>
                <input type="password" className={inputClass}
                  value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
              </label>
              <button type="submit" className="w-full bg-brand-500 text-white py-3 rounded-full font-semibold hover:bg-brand-600 transition shadow-pill">
                Update Password
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
