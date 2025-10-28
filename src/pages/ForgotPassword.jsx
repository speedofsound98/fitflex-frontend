// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import Navbar from '../components/NavBar';

export default function ForgotPassword() {
const [email, setEmail] = useState('');
const [message, setMessage] = useState('');
const [error, setError] = useState('');

const handleSubmit = async (e) => {
e.preventDefault();
setError(''); setMessage('');
try {
const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/request-password-reset`, {
method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
});
const data = await res.json();
if (!res.ok) throw new Error(data.error || 'Request failed');
setMessage('If this email exists, a reset link has been sent. (Dev: check console/network for token)');
} catch (err) { setError(err.message); }
};

return (
<div className="min-h-screen bg-gray-100">
<Navbar />
<div className="pt-24 px-4">
<div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow">
<h2 className="text-xl font-bold mb-4">Forgot Password</h2>
{message && <p className="text-green-700 text-sm mb-2">{message}</p>}
{error && <p className="text-red-600 text-sm mb-2">{error}</p>}
<form className="flex flex-col gap-2" onSubmit={handleSubmit}>
<input type="email" placeholder="Your email" className="border p-2" value={email} onChange={(e)=>setEmail(e.target.value)} required />
<button type="submit" className="bg-blue-500 text-white p-2 rounded">Send reset link</button>
</form>
</div>
</div>
</div>
);
}