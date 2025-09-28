import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import StudioDashboard from './pages/StudioDashboard';
import UserDashboard from './pages/UserDashboard';
import RoleRoute from './components/RoleRoute';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Only studios can access /studio */}
        <Route
          path="/studio"
          element={
            <RoleRoute allow={['studio']}>
              <StudioDashboard />
            </RoleRoute>
          }
        />

        {/* Only users can access /dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleRoute allow={['user']}>
              <UserDashboard />
            </RoleRoute>
          }
        />
      </Routes>
    </Router>
  </React.StrictMode>
);
