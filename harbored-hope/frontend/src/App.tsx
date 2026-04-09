import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth, RedirectIfAuthed } from './components/RouteGuards';

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
import UsersPage from './pages/admin/UsersPage';
import SecurityPage from './pages/shared/SecurityPage';
import SocialPostPlannerPage from './pages/admin/SocialPostPlannerPage';

import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

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
            <Route path="security" element={<SecurityPage />} />
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
            <Route path="users" element={<RequireAuth role="Admin"><UsersPage /></RequireAuth>} />
            <Route path="social-planner" element={<SocialPostPlannerPage />} />
            <Route path="users" element={<RequireAuth role="Admin"><UsersPage /></RequireAuth>} />
            <Route path="security" element={<SecurityPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
