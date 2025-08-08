// src/pages/Home.jsx
import React from 'react';
import Navbar from '../components/NavBar';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/ping`)
      .then(res => res.json())
      .then(data => console.log("✅ Backend says:", data))
      .catch(err => console.error("❌ Failed to reach backend:", err));
  }, []);

  return <h1>FitFlex Home</h1>;
}

/**
 * The Home page content starts below the fixed navbar by adding `pt-24`
 * (padding-top: 6rem = height of navbar). This avoids overlap.
 */
export default function Home() {
  const userName = localStorage.getItem('userName');
  const userRole = localStorage.getItem('userRole');

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="pt-24 px-4"> {/* pushes content below fixed navbar */}
        <div className="p-8 max-w-xl mx-auto text-center bg-white rounded-xl shadow-md">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Welcome to FitFlex!</h1>
          {userName && userRole ? (
            <p className="text-lg text-gray-700">
              You are signed in as <strong>{userName}</strong> ({userRole})
            </p>
          ) : (
            <p className="text-lg text-gray-700">
              Please sign up or log in to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
