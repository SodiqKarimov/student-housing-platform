import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { loginWithOneId } = useAuth();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🏛️</div>
          <h1 style={styles.title}>Talabalar Turar Joyi</h1>
          <p style={styles.subtitle}>Boshqaruv tizimi</p>
        </div>

        <div style={styles.divider} />

        <div style={styles.content}>
          <p style={styles.description}>
            Tizimga kirish uchun O'zbekiston Respublikasi yagona identifikatsiya tizimi
            <strong> OneID</strong> dan foydalaning.
          </p>

          <button onClick={loginWithOneId} style={styles.oneIdButton}>
            <img
              src="https://id.egov.uz/images/oneid-logo.png"
              alt="OneID"
              style={styles.oneIdLogo}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span>OneID orqali kirish</span>
          </button>

          <p style={styles.hint}>
            OneID — O'zbekiston Respublikasi fuqarolarining yagona raqamli identifikatori
          </p>
        </div>

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
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: { textAlign: 'center', marginBottom: '24px' },
  logoIcon: { fontSize: '48px', marginBottom: '8px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a3a6b', margin: '0 0 4px' },
  subtitle: { fontSize: '14px', color: '#666', margin: 0 },
  divider: { height: '1px', background: '#eee', margin: '24px 0' },
  content: { textAlign: 'center' },
  description: { fontSize: '14px', color: '#555', lineHeight: '1.6', marginBottom: '24px' },
  oneIdButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '14px 24px',
    background: '#1a3a6b',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  oneIdLogo: { height: '24px', width: 'auto' },
  hint: { fontSize: '12px', color: '#999', marginTop: '12px', lineHeight: '1.5' },
  footer: { marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #eee' },
  footerText: { fontSize: '11px', color: '#bbb', textAlign: 'center', margin: 0 },
};
