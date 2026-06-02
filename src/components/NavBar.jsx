// src/components/NavBar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [authed, setAuthed] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    setAuthed(!!userName);
    setName(userName || '');
    setRole(userRole || '');
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch { /* ignore network errors */ }
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setAuthed(false);
    setRole('');
    navigate('/');
  };

  const dashboardPath = role === 'studio' ? '/studio' : '/dashboard';
  const settingsPath = role === 'studio' ? '/studio/settings' : '/settings';

  return (
    <div className="fixed top-0 left-0 w-full z-10 flex justify-between items-center px-6 py-3 border-b bg-white shadow-sm">
      <Link to="/" className="text-xl font-bold text-blue-600">FitFlex</Link>

      <div className="flex items-center gap-3">
        {authed ? (
          <>
            <Link to={dashboardPath} className="text-sm text-gray-600 hover:text-blue-600 hidden sm:block">Dashboard</Link>
            <Link to={settingsPath} className="text-sm text-gray-600 hover:text-blue-600 hidden sm:block">Settings</Link>
            <span className="text-sm text-gray-400 hidden sm:block">|</span>
            <span className="text-sm text-gray-600 hidden sm:block">Hi, {name}</span>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/signup" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">Sign Up</Link>
            <Link to="/login" className="px-4 py-2 bg-gray-100 text-gray-800 text-sm rounded-lg hover:bg-gray-200 transition">Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
