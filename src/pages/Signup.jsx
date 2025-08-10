// src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/NavBar";

export default function Signup() {
  const [role, setRole] = useState('user');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    location: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isValidPassword = (password) => {
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  const endpoint = role === 'user' ? '/signup/user' : '/signup/studio';
  const payload = role === 'user'
    ? { name, email, password }
    : { studio_name, location, email, password };

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      // Redirect to home
      window.location.href = '/';
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error(err);
    alert('Network error');
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
          {role === 'studio' && (
            <input
              type="text"
              placeholder="Studio Name"
              className="border p-2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          )}
          {role === 'user' && (
            <input
              type="text"
              placeholder="Name"
              className="border p-2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          )}
          {role === 'studio' && (
            <input
              type="text"
              placeholder="Location"
              className="border p-2"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="border p-2"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border p-2"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <button
            type="submit"
            className={`${role === 'user' ? 'bg-blue-500' : 'bg-green-600'} text-white p-2`}
          >
            Sign Up as {role === 'user' ? 'User' : 'Studio'}
          </button>
        </form>
      </div>
    </div>
  );
}