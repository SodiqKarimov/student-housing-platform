import { useState, useEffect } from 'react';
import { rentalApi } from '../services/api';

const STATUS_LABELS = {
  PENDING: { label: 'Kutilmoqda', color: '#f59e0b' },
  VERIFIED: { label: 'Tasdiqlangan', color: '#10b981' },
  REJECTED: { label: 'Rad etilgan', color: '#ef4444' },
  EXPIRED: { label: 'Muddati o\'tgan', color: '#6b7280' },
};

export default function RentalsPage() {
  const [rentals, setRentals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyNote, setVerifyNote] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await rentalApi.getAll({ page, limit: 20, status: statusFilter || undefined });
      setRentals(res.data.data?.items || []);
      setTotal(res.data.data?.total || 0);
    } catch {
      setRentals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleVerify = async (action) => {
    try {
      await rentalApi.verify(selected.id, { action, note: verifyNote });
      setShowVerify(false);
      setSelected(null);
      setVerifyNote('');
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Xato yuz berdi');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Ijara ro'yxati</h1>
        <span style={{ color: '#6b7280' }}>Jami: {total} ta</span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: statusFilter === s ? '#3b82f6' : '#f3f4f6',
              color: statusFilter === s ? 'white' : '#374151',
              fontWeight: statusFilter === s ? 600 : 400,
            }}
          >
            {s === '' ? 'Barchasi' : STATUS_LABELS[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Yuklanmoqda...</div>
      ) : rentals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Ma'lumot topilmadi</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                {['Talaba', 'Viloyat/Tuman', 'Manzil', 'Uy egasi', 'Oylik ijara', 'Holat', 'Amallar'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rentals.map((r, i) => {
                const s = STATUS_LABELS[r.verificationStatus] || { label: r.verificationStatus, color: '#6b7280' };
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500 }}>{r.student?.user?.lastName} {r.student?.user?.firstName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{r.student?.user?.phone || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{r.region}, {r.district}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', maxWidth: '200px' }}>{r.address}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '14px' }}>{r.ownerFullName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{r.ownerPhone}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      {r.monthlyRent ? `${r.monthlyRent.toLocaleString()} so'm` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: s.color + '20', color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => { setSelected(r); setShowVerify(true); }}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Ko'rish
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              style={{
                width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: page === i + 1 ? '#3b82f6' : '#f3f4f6',
                color: page === i + 1 ? 'white' : '#374151',
                fontWeight: page === i + 1 ? 600 : 400,
              }}
            >{i + 1}</button>
          ))}
        </div>
      )}

      {/* Detail / Verify Modal */}
      {showVerify && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '560px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 700 }}>Ijara tafsilotlari</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                ['Talaba', `${selected.student?.user?.lastName} ${selected.student?.user?.firstName}`],
                ['Telefon', selected.student?.user?.phone || '—'],
                ['Viloyat', selected.region],
                ['Tuman', selected.district],
                ['Manzil', selected.address],
                ['Uy egasi', selected.ownerFullName],
                ["Uy egasi tel", selected.ownerPhone],
                ['Shartnoma №', selected.contractNumber || '—'],
                ['Oylik ijara', selected.monthlyRent ? `${selected.monthlyRent.toLocaleString()} so'm` : '—'],
                ['Mahalla', selected.mahallahName || '—'],
                ['Holat', STATUS_LABELS[selected.verificationStatus]?.label || selected.verificationStatus],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>{k}</div>
                  <div style={{ fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>

            {selected.verificationStatus === 'PENDING' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Izoh</label>
                  <textarea
                    value={verifyNote}
                    onChange={e => setVerifyNote(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box' }}
                    placeholder="Tasdiqlash yoki rad etish sababi..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => handleVerify('VERIFY')} style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    Tasdiqlash
                  </button>
                  <button onClick={() => handleVerify('REJECT')} style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    Rad etish
                  </button>
                </div>
              </>
            )}

            <button onClick={() => { setShowVerify(false); setSelected(null); setVerifyNote(''); }} style={{ width: '100%', padding: '12px', marginTop: '12px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
