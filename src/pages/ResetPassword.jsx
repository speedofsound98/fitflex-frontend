// src/pages/ResetPassword.jsx
import React, { useState } from 'react';
import Navbar from '../components/NavBar';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
const [params] = useSearchParams();
const navigate = useNavigate();
const token = params.get('token') || '';
const [password, setPassword] = useState('');
const [confirm, setConfirm] = useState('');
const [error, setError] = useState('');
const [message, setMessage] = useState('');

const isValidPassword = (p) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(p);

const handleSubmit = async (e) => {
e.preventDefault(); setError(''); setMessage('');
if (password !== confirm) return setError('Passwords do not match');
if (!isValidPassword(password)) return setError('Password must be 8+ chars with letters & numbers');
try {
const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword: password })
});
const data = await res.json();
if (!res.ok) throw new Error(data.error || 'Reset failed');
setMessage('Password reset successful. Redirecting to login...');
setTimeout(()=>navigate('/login'), 1200);
} catch (err) { setError(err.message); }
};

return (
<div className="min-h-screen bg-gray-100">
<Navbar />
<div className="pt-24 px-4">
<div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow">
<h2 className="text-xl font-bold mb-4">Reset Password</h2>
{message && <p className="text-green-700 text-sm mb-2">{message}</p>}
{error && <p className="text-red-600 text-sm mb-2">{error}</p>}
<form className="flex flex-col gap-2" onSubmit={handleSubmit}>
<input type="password" placeholder="New password" className="border p-2" value={password} onChange={(e)=>setPassword(e.target.value)} required />
<input type="password" placeholder="Confirm password" className="border p-2" value={confirm} onChange={(e)=>setConfirm(e.target.value)} required />
<button type="submit" className="bg-blue-500 text-white p-2 rounded">Reset Password</button>
</form>
</div>
</div>
</div>
);
}