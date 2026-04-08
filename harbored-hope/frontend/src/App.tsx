import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReactNode } from 'react';

// Public pages
import HomePage from './pages/public/HomePage';
import ImpactPage from './pages/public/ImpactPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import PrivacyPage from './pages/public/PrivacyPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Donor pages
import DonorDashboard from './pages/donor/DonorDashboard';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CaseloadInventory from './pages/admin/CaseloadInventory';
import ResidentDetail from './pages/admin/ResidentDetail';
import ProcessRecordingPage from './pages/admin/ProcessRecordingPage';
import HomeVisitationPage from './pages/admin/HomeVisitationPage';
import DonorsPage from './pages/admin/DonorsPage';
import ReportsPage from './pages/admin/ReportsPage';
import SocialPostPlannerPage from './pages/admin/SocialPostPlannerPage';

import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// ─── Route Guards ─────────────────────────────────────────────────────────────
function RequireAuth({ children, role }: { children: ReactNode; role?: 'Admin' | 'Donor' | 'Staff' }) {
  const { user, loading, isAdmin, isDonor, isStaff } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-hh-navy" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'Admin' && !isAdmin) return <Navigate to="/" replace />;
  if (role === 'Donor' && !isDonor && !isAdmin) return <Navigate to="/" replace />;
  if (role === 'Staff' && !isStaff) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin, isDonor } = useAuth();
  if (loading) return null;
  if (user) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isDonor) return <Navigate to="/donor" replace />;
  }
  return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/impact" element={<ImpactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
            <Route path="/register" element={<RedirectIfAuthed><RegisterPage /></RedirectIfAuthed>} />
          </Route>

          {/* Donor routes */}
          <Route path="/donor" element={
            <RequireAuth role="Donor">
              <PublicLayout />
            </RequireAuth>
          }>
            <Route index element={<DonorDashboard />} />
          </Route>

          {/* Admin / Staff routes */}
          <Route path="/admin" element={
            <RequireAuth role="Staff">
              <AdminLayout />
            </RequireAuth>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="residents" element={<CaseloadInventory />} />
            <Route path="residents/:id" element={<ResidentDetail />} />
            <Route path="residents/:id/process-recordings" element={<ProcessRecordingPage />} />
            <Route path="residents/:id/home-visitations" element={<HomeVisitationPage />} />
            <Route path="donors" element={<DonorsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="social-planner" element={<SocialPostPlannerPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
