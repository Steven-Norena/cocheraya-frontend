import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'DRIVER' | 'HOST' | 'ADMIN'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-color)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid var(--panel-border)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to default home page based on role if they try to access unauthorized pages
    if (user.role === 'DRIVER') return <Navigate to="/driver/map" replace />;
    if (user.role === 'HOST') return <Navigate to="/host/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/users" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated && user) {
    if (user.role === 'DRIVER') return <Navigate to="/driver/map" replace />;
    if (user.role === 'HOST') return <Navigate to="/host/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/users" replace />;
  }

  return <>{children}</>;
};
export default ProtectedRoute;
