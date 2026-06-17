import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentApi, dormitoryApi } from '../services/api';

const COLORS = {
  DORMITORY: '#1a3a6b',
  RENTAL: '#0d8f5c',
  COMMUTER: '#8f4d0d',
};

const LABELS = {
  DORMITORY: 'Yotoqxona',
  RENTAL: 'Ijarada',
  COMMUTER: 'Uyidan qatnab',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [bookingStats, setBookingStats] = useState(null);
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canArchive = isSuperAdmin || isAdmin;

  useEffect(() => {
    Promise.all([
      studentApi.getHousingStats(),
      dormitoryApi.getBookings({ status: 'PENDING', limit: 5 }),
      ...(canArchive ? [dormitoryApi.getAll({ limit: 50 })] : []),
    ])
      .then(([{ data: housingData }, { data: bookingsData }, dormsRes]) => {
        setStats(housingData.data);
        setBookingStats(bookingsData.data?.items || []);
        if (dormsRes) setDorms(dormsRes.data.data?.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Yuklanmoqda...</div>;

  const housingTypesToShow = isAdmin
    ? stats?.byHousingType?.filter(item => item.type === 'DORMITORY')
    : stats?.byHousingType;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Bosh sahifa</h1>
        <p style={styles.welcome}>
          Xush kelibsiz, <strong>{user?.firstName} {user?.lastName}</strong>
        </p>
      </div>

      {/* Asosiy statistika kartalar */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderTop: '4px solid #1a3a6b' }}>
          <div style={styles.statNumber}>{stats?.total || 0}</div>
          <div style={styles.statLabel}>Jami talabalar</div>
        </div>

        {housingTypesToShow?.map((item) => (
          <div key={item.type} style={{ ...styles.statCard, borderTop: `4px solid ${COLORS[item.type] || '#999'}` }}>
            <div style={styles.statNumber}>{item.count}</div>
            <div style={styles.statLabel}>{LABELS[item.type] || item.type}</div>
            <div style={styles.statPercent}>{item.percentage}%</div>
          </div>
        ))}
      </div>

      {/* Yashash holati taqsimoti — ADMIN uchun faqat yotoqxona */}
      {housingTypesToShow && housingTypesToShow.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Yashash holati taqsimoti</h2>
          <div style={styles.barContainer}>
            {housingTypesToShow.map((item) => (
              <div key={item.type} style={styles.barItem}>
                <div style={styles.barLabel}>{LABELS[item.type]}</div>
                <div style={styles.barTrack}>
                  <div
                    style={{
                      ...styles.barFill,
                      width: `${item.percentage}%`,
                      background: COLORS[item.type] || '#999',
                    }}
                  />
                </div>
                <div style={styles.barCount}>{item.count} ({item.percentage}%)</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kutilayotgan arizalar */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Ko'rib chiqilishi kerak arizalar</h2>
        {bookingStats?.length === 0 ? (
          <p style={styles.empty}>Kutilayotgan ariza yo'q</p>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Talaba</span>
              <span>Yotoqxona</span>
              <span>Xona</span>
              <span>Sana</span>
              <span>Holat</span>
            </div>
            {bookingStats?.slice(0, 5).map((b) => (
              <div key={b.id} style={styles.tableRow}>
                <span>{b.student?.user?.lastName} {b.student?.user?.firstName}</span>
                <span>{b.dormitory?.name}</span>
                <span>{b.room?.roomNumber}</span>
                <span>{new Date(b.createdAt).toLocaleDateString('uz-UZ')}</span>
                <span style={{ ...styles.badge, background: '#fff3cd', color: '#856404' }}>
                  Kutilmoqda
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fakultet bo'yicha statistika — ADMIN uchun faqat DORMITORY */}
      {stats?.byFaculty?.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Fakultetlar bo'yicha yashash holati</h2>
          <div style={styles.facultyGrid}>
            {[...new Set(stats.byFaculty.map(f => f.faculty))].slice(0, 6).map((faculty) => {
              const items = stats.byFaculty
                .filter(f => f.faculty === faculty)
                .filter(f => !isAdmin || f.housingType === 'DORMITORY');
              if (items.length === 0) return null;
              const total = items.reduce((s, i) => s + i._count._all, 0);
              return (
                <div key={faculty} style={styles.facultyCard}>
                  <div style={styles.facultyName}>{faculty}</div>
                  <div style={styles.facultyTotal}>{total} talaba</div>
                  {items.map(item => (
                    <div key={item.housingType} style={styles.facultyItem}>
                      <span style={{ ...styles.dot, background: COLORS[item.housingType] }} />
                      <span>{LABELS[item.housingType]}: {item._count._all}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  container: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  header: { marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '700', color: '#1a3a6b', margin: '0 0 4px' },
  welcome: { color: '#666', fontSize: '16px', margin: 0 },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', fontSize: '18px', color: '#666' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' },
  statNumber: { fontSize: '36px', fontWeight: '700', color: '#1a3a6b' },
  statLabel: { fontSize: '14px', color: '#666', marginTop: '4px' },
  statPercent: { fontSize: '20px', fontWeight: '600', color: '#999', marginTop: '4px' },
  section: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#1a3a6b', margin: '0 0 20px' },
  barContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
  barItem: { display: 'grid', gridTemplateColumns: '140px 1fr 120px', alignItems: 'center', gap: '12px' },
  barLabel: { fontSize: '14px', color: '#555', fontWeight: '500' },
  barTrack: { background: '#f0f0f0', borderRadius: '999px', height: '12px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '999px', transition: 'width 0.6s ease' },
  barCount: { fontSize: '13px', color: '#777', textAlign: 'right' },
  table: { border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '12px 16px', background: '#f8f9fa', fontWeight: '600', fontSize: '13px', color: '#555' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '12px 16px', borderTop: '1px solid #eee', fontSize: '14px', alignItems: 'center' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', display: 'inline-block' },
  empty: { color: '#999', textAlign: 'center', padding: '24px' },
  facultyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' },
  facultyCard: { border: '1px solid #eee', borderRadius: '8px', padding: '16px' },
  facultyName: { fontWeight: '600', color: '#1a3a6b', marginBottom: '4px', fontSize: '14px' },
  facultyTotal: { color: '#999', fontSize: '12px', marginBottom: '10px' },
  facultyItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#555', marginTop: '4px' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
};
