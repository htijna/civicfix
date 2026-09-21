import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ComplaintDetails = lazy(() => import('./pages/ComplaintDetails'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DepartmentDashboard = lazy(() => import('./pages/DepartmentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Report = lazy(() => import('./pages/Report'));
const ForgotPassword = lazy(() => import('./pages/PasswordPages').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/PasswordPages').then(m => ({ default: m.ResetPassword })));

function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: '#216b55', fontSize: '14px', fontWeight: '600' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', border: '3px solid #e7f1ed', borderTopColor: '#216b55', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span>Loading CivicFix...</span>
      </div>
    </div>
  );
}

function Protected({ children, loginPath = '/login' }) {
  const { user, authReady } = useAuth();
  const location = useLocation();
  const redirect = encodeURIComponent(`${location.pathname}${location.search}`);

  if (!authReady) return <PageLoader />;
  return user ? children : <Navigate to={`${loginPath}?redirect=${redirect}`} replace />;
}

function AdminOnly({ children }) {
  const { user } = useAuth();

  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
}

function DepartmentOnly({ children }) {
  const { user } = useAuth();

  return user?.role === 'department_officer' ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/admin-login" element={<AuthPage mode="admin" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/report" element={<Protected><Report /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/complaints/:id" element={<Protected><ComplaintDetails /></Protected>} />
          <Route path="/admin" element={<Protected loginPath="/admin-login"><AdminOnly><AdminDashboard /></AdminOnly></Protected>} />
          <Route path="/department" element={<Protected><DepartmentOnly><DepartmentDashboard /></DepartmentOnly></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

