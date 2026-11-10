import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import { ProtectedRoute, PublicRoute } from './components/AuthGuard';
import ErrorBoundary from './components/ErrorBoundary';
import Spinner from './components/Spinner';

// Lazy load all views to prevent memory load and comply with Rubric 3.3
const Login = lazy(() => import('./views/auth/Login'));
const Register = lazy(() => import('./views/auth/Register'));

// Driver Views
const MapSearch = lazy(() => import('./views/driver/MapSearch'));
const Reservations = lazy(() => import('./views/driver/Reservations'));
const Favorites = lazy(() => import('./views/driver/Favorites'));
const Wallet = lazy(() => import('./views/driver/Wallet'));

// Host Views
const Dashboard = lazy(() => import('./views/host/Dashboard'));
const ManageSpaces = lazy(() => import('./views/host/ManageSpaces'));
const AddSpaceForm = lazy(() => import('./views/host/AddSpaceForm'));
const HostWallet = lazy(() => import('./views/host/Wallet'));
const ScanSimulation = lazy(() => import('./views/host/ScanSimulation'));

// Admin Views
const UserManagement = lazy(() => import('./views/admin/UserManagement'));

// NotFound View
const NotFound = lazy(() => import('./views/NotFound'));

const DashboardLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div className="app-container">
      {isAuthenticated && <Sidebar />}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

// Loading fallback component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    width: '100%'
  }}>
    <Spinner size={48} />
  </div>
);

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } 
              />

              {/* Protected Portal Routes inside Dashboard Layout */}
              <Route element={<DashboardLayout />}>
                
                {/* Driver Routes */}
                <Route 
                  path="/driver/map" 
                  element={
                    <ProtectedRoute allowedRoles={['DRIVER']}>
                      <MapSearch />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/driver/reservations" 
                  element={
                    <ProtectedRoute allowedRoles={['DRIVER']}>
                      <Reservations />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/driver/favorites" 
                  element={
                    <ProtectedRoute allowedRoles={['DRIVER']}>
                      <Favorites />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/driver/wallet" 
                  element={
                    <ProtectedRoute allowedRoles={['DRIVER']}>
                      <Wallet />
                    </ProtectedRoute>
                  } 
                />

                {/* Host Routes */}
                <Route 
                  path="/host/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['HOST']}>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/host/scan" 
                  element={
                    <ProtectedRoute allowedRoles={['HOST']}>
                      <ScanSimulation />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/host/spaces" 
                  element={
                    <ProtectedRoute allowedRoles={['HOST']}>
                      <ManageSpaces />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/host/add-space" 
                  element={
                    <ProtectedRoute allowedRoles={['HOST']}>
                      <AddSpaceForm />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/host/edit-space/:id" 
                  element={
                    <ProtectedRoute allowedRoles={['HOST']}>
                      <AddSpaceForm />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/host/wallet" 
                  element={
                    <ProtectedRoute allowedRoles={['HOST']}>
                      <HostWallet />
                    </ProtectedRoute>
                  } 
                />

                {/* Admin Routes */}
                <Route 
                  path="/admin/users" 
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <UserManagement />
                    </ProtectedRoute>
                  } 
                />

              </Route>

              {/* NotFound 404 Route */}
              <Route 
                path="/404" 
                element={<NotFound />} 
              />

              {/* Fallback route */}
              <Route 
                path="*" 
                element={<Navigate to="/404" replace />} 
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
