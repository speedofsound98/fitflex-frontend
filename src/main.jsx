import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import StudioDashboard from './pages/StudioDashboard';
import StudioSettings from './pages/StudioSettings';
import StudioProfile from './pages/StudioProfile';
import UserDashboard from './pages/UserDashboard';
import UserSettings from './pages/UserSettings';
import RoleRoute from './components/RoleRoute';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import Pricing from './pages/Pricing';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset" element={<ResetPassword />} />

        {/* Public studio profile */}
        <Route path="/studios/:id" element={<StudioProfile />} />

        {/* Studio-only routes */}
        <Route path="/studio" element={<RoleRoute allow={['studio']}><StudioDashboard /></RoleRoute>} />
        <Route path="/studio/settings" element={<RoleRoute allow={['studio']}><StudioSettings /></RoleRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Public */}
        <Route path="/pricing" element={<Pricing />} />

        {/* User-only routes */}
        <Route path="/dashboard" element={<RoleRoute allow={['user']}><UserDashboard /></RoleRoute>} />
        <Route path="/settings" element={<RoleRoute allow={['user']}><UserSettings /></RoleRoute>} />
      </Routes>
    </Router>
  </React.StrictMode>
);
