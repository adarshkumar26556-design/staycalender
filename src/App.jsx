import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
import RoomStatus from './pages/RoomStatus';
import Revenue from './pages/Revenue';
import Bookings from './pages/Bookings';
import GuestCRM from './pages/GuestCRM';
import ChannelManager from './pages/ChannelManager';
import AdminPanel from './pages/AdminPanel';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useContext(AuthContext);
  const location = window.location.pathname;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const adminRoutes = ['/admin', '/channel-manager'];
  if (user.role === 'Admin' && !adminRoutes.includes(location)) {
    return <Navigate to="/admin" replace />;
  }

  if (user.role !== 'Admin' && requiredRole === 'Admin') {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/calendar" 
        element={
          <ProtectedRoute>
            <CalendarView />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/status" 
        element={
          <ProtectedRoute>
            <RoomStatus />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/revenue" 
        element={
          <ProtectedRoute>
            <Revenue />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/bookings" 
        element={
          <ProtectedRoute>
            <Bookings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/guests" 
        element={
          <ProtectedRoute>
            <GuestCRM />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/channel-manager" 
        element={
          <ProtectedRoute requiredRole="Admin">
            <ChannelManager />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="Admin">
            <AdminPanel />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
