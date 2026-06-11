import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '/api/v1';

export default function LoginPage() {
  const { setTokens } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Email va parol kiritilishi shart'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        setTokens(data.data.accessToken, data.data.refreshToken, data.data.user);
        navigate('/dashboard', { replace: true });
      } else {
        setError(data.message || 'Email yoki parol noto\'g\'ri');
      }
    } catch {
      setError('Server bilan bog\'lanib bo\'lmadi. Render uyg\'onmoqda bo\'lishi mumkin — 30 soniya kuting.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@university.uz');
    setPassword('Admin@TTJ2024');
    setShowDemo(false);
    setError('');
  };

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.icon}>🏛️</div>
          <h1 style={s.title}>Talabalar Turar Joyi</h1>
          <p style={s.sub}>Boshqaruv tizimi</p>
        </div>

        <div style={s.divider} />

        <form onSubmit={handleLogin}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@university.uz"
              style={s.input}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Parol</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...s.input, paddingRight: 44 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={s.eyeBtn}
                tabIndex={-1}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <div style={s.error}>{error}</div>}

          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? 'Tekshirilmoqda...' : 'Kirish →'}
          </button>
        </form>

        {/* Demo kirish — kichik yashirin bo'lim */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setShowDemo(v => !v)}
            style={s.demoToggle}
          >
            {showDemo ? '▲ Demo kirish' : '▼ Demo kirish (test rejimi)'}
          </button>
          {showDemo && (
            <div style={s.demoBox}>
              <div style={s.demoRow}>
                <span style={s.demoLabel}>Super Admin:</span>
                <code style={s.demoCode}>admin@university.uz</code>
              </div>
              <div style={s.demoRow}>
                <span style={s.demoLabel}>Parol:</span>
                <code style={s.demoCode}>Admin@TTJ2024</code>
              </div>
              <button onClick={fillDemo} style={s.fillBtn}>
                Ma'lumotlarni to'ldirish
              </button>
              <p style={s.demoNote}>
                ⚠️ Bu faqat test uchun. Haqiqiy tizimda OneID ishlatiladi.
              </p>
            </div>
          )}
        </div>

        <div style={s.footer}>
          <p style={s.footerText}>O'RQ-547 "Shaxsiy ma'lumotlar to'g'risida" qonuniga muvofiq ishlaydi</p>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a3a6b 0%, #0d5c8f 100%)', padding: 20 },
  card: { background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  logo: { textAlign: 'center', marginBottom: 20 },
  icon: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 700, color: '#1a3a6b', margin: '0 0 4px' },
  sub: { fontSize: 13, color: '#666', margin: 0 },
  divider: { height: 1, background: '#eee', margin: '20px 0' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 },
  input: { width: '100%', padding: '11px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  eyeBtn: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888', padding: 4 },
  error: { marginBottom: 12, padding: '10px 14px', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 8, color: '#c0392b', fontSize: 13, textAlign: 'center' },
  btn: { width: '100%', padding: 13, background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', letterSpacing: 0.5 },
  demoToggle: { background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, cursor: 'pointer', padding: '4px 8px' },
  demoBox: { background: '#f8faff', border: '1px solid #e0e7ff', borderRadius: 10, padding: 16, marginTop: 8, textAlign: 'left' },
  demoRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  demoLabel: { fontSize: 12, color: '#666', minWidth: 90 },
  demoCode: { fontSize: 12, background: '#e8f0fe', color: '#1a3a6b', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' },
  fillBtn: { width: '100%', marginTop: 10, padding: '8px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  demoNote: { fontSize: 11, color: '#f59e0b', marginTop: 8, textAlign: 'center', margin: '8px 0 0' },
  footer: { marginTop: 20, paddingTop: 16, borderTop: '1px solid #eee' },
  footerText: { fontSize: 11, color: '#bbb', textAlign: 'center', margin: 0 },
};
