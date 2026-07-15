import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import ComplaintDetails from './pages/ComplaintDetails';
import Dashboard from './pages/Dashboard';
import HomePage from './pages/HomePage';
import { ForgotPassword, ResetPassword } from './pages/PasswordPages';
import Profile from './pages/Profile';
import Report from './pages/Report';

function Protected({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const redirect = encodeURIComponent(`${location.pathname}${location.search}`);

  return user ? children : <Navigate to={`/login?redirect=${redirect}`} replace />;
}

function AdminOnly({ children }) {
  const { user } = useAuth();

  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/report" element={<Protected><Report /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/complaints/:id" element={<Protected><ComplaintDetails /></Protected>} />
        <Route path="/admin" element={<Protected><AdminOnly><AdminDashboard /></AdminOnly></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
