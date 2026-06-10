import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '/api/v1';

const TEST_USERS = [
  { sub: 'mock-admin-001', name: 'Aziz Karimov', role: 'Super Administrator', color: '#1a3a6b' },
];

export default function LoginPage() {
  const { setTokens } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const loginAs = async (sub) => {
    setLoading(sub);
    setError('');
    try {
      const res = await fetch(`${API}/dev/mock-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sub }),
      });
      const data = await res.json();
      if (data.success) {
        setTokens(data.data.accessToken, data.data.refreshToken, data.data.user);
        navigate('/dashboard', { replace: true });
      } else {
        setError(data.message || 'Xato yuz berdi');
      }
    } catch {
      setError('Server uyg\'onmoqda... 30 soniya kuting va qayta bosing (Render bepul rejimi)');
    } finally {
      setLoading(null);
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

        <div style={styles.badge}>🧪 Demo rejim — Foydalanuvchi tanlang</div>

        <div style={styles.userList}>
          {TEST_USERS.map((u) => (
            <button
              key={u.sub}
              onClick={() => loginAs(u.sub)}
              disabled={loading !== null}
              style={{ ...styles.userBtn, opacity: loading && loading !== u.sub ? 0.5 : 1 }}
            >
              <div style={{ ...styles.avatar, background: u.color }}>
                {u.name[0]}
              </div>
              <div style={styles.userInfo}>
                <div style={styles.userName}>{u.name}</div>
                <div style={styles.userRole}>{u.role}</div>
              </div>
              {loading === u.sub && <div style={styles.spinner}>⏳</div>}
            </button>
          ))}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.footer}>
          <p style={styles.footerText}>
            O'RQ-547 "Shaxsiy ma'lumotlar to'g'risida" qonuniga muvofiq ishlaydi
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a3a6b 0%, #0d5c8f 100%)',
    padding: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '36px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: { textAlign: 'center', marginBottom: '20px' },
  logoIcon: { fontSize: '44px', marginBottom: '8px' },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a3a6b', margin: '0 0 4px' },
  subtitle: { fontSize: '13px', color: '#666', margin: 0 },
  divider: { height: '1px', background: '#eee', margin: '20px 0' },
  badge: {
    background: '#fff8e1',
    color: '#b07a00',
    border: '1px solid #ffe082',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '16px',
  },
  userList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  userBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    border: '2px solid #e8edf4',
    borderRadius: '10px',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
    width: '100%',
  },
  avatar: {
    width: '40px', height: '40px',
    borderRadius: '50%',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '16px', flexShrink: 0,
  },
  userInfo: { flex: 1 },
  userName: { fontWeight: '600', color: '#1a3a6b', fontSize: '14px' },
  userRole: { fontSize: '12px', color: '#888', marginTop: '2px' },
  spinner: { fontSize: '16px' },
  error: {
    marginTop: '12px',
    padding: '10px 14px',
    background: '#fff0f0',
    border: '1px solid #ffcccc',
    borderRadius: '8px',
    color: '#c0392b',
    fontSize: '13px',
    textAlign: 'center',
  },
  footer: { marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #eee' },
  footerText: { fontSize: '11px', color: '#bbb', textAlign: 'center', margin: 0 },
};
