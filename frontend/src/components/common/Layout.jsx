import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Bosh sahifa', icon: '🏠', roles: ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', 'DORMITORY_STAFF', 'TUTOR', 'STUDENT'] },
  { path: '/students', label: 'Talabalar', icon: '👨‍🎓', roles: ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'] },
  { path: '/dormitories', label: 'Yotoqxonalar', icon: '🏢', roles: ['SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF', 'DEAN_OFFICE', 'TUTOR'] },
  { path: '/xarita', label: 'Xona Haritasi', icon: '🗺️', roles: ['SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF', 'DEAN_OFFICE'] },
  { path: '/payments', label: "To'lovlar", icon: '💳', roles: ['SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF', 'DEAN_OFFICE'] },
  { path: '/ichki-arizalar', label: 'Ichki Murojaatlar', icon: '📬', roles: ['SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF', 'DEAN_OFFICE', 'TUTOR'] },
  { path: '/rentals', label: 'Ijara', icon: '🏠', roles: ['SUPER_ADMIN', 'DEAN_OFFICE', 'TUTOR'] },
  { path: '/commuters', label: "Qatnab o'qish", icon: '🚌', roles: ['SUPER_ADMIN', 'DEAN_OFFICE', 'TUTOR'] },
  { path: '/green-mode', label: 'Yashil rejim', icon: '🟢', roles: ['SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'] },
  { path: '/face-id', label: 'Face ID', icon: '🎥', roles: ['SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'] },
  { path: '/recommendations', label: 'Tavsiyanomalar', icon: '⭐', roles: ['SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF', 'DEAN_OFFICE'] },
  { path: '/reports', label: 'Hisobotlar', icon: '📊', roles: ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', 'DORMITORY_STAFF'] },
  { path: '/users', label: 'Foydalanuvchilar', icon: '👥', roles: ['SUPER_ADMIN'] },
  { path: '/profile', label: 'Profil', icon: '👤', roles: ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', 'DORMITORY_STAFF', 'TUTOR', 'STUDENT'] },
];

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Administrator',
  ADMIN: "Yotoqxona boshlig'i",
  DEAN_OFFICE: 'Dekanat xodimi',
  DORMITORY_STAFF: 'Yotoqxona xodimi',
  TUTOR: 'Tyutor',
  STUDENT: 'Talaba',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isMobile = window.innerWidth <= 768;

  // Ekran o'lchamini kuzatish
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobilda sahifa o'zgarganda menyu yopilsin
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const visibleNav = navItems.filter(item => item.roles.includes(user?.role));
  const currentPage = visibleNav.find(n => n.path === location.pathname)?.label || 'Sahifa';

  const SidebarContent = () => (
    <>
      <div style={styles.sidebarHeader}>
        {(sidebarOpen || mobileOpen) && (
          <div>
            <div style={styles.siteTitle}>🏛️ Turar Joy</div>
            <div style={styles.siteSubtitle}>Boshqaruv tizimi</div>
          </div>
        )}
        {!isMobile && (
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.toggleBtn}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        )}
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} style={styles.toggleBtn}>✕</button>
        )}
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
            {(sidebarOpen || mobileOpen) && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div style={styles.sidebarFooter}>
        {(sidebarOpen || mobileOpen) && (
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user?.firstName} {user?.lastName}</div>
            <div style={styles.userRole}>{ROLE_LABELS[user?.role]}</div>
          </div>
        )}
        <button onClick={() => setShowLogoutConfirm(true)} style={styles.logoutBtn} title="Chiqish">🚪</button>
      </div>
    </>
  );

  return (
    <div style={styles.root}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside style={{ ...styles.sidebar, width: sidebarOpen ? '240px' : '64px' }}>
          <SidebarContent />
        </aside>
      )}

      {/* Mobile overlay + drawer */}
      {isMobile && mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
          />
          <aside style={{ ...styles.sidebar, width: '260px', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 101 }}>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Chiqish tasdiqlash */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 360, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚪</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a3a6b', margin: '0 0 8px' }}>Tizimdan chiqish</h2>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 24px' }}>Haqiqatan ham tizimdan chiqmoqchimisiz?</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, padding: '11px 0', borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                Bekor qilish
              </button>
              <button onClick={logout} style={{ flex: 1, padding: '11px 0', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                Chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asosiy kontent */}
      <main style={styles.main}>
        <div style={styles.topBar}>
          {/* Mobile hamburger */}
          {isMobile && (
            <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#1a3a6b', padding: '4px 8px' }}>
              ☰
            </button>
          )}
          <div style={styles.breadcrumb}>{currentPage}</div>
          <div style={styles.topBarRight}>
            <span style={{ ...styles.standardBadge, display: isMobile ? 'none' : 'block' }}>
              O'RQ-547 | OneID | HEMIS
            </span>
            <span style={{ fontSize: 12, color: '#666', display: isMobile ? 'block' : 'none' }}>
              {user?.firstName}
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
    background: '#1a3a6b', color: '#fff',
    display: 'flex', flexDirection: 'column',
    transition: 'width 0.3s ease',
    overflow: 'hidden', flexShrink: 0,
  },
  sidebarHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  siteTitle: { fontSize: 18, fontWeight: 700, color: '#fff' },
  siteSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  toggleBtn: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 13, flexShrink: 0 },
  nav: { flex: 1, padding: '12px 0', overflowY: 'auto' },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14, transition: 'all 0.2s', whiteSpace: 'nowrap' },
  navItemActive: { background: 'rgba(255,255,255,0.15)', color: '#fff', borderRight: '3px solid #4fc3f7' },
  navIcon: { fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' },
  sidebarFooter: { padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  userInfo: { overflow: 'hidden' },
  userName: { fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  logoutBtn: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 16, flexShrink: 0 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', minWidth: 0 },
  topBar: { background: '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10, gap: 12 },
  breadcrumb: { fontSize: 15, fontWeight: 600, color: '#1a3a6b', flex: 1 },
  topBarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  standardBadge: { fontSize: 11, background: '#e8f0fe', color: '#1a3a6b', padding: '4px 10px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap' },
  content: { flex: 1 },
};
