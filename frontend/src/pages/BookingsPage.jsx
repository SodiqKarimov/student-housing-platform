import React, { useEffect, useState, useCallback } from 'react';
import { dormitoryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = { PENDING: 'Kutilmoqda', APPROVED: 'Tasdiqlangan', REJECTED: 'Rad etilgan', ACTIVE: 'Faol', CHECKED_OUT: "Chiqib ketgan", CANCELLED: 'Bekor qilingan' };
const STATUS_COLORS = { PENDING: ['#fff8e1','#b07a00'], APPROVED: ['#e8f5e9','#2e7d32'], REJECTED: ['#ffebee','#c62828'], ACTIVE: ['#e3f2fd','#1565c0'], CHECKED_OUT: ['#f5f5f5','#555'], CANCELLED: ['#fce4ec','#880e4f'] };

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);

  const canReview = ['SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'].includes(user?.role);

  const load = useCallback(() => {
    setLoading(true);
    dormitoryApi.getBookings({ page, limit: 15, status: filterStatus || undefined })
      .then(({ data }) => {
        setBookings(data.data?.data || []);
        setTotal(data.data?.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    if (!window.confirm("Bu arizani tasdiqlaysizmi?")) return;
    setSaving(true);
    try {
      await dormitoryApi.reviewBooking(id, { action: 'APPROVED' });
      load();
    } catch (e) { alert(e.response?.data?.message || 'Xato'); }
    finally { setSaving(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { alert("Rad etish sababini kiriting"); return; }
    setSaving(true);
    try {
      await dormitoryApi.reviewBooking(reviewing, { action: 'REJECTED', rejectionReason: rejectReason });
      setReviewing(null); setRejectReason('');
      load();
    } catch (e) { alert(e.response?.data?.message || 'Xato'); }
    finally { setSaving(false); }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Arizalar (Bronlar)</h1>
          <p style={s.sub}>Jami: {total} ta ariza</p>
        </div>
      </div>

      {/* Status filter */}
      <div style={s.statusTabs}>
        {[['', 'Barchasi'], ['PENDING', 'Kutilmoqda'], ['APPROVED', 'Tasdiqlangan'], ['ACTIVE', 'Faol'], ['REJECTED', 'Rad etilgan']].map(([v, l]) => (
          <button key={v} onClick={() => { setFilterStatus(v); setPage(1); }}
            style={{ ...s.tab, ...(filterStatus === v ? s.tabActive : {}) }}>
            {l}
          </button>
        ))}
      </div>

      <div style={s.card}>
        {loading ? <div style={s.center}>Yuklanmoqda...</div>
          : bookings.length === 0 ? <div style={s.center}>Arizalar topilmadi</div>
          : (
            <>
              <div style={s.tableHead}>
                <span>Talaba</span><span>Yotoqxona</span><span>Xona</span>
                <span>Sana</span><span>Semestr</span><span>Holat</span>
                {canReview && <span>Amallar</span>}
              </div>
              {bookings.map(b => {
                const [bg, color] = STATUS_COLORS[b.status] || ['#f5f5f5', '#555'];
                return (
                  <div key={b.id} style={s.tableRow}>
                    <span style={{ fontWeight: 500 }}>
                      {b.student?.user?.lastName} {b.student?.user?.firstName}
                      {b.student?.user?.phone && <div style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>{b.student.user.phone}</div>}
                    </span>
                    <span>{b.dormitory?.name}</span>
                    <span>{b.room?.roomNumber}-xona, {b.room?.floor}-qavat</span>
                    <span style={{ fontSize: 12 }}>{new Date(b.createdAt || Date.now()).toLocaleDateString('uz-UZ')}</span>
                    <span style={{ fontSize: 13 }}>{b.semester}, {b.academicYear}</span>
                    <span>
                      <span style={{ ...s.badge, background: bg, color }}>{STATUS_LABELS[b.status] || b.status}</span>
                    </span>
                    {canReview && (
                      <span style={{ display: 'flex', gap: 6 }}>
                        {b.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleApprove(b.id)} disabled={saving} style={s.btnApprove}>Tasdiqlash</button>
                            <button onClick={() => { setReviewing(b.id); setRejectReason(''); }} disabled={saving} style={s.btnReject}>Rad etish</button>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}
      </div>

      {totalPages > 1 && (
        <div style={s.pagination}>
          <button style={s.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Oldingi</button>
          <span style={{ color: '#555', fontSize: 14 }}>{page} / {totalPages}</span>
          <button style={s.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Keyingi →</button>
        </div>
      )}

      {/* Rad etish modal */}
      {reviewing && (
        <div style={s.overlay} onClick={() => setReviewing(null)}>
          <div style={{ ...s.modal, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>Arizani rad etish</h2>
              <button onClick={() => setReviewing(null)} style={s.closeBtn}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <label style={s.label}>Rad etish sababi *</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Masalan: Yotoqxonada bo'sh joy qolmadi..."
                style={{ ...s.input, minHeight: 100, resize: 'vertical' }}
              />
            </div>
            <div style={s.modalFooter}>
              <button onClick={() => setReviewing(null)} style={s.btnSecondary}>Bekor qilish</button>
              <button onClick={handleReject} disabled={saving} style={{ ...s.btnPrimary, background: '#c0392b' }}>
                {saving ? 'Rad etilmoqda...' : 'Rad etish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { padding: 24, maxWidth: 1300, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 700, color: '#1a3a6b', margin: '0 0 4px' },
  sub: { color: '#888', fontSize: 14, margin: 0 },
  statusTabs: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  tab: { padding: '8px 16px', borderRadius: 20, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500, color: '#555' },
  tabActive: { background: '#1a3a6b', color: '#fff', border: '1px solid #1a3a6b' },
  card: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  center: { padding: 40, textAlign: 'center', color: '#888' },
  tableHead: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.2fr 1fr 1.2fr 1.2fr 1.5fr', padding: '12px 16px', background: '#f8f9fa', fontWeight: 600, fontSize: 13, color: '#555', borderBottom: '1px solid #eee' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.2fr 1fr 1.2fr 1.2fr 1.5fr', padding: '12px 16px', borderBottom: '1px solid #f5f5f5', fontSize: 14, alignItems: 'center' },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 },
  btnApprove: { background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  btnReject: { background: '#ffebee', color: '#c62828', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 },
  pageBtn: { background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee' },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#1a3a6b', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', padding: 4 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  btnPrimary: { background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnSecondary: { background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #eee' },
};
