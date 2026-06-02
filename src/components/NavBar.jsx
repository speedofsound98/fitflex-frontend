// src/components/NavBar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [authed, setAuthed] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
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
    } catch { /* ignore */ }
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setAuthed(false);
    setRole('');
    setMenuOpen(false);
    navigate('/');
  };

  const dashboardPath = role === 'studio' ? '/studio' : '/dashboard';
  const settingsPath = role === 'studio' ? '/studio/settings' : '/settings';

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="fixed top-0 left-0 w-full z-20 bg-white border-b shadow-sm">
      {/* Main bar */}
      <div className="flex justify-between items-center px-4 sm:px-6 py-3">
        <Link to="/" className="text-xl font-bold text-blue-600" onClick={closeMenu}>FitFlex</Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3">
          <Link to="/pricing" className="text-sm text-gray-600 hover:text-blue-600">Pricing</Link>
          {authed ? (
            <>
              <Link to={dashboardPath} className="text-sm text-gray-600 hover:text-blue-600">Dashboard</Link>
              <Link to={settingsPath} className="text-sm text-gray-600 hover:text-blue-600">Settings</Link>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-600">Hi, {name}</span>
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

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t bg-white px-4 py-3 flex flex-col gap-3">
          <Link to="/pricing" onClick={closeMenu} className="text-sm text-gray-700 py-2 border-b">Pricing</Link>
          {authed ? (
            <>
              <p className="text-xs text-gray-400">Hi, {name}</p>
              <Link to={dashboardPath} onClick={closeMenu} className="text-sm text-gray-700 py-2 border-b">Dashboard</Link>
              <Link to={settingsPath} onClick={closeMenu} className="text-sm text-gray-700 py-2 border-b">Settings</Link>
              <button onClick={handleLogout} className="w-full py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signup" onClick={closeMenu} className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg text-center hover:bg-blue-700 transition">Sign Up</Link>
              <Link to="/login" onClick={closeMenu} className="w-full py-2 bg-gray-100 text-gray-800 text-sm rounded-lg text-center hover:bg-gray-200 transition">Login</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
