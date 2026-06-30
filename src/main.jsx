import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
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
import Groups from './pages/Groups';
import GroupProfile from './pages/GroupProfile';
import EventDetail from './pages/EventDetail';
import Messages from './pages/Messages';
import Studios from './pages/Studios';
import WorkoutPlan from './pages/WorkoutPlan';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import AdminBlog from './pages/AdminBlog';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset" element={<ResetPassword />} />

        {/* Public studio directory + profile */}
        <Route path="/studios" element={<Studios />} />
        <Route path="/studios/:id" element={<StudioProfile />} />

        {/* Studio-only routes */}
        <Route path="/studio" element={<RoleRoute allow={['studio']}><StudioDashboard /></RoleRoute>} />
        <Route path="/studio/settings" element={<RoleRoute allow={['studio']}><StudioSettings /></RoleRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/blog" element={<AdminBlog />} />

        {/* Blog */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />

        {/* Public */}
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:id" element={<GroupProfile />} />
        <Route path="/events/:eventId" element={<EventDetail />} />
        <Route path="/messages" element={<Messages />} />

        {/* User-only routes */}
        <Route path="/dashboard" element={<RoleRoute allow={['user']}><UserDashboard /></RoleRoute>} />
        <Route path="/training-plan" element={<RoleRoute allow={['user']}><WorkoutPlan /></RoleRoute>} />
        <Route path="/settings" element={<RoleRoute allow={['user']}><UserSettings /></RoleRoute>} />
      </Routes>
    </Router>
    </HelmetProvider>
  </React.StrictMode>
);
