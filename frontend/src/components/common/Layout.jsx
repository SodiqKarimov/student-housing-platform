import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Bosh sahifa', icon: '🏠', roles: ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', 'DORMITORY_STAFF', 'STUDENT'] },
  { path: '/students', label: 'Talabalar', icon: '👨‍🎓', roles: ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'] },
  { path: '/dormitories', label: 'Yotoqxonalar', icon: '🏢', roles: ['SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'] },
  { path: '/rentals', label: 'Ijara', icon: '🏠', roles: ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'] },
  { path: '/commuters', label: 'Qatnab o\'qish', icon: '🚌', roles: ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'] },
  { path: '/green-mode', label: 'Yashil rejim', icon: '🟢', roles: ['SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'] },
  { path: '/face-id', label: 'Face ID', icon: '🎥', roles: ['SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'] },
  { path: '/recommendations', label: 'Tavsiyanomalar', icon: '⭐', roles: ['SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF', 'DEAN_OFFICE'] },
  { path: '/reports', label: 'Hisobotlar', icon: '📊', roles: ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'] },
  { path: '/users', label: 'Foydalanuvchilar', icon: '👥', roles: ['SUPER_ADMIN'] },
  { path: '/profile', label: 'Profil', icon: '👤', roles: ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', 'DORMITORY_STAFF', 'STUDENT'] },
];

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Administrator',
  ADMIN: 'Yotoqxona boshlig\'i',
  DEAN_OFFICE: 'Dekanat xodimi',
  DORMITORY_STAFF: 'Yotoqxona xodimi',
  STUDENT: 'Talaba',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const visibleNav = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? '240px' : '64px' }}>
        <div style={styles.sidebarHeader}>
          {sidebarOpen && (
            <div>
              <div style={styles.siteTitle}>🏛️ Turar Joy</div>
              <div style={styles.siteSubtitle}>Boshqaruv tizimi</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.toggleBtn}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav style={styles.nav}>
          {visibleNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                ...(location.pathname === item.path ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          {sidebarOpen && (
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user?.firstName} {user?.lastName}</div>
              <div style={styles.userRole}>{ROLE_LABELS[user?.role]}</div>
            </div>
          )}
          <button onClick={logout} style={styles.logoutBtn} title="Chiqish">
            🚪
          </button>
        </div>
      </aside>

      {/* Asosiy kontent */}
      <main style={styles.main}>
        <div style={styles.topBar}>
          <div style={styles.breadcrumb}>
            {visibleNav.find(n => n.path === location.pathname)?.label || 'Sahifa'}
          </div>
          <div style={styles.topBarRight}>
            <span style={styles.standardBadge}>
              O'RQ-547 | OneID | HEMIS
            </span>
          </div>
        </div>
        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}

const styles = {
  root: { display: 'flex', minHeight: '100vh', background: '#f5f7fb' },
  sidebar: {
    background: '#1a3a6b',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    overflow: 'hidden',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  siteTitle: { fontSize: '18px', fontWeight: '700', color: '#fff' },
  siteSubtitle: { fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' },
  toggleBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#fff',
    borderRadius: '6px',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    fontSize: '12px',
    flexShrink: 0,
  },
  nav: { flex: 1, padding: '12px 0', overflowY: 'auto' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    borderRadius: '0',
  },
  navItemActive: {
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    borderRight: '3px solid #4fc3f7',
  },
  navIcon: { fontSize: '18px', flexShrink: 0, width: '24px', textAlign: 'center' },
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: { overflow: 'hidden' },
  userName: { fontSize: '13px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' },
  logoutBtn: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', flexShrink: 0 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
  topBar: {
    background: '#fff',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  breadcrumb: { fontSize: '16px', fontWeight: '600', color: '#1a3a6b' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  standardBadge: { fontSize: '11px', background: '#e8f0fe', color: '#1a3a6b', padding: '4px 10px', borderRadius: '20px', fontWeight: '500' },
  content: { flex: 1 },
};
