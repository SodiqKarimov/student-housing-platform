import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import DormitoriesPage from './pages/DormitoriesPage';
import UsersPage from './pages/UsersPage';
import BookingsPage from './pages/BookingsPage';

function OneIdCallbackPage() {
  const [params] = useSearchParams();
  const { setTokens } = useAuth();
  const [status, setStatus] = React.useState('Tekshirilmoqda...');

  React.useEffect(() => {
    const code = params.get('code');
    const state = params.get('state');
    if (!code) { setStatus('Xato: Kod topilmadi'); return; }

    const apiBase = import.meta.env.VITE_API_URL || '/api/v1';
    fetch(`${apiBase}/auth/oneid/callback?code=${code}&state=${state}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setTokens(data.data.accessToken, data.data.refreshToken, data.data.user);
          window.location.href = '/dashboard';
        } else {
          setStatus('Kirish xato: ' + data.message);
        }
      })
      .catch(() => setStatus('Server bilan bog\'lanishda xato'));
  }, []);// eslint-disable-line

  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize: 40 }}>🔄</div>
      <p style={{ color: '#555' }}>{status}</p>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color:'#666' }}>
      Yuklanmoqda...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<OneIdCallbackPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
      <Route path="/dormitories" element={<ProtectedRoute><DormitoriesPage /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
