// src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/NavBar";

export default function Signup() {
  const [role, setRole] = useState('user');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', location: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isValidPassword = (password) =>
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidPassword(formData.password)) {
      setError('Password must be 8+ chars with letters and numbers');
      return;
    }

    const endpoint = role === 'user' ? '/signup/user' : '/signup/studio';
    // Use consistent keys; backend can branch by endpoint
    const payload =
      role === 'user'
        ? { name: formData.name, email: formData.email, password: formData.password }
        : { name: formData.name, location: formData.location, email: formData.email, password: formData.password };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');

      // optional: store basic identity for the navbar/home
      localStorage.setItem('userName', data.user?.name || data.user?.email || 'User');
      localStorage.setItem('userRole', data.user?.role || 'user');
      localStorage.setItem('userId', String(data.user?.id || ''));
      if (data.user?.role === 'studio') {
        navigate('/studio');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Sign Up</h2>
        <div className="mb-4">
          <button className={`mr-2 ${role === 'user' ? 'font-bold underline' : ''}`} onClick={() => setRole('user')}>User</button>
          <button className={`${role === 'studio' ? 'font-bold underline' : ''}`} onClick={() => setRole('studio')}>Studio</button>
        </div>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          <input
            type="text" placeholder={role === 'studio' ? 'Studio Name' : 'Name'}
            className="border p-2" value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
          />
          {role === 'studio' && (
            <input
              type="text" placeholder="Location" className="border p-2"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          )}
          <input
            type="email" placeholder="Email" className="border p-2"
            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required
          />
          <input
            type="password" placeholder="Password" className="border p-2"
            value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required
          />
          <button type="submit" className={`${role === 'user' ? 'bg-blue-500' : 'bg-green-600'} text-white p-2`}>
            Sign Up as {role === 'user' ? 'User' : 'Studio'}
          </button>
        </form>
      </div>
    </div>
  );
}
