// src/pages/Login.jsx
import React from 'react';
import Navbar from "../components/NavBar";

export default function Login() {
  return (
    <div>
      <Navbar />
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <form className="flex flex-col gap-2">
          <input type="email" placeholder="Email" className="border p-2" />
          <input type="password" placeholder="Password" className="border p-2" />
          <button type="submit" className="bg-blue-500 text-white p-2">Log In</button>
        </form>
      </div>
    </div>
  );
}
