import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '/api/v1';

export default function LoginPage() {
  const { setTokens } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('staff'); // 'admin' | 'staff'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const loginAdmin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/dev/mock-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sub: 'mock-admin-001' }),
      });
      const data = await res.json();
      if (data.success) {
        setTokens(data.data.accessToken, data.data.refreshToken, data.data.user);
        navigate('/dashboard', { replace: true });
      } else {
        setError(data.message || 'Xato yuz berdi');
      }
    } catch {
      setError('Server uyg\'onmoqda... 30 soniya kuting va qayta bosing');
    } finally {
      setLoading(false);
    }
  };

  const loginStaff = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Email va parol kiritilishi shart'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setTokens(data.data.accessToken, data.data.refreshToken, data.data.user);
        navigate('/dashboard', { replace: true });
      } else {
        setError(data.message || 'Email yoki parol noto\'g\'ri');
      }
    } catch {
      setError('Server bilan bog\'lanib bo\'lmadi. Qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🏛️</div>
          <h1 style={styles.title}>Talabalar Turar Joyi</h1>
          <p style={styles.subtitle}>Boshqaruv tizimi</p>
        </div>

        <div style={styles.divider} />

        {/* Tablar */}
        <div style={styles.tabs}>
          <button
            onClick={() => { setTab('staff'); setError(''); }}
            style={{ ...styles.tabBtn, ...(tab === 'staff' ? styles.tabActive : {}) }}
          >
            👤 Xodim kirishi
          </button>
          <button
            onClick={() => { setTab('admin'); setError(''); }}
            style={{ ...styles.tabBtn, ...(tab === 'admin' ? styles.tabActive : {}) }}
          >
            🔑 Super Admin
          </button>
        </div>

        {tab === 'staff' && (
          <form onSubmit={loginStaff} style={{ marginTop: 16 }}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@university.uz"
                style={styles.input}
                autoFocus
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Parol</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...styles.input, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 16 }}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {error && <div style={styles.error}>{error}</div>}
            <button type="submit" disabled={loading} style={styles.btnPrimary}>
              {loading ? 'Tekshirilmoqda...' : 'Kirish'}
            </button>
            <p style={styles.hint}>Parolingizni Super Admin bergan vaqtinchalik paroldan foydalaning</p>
          </form>
        )}

        {tab === 'admin' && (
          <div style={{ marginTop: 16 }}>
            <div style={styles.adminBadge}>🧪 Demo rejim — Super Admin</div>
            <button
              onClick={loginAdmin}
              disabled={loading}
              style={styles.adminBtn}
            >
              <div style={styles.avatar}>A</div>
              <div style={styles.userInfo}>
                <div style={styles.userName}>Aziz Karimov</div>
                <div style={styles.userRole}>Super Administrator</div>
              </div>
              {loading && <span>⏳</span>}
            </button>
            {error && <div style={styles.error}>{error}</div>}
          </div>
        )}

        <div style={styles.footer}>
          <p style={styles.footerText}>O'RQ-547 "Shaxsiy ma'lumotlar to'g'risida" qonuniga muvofiq ishlaydi</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a3a6b 0%, #0d5c8f 100%)', padding: '20px' },
  card: { background: '#fff', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  logo: { textAlign: 'center', marginBottom: '20px' },
  logoIcon: { fontSize: '44px', marginBottom: '8px' },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a3a6b', margin: '0 0 4px' },
  subtitle: { fontSize: '13px', color: '#666', margin: 0 },
  divider: { height: '1px', background: '#eee', margin: '20px 0' },
  tabs: { display: 'flex', gap: 8, marginBottom: 4 },
  tabBtn: { flex: 1, padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#555' },
  tabActive: { background: '#1a3a6b', color: '#fff', border: '2px solid #1a3a6b' },
  fieldGroup: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '5px' },
  input: { width: '100%', padding: '11px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  btnPrimary: { width: '100%', padding: '12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', marginTop: 4 },
  hint: { fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '10px' },
  adminBadge: { background: '#fff8e1', color: '#b07a00', border: '1px solid #ffe082', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, textAlign: 'center', marginBottom: '12px' },
  adminBtn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', border: '2px solid #e8edf4', borderRadius: '10px', background: '#fff', cursor: 'pointer', textAlign: 'left', width: '100%' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#1a3a6b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0 },
  userInfo: { flex: 1 },
  userName: { fontWeight: 600, color: '#1a3a6b', fontSize: '14px' },
  userRole: { fontSize: '12px', color: '#888', marginTop: '2px' },
  error: { marginTop: '10px', padding: '10px 14px', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', color: '#c0392b', fontSize: '13px', textAlign: 'center' },
  footer: { marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #eee' },
  footerText: { fontSize: '11px', color: '#bbb', textAlign: 'center', margin: 0 },
};
