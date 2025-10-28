// src/components/NavBar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/** Navbar
* - Fixed top bar with logo (left) and auth actions (right)
* - Shows Logout when a user is signed in (localStorage driven for now)
*/
export default function Navbar() {
const [authed, setAuthed] = useState(false);
const [name, setName] = useState('');
const navigate = useNavigate();

useEffect(() => {
const userName = localStorage.getItem('userName');
setAuthed(!!userName);
setName(userName || '');
}, []);

const handleLogout = () => {
// Clear local auth (later: also call backend /auth/logout if using tokens)
localStorage.removeItem('userName');
localStorage.removeItem('userRole');
// If you store a token later: localStorage.removeItem('token');
setAuthed(false);
navigate('/');
};

return (
<div className="fixed top-0 left-0 w-full z-10 flex justify-between items-center p-4 border-b bg-white shadow-md">
<Link to="/" className="text-xl font-bold text-blue-600">FitFlex</Link>

<div className="flex items-center space-x-3">
{authed ? (
<>
<span className="text-sm text-gray-600 hidden sm:block">Hi, {name}</span>
<button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Logout</button>
</>
) : (
<>
<Link to="/signup" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Sign Up</Link>
<Link to="/login" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Login</Link>
</>
)}
</div>
</div>
);
}