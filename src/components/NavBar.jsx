// src/components/NavBar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * The Navbar is pinned to the top using Tailwind classes:
 * - `fixed`: pins it to the top of the screen
 * - `top-0 left-0 w-full`: full-width top bar
 * - `z-10`: ensures it appears above other content
 * The content is spaced using flexbox:
 * - `justify-between`: left and right separation (logo vs. buttons)
 * - `items-center`: vertical alignment
 */
export default function Navbar() {
  return (
    <div className="navbar-fixed flex justify-between items-center p-4 border-b bg-white shadow-md">
      <Link to="/" className="text-xl font-bold text-blue-600">FitFlex</Link>

      {/* Button group: right side of the navbar */}
      <div className="flex space-x-3">
        <Link to="/signup" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">SignUp </Link>
        <Link to="/login" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
          Login
        </Link>
      </div>
    </div>
  );
}