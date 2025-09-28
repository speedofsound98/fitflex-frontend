// src/components/RoleRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function RoleRoute({ allow = [], children }) {
  const role = localStorage.getItem('userRole'); // 'user' | 'studio' | null
  if (!role) return <Navigate to="/login" replace />;
  return allow.includes(role) ? children : <Navigate to="/" replace />;
}
