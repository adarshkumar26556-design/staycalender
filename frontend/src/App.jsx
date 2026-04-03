import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import CalendarView from './pages/CalendarView';
import RoomStatus from './pages/RoomStatus';
import Revenue from './pages/Revenue';
import AdminPanel from './pages/AdminPanel';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useContext(AuthContext);
  const location = window.location.pathname;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'Admin' && location !== '/admin') {
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
