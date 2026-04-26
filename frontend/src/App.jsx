import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from './services/socket';

import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import ManageDrivers from './pages/admin/ManageDrivers';
import ManageStudents from './pages/admin/ManageStudents';
import ManageBuses from './pages/admin/ManageBuses';
import AdminLiveMap from './pages/admin/AdminLiveMap';
import AdminNotifications from './pages/admin/AdminNotifications';
import TripHistory from './pages/admin/TripHistory';
import DriverPanel from './pages/driver/DriverPanel';
import StudentPanel from './pages/student/StudentPanel';
import ParentPanel from './pages/parent/ParentPanel';
import ChangePassword from './pages/ChangePassword';
import Profile from './pages/Profile';

function SocketManager() {
  const { token } = useAuth();
  useEffect(() => {
    if (token) connectSocket(token);
    return () => disconnectSocket();
  }, [token]);
  return null;
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'driver') return <Navigate to="/driver" replace />;
  if (user.role === 'parent') return <Navigate to="/parent" replace />;
  return <Navigate to="/student" replace />;
}

function AppRoutes() {
  return (
    <>
      <SocketManager />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="/" element={<RoleRedirect />} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="drivers" element={<ManageDrivers />} />
          <Route path="students" element={<ManageStudents />} />
          <Route path="buses" element={<ManageBuses />} />
          <Route path="live-map" element={<AdminLiveMap />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="trip-history" element={<TripHistory />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Driver */}
        <Route path="/driver" element={<ProtectedRoute allowedRoles={['driver']}><DriverPanel /></ProtectedRoute>} />

        {/* Student */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentPanel /></ProtectedRoute>} />

        {/* Parent */}
        <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent']}><ParentPanel /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' },
            success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
