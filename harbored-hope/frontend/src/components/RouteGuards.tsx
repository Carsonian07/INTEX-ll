import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ children, role }: { children: ReactNode; role?: 'Admin' | 'Donor' | 'Staff' }) {
  const { user, loading, isAdmin, isDonor, isStaff } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-hh-navy" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'Admin' && !isAdmin) return <Navigate to="/" replace />;
  if (role === 'Donor' && !isDonor && !isAdmin) return <Navigate to="/" replace />;
  if (role === 'Staff' && !isStaff) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin, isDonor, isStaff } = useAuth();
  if (loading) return null;
  if (user) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isDonor) return <Navigate to="/donor" replace />;
    if (isStaff) return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}
