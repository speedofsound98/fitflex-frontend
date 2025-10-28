// src/pages/Login.jsx
import React, { useState } from 'react';
import Navbar from '../components/NavBar';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const navigate = useNavigate();

const handleLogin = async (e) => {
e.preventDefault();
setError('');
try {
const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email, password })
});
const data = await res.json();
if (!res.ok) throw new Error(data.error || 'Login failed');
// Save minimal session info (later: token)
localStorage.setItem('userName', data.name || 'User');
localStorage.setItem('userRole', data.role || 'user');
navigate('/');
} catch (err) {
setError(err.message);
}
};

return (
<div className="min-h-screen bg-gray-100">
<Navbar />
<div className="pt-24 px-4">
<div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow">
<h2 className="text-xl font-bold mb-4">Login</h2>
{error && <p className="text-red-600 text-sm mb-2">{error}</p>}
<form className="flex flex-col gap-2" onSubmit={handleLogin}>
<input type="email" placeholder="Email" className="border p-2" value={email} onChange={(e)=>setEmail(e.target.value)} required />
<input type="password" placeholder="Password" className="border p-2" value={password} onChange={(e)=>setPassword(e.target.value)} required />
<button type="submit" className="bg-blue-500 text-white p-2 rounded">Log In</button>
</form>
<div className="mt-3 text-sm">
<Link to="/forgot" className="text-blue-600 hover:underline">Forgot your password?</Link>
</div>
</div>
</div>
</div>
);
}
