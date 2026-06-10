import { useState, useEffect, useCallback } from 'react';
import { rentalApi, studentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  PENDING: { label: 'Kutilmoqda', color: '#f59e0b' },
  VERIFIED: { label: 'Tasdiqlangan', color: '#10b981' },
  REJECTED: { label: 'Rad etilgan', color: '#ef4444' },
  EXPIRED: { label: 'Muddati o\'tgan', color: '#6b7280' },
};

const EMPTY_FORM = {
  studentId: '',
  region: '', district: '', address: '',
  ownerFullName: '', ownerPinfl: '', ownerPhone: '',
  contractNumber: '', contractDate: '',
  monthlyRent: '',
};

export default function RentalsPage() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [showVerify, setShowVerify] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [verifyNote, setVerifyNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [students, setStudents] = useState([]);
  const [formError, setFormError] = useState('');

  const canAdd = ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'].includes(user?.role);
  const canVerify = ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'].includes(user?.role);

  const load = useCallback(async () => {
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
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setShowAddModal(true);
    studentApi.getAll({ limit: 300, housingType: 'COMMUTER' })
      .then(r => setStudents(r.data.data?.items || []))
      .catch(() => {});
  };

  const handleAdd = async () => {
    if (!form.studentId || !form.region || !form.district || !form.address || !form.ownerFullName || !form.ownerPhone) {
      setFormError('Talaba, viloyat, tuman, manzil, uy egasi FIO va telefon majburiy');
      return;
    }
    setSaving(true); setFormError('');
    try {
      await rentalApi.create({
        ...form,
        monthlyRent: form.monthlyRent ? parseFloat(form.monthlyRent) : null,
        contractDate: form.contractDate || null,
      });
      setShowAddModal(false);
      load();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Xato yuz berdi');
    } finally { setSaving(false); }
  };

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

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const totalPages = Math.ceil(total / 20);

  return (
    <div style={{ padding: '24px', maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px', color: '#1a3a6b' }}>Ijara ro'yxati</h1>
          <span style={{ color: '#6b7280', fontSize: 14 }}>Jami: {total} ta</span>
        </div>
        {canAdd && (
          <button onClick={openAdd} style={s.btnPrimary}>+ Ijara qo'shish</button>
        )}
      </div>

      {/* Status filtrlari */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[['', 'Barchasi'], ['PENDING', 'Kutilmoqda'], ['VERIFIED', 'Tasdiqlangan'], ['REJECTED', 'Rad etilgan'], ['EXPIRED', 'Muddati o\'tgan']].map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => { setStatusFilter(val); setPage(1); }}
            style={{
              padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: statusFilter === val ? '#1a3a6b' : '#f3f4f6',
              color: statusFilter === val ? 'white' : '#374151',
              fontWeight: statusFilter === val ? 600 : 400,
              fontSize: 13,
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Yuklanmoqda...</div>
      ) : rentals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Ma'lumot topilmadi</div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={s.tableHead}>
            <span>Talaba</span>
            <span>Viloyat / Tuman</span>
            <span>Manzil</span>
            <span>Uy egasi</span>
            <span>Oylik ijara</span>
            <span>Shartnoma</span>
            <span>Holat</span>
            <span>Amallar</span>
          </div>
          {rentals.map((r, i) => {
            const st = STATUS_LABELS[r.verificationStatus] || { label: r.verificationStatus, color: '#6b7280' };
            return (
              <div key={r.id} style={{ ...s.tableRow, background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{r.student?.user?.lastName} {r.student?.user?.firstName}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{r.student?.user?.phone || '—'}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>PINFL: {r.student?.pinfl || '—'}</div>
                </div>
                <div style={{ fontSize: 14 }}>{r.region}, {r.district}</div>
                <div style={{ fontSize: 13, color: '#555', maxWidth: 180 }}>{r.address}</div>
                <div>
                  <div style={{ fontSize: 14 }}>{r.ownerFullName}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{r.ownerPhone}</div>
                  {r.ownerPinfl && <div style={{ fontSize: 11, color: '#aaa' }}>PINFL: {r.ownerPinfl}</div>}
                </div>
                <div style={{ fontSize: 14 }}>
                  {r.monthlyRent ? `${r.monthlyRent.toLocaleString()} so'm` : '—'}
                </div>
                <div>
                  <div style={{ fontSize: 13 }}>{r.contractNumber || '—'}</div>
                  {r.contractDate && <div style={{ fontSize: 11, color: '#888' }}>{new Date(r.contractDate).toLocaleDateString('uz-UZ')}</div>}
                </div>
                <div>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: st.color + '20', color: st.color }}>
                    {st.label}
                  </span>
                </div>
                <div>
                  {canVerify && (
                    <button
                      onClick={() => { setSelected(r); setShowVerify(true); setVerifyNote(''); }}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Ko'rish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sahifalash */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 }}>
          <button style={s.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Oldingi</button>
          <span style={{ color: '#555', fontSize: 14 }}>{page} / {totalPages}</span>
          <button style={s.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Keyingi</button>
        </div>
      )}

      {/* Ko'rish / Tasdiqlash modali */}
      {showVerify && selected && (
        <div style={s.overlay}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 700, color: '#1a3a6b' }}>Ijara tafsilotlari</h2>

            <div style={{ marginBottom: 16 }}>
              <div style={s.sectionTitle}>Talaba ma'lumotlari</div>
              <div style={s.detailGrid}>
                <Info label="F.I.O" value={`${selected.student?.user?.lastName} ${selected.student?.user?.firstName} ${selected.student?.user?.middleName || ''}`} />
                <Info label="JSHSHIR" value={selected.student?.pinfl || '—'} />
                <Info label="Telefon" value={selected.student?.user?.phone || '—'} />
                <Info label="Pasport" value={selected.student?.passportSeries ? `${selected.student.passportSeries}${selected.student.passportNumber}` : '—'} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={s.sectionTitle}>Uy egasi ma'lumotlari</div>
              <div style={s.detailGrid}>
                <Info label="F.I.O" value={selected.ownerFullName || '—'} />
                <Info label="JSHSHIR" value={selected.ownerPinfl || '—'} />
                <Info label="Telefon" value={selected.ownerPhone || '—'} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={s.sectionTitle}>Manzil</div>
              <div style={s.detailGrid}>
                <Info label="Viloyat" value={selected.region} />
                <Info label="Tuman" value={selected.district} />
                <Info label="To'liq manzil" value={selected.address} />
                {selected.mahallahName && <Info label="Mahalla" value={selected.mahallahName} />}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={s.sectionTitle}>Shartnoma</div>
              <div style={s.detailGrid}>
                <Info label="Shartnoma raqami" value={selected.contractNumber || '—'} />
                <Info label="Shartnoma sanasi" value={selected.contractDate ? new Date(selected.contractDate).toLocaleDateString('uz-UZ') : '—'} />
                <Info label="Oylik ijara" value={selected.monthlyRent ? `${selected.monthlyRent.toLocaleString()} so'm` : '—'} />
                <Info label="Holat" value={STATUS_LABELS[selected.verificationStatus]?.label || selected.verificationStatus} />
              </div>
            </div>

            {selected.verificationStatus === 'PENDING' && canVerify && (
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

            <button onClick={() => { setShowVerify(false); setSelected(null); setVerifyNote(''); }}
              style={{ width: '100%', padding: '12px', marginTop: '12px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
              Yopish
            </button>
          </div>
        </div>
      )}

      {/* Ijara qo'shish modali */}
      {showAddModal && (
        <div style={s.overlay}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a3a6b' }}>Yangi ijara yozuvi</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ padding: 24 }}>
              <div style={s.sectionTitle}>Talaba</div>
              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Talaba *</label>
                <select value={form.studentId} onChange={e => f('studentId', e.target.value)} style={s.input}>
                  <option value="">Talabani tanlang...</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.user?.lastName} {st.user?.firstName} — {st.faculty}
                    </option>
                  ))}
                </select>
              </div>

              <div style={s.sectionTitle}>Manzil</div>
              <div style={s.formGrid}>
                <div>
                  <label style={s.label}>Viloyat *</label>
                  <input value={form.region} onChange={e => f('region', e.target.value)} placeholder="Masalan: Toshkent" style={s.input} />
                </div>
                <div>
                  <label style={s.label}>Tuman *</label>
                  <input value={form.district} onChange={e => f('district', e.target.value)} placeholder="Masalan: Yunusobod" style={s.input} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={s.label}>To'liq manzil *</label>
                  <input value={form.address} onChange={e => f('address', e.target.value)} placeholder="Ko'cha, uy raqami..." style={s.input} />
                </div>
              </div>

              <div style={s.sectionTitle}>Uy egasi</div>
              <div style={s.formGrid}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={s.label}>Uy egasi F.I.O *</label>
                  <input value={form.ownerFullName} onChange={e => f('ownerFullName', e.target.value)} placeholder="To'liq ism sharif" style={s.input} />
                </div>
                <div>
                  <label style={s.label}>JSHSHIR</label>
                  <input value={form.ownerPinfl} onChange={e => f('ownerPinfl', e.target.value)} placeholder="14 raqam" maxLength={14} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>Telefon *</label>
                  <input value={form.ownerPhone} onChange={e => f('ownerPhone', e.target.value)} placeholder="+998..." style={s.input} />
                </div>
              </div>

              <div style={s.sectionTitle}>Shartnoma</div>
              <div style={s.formGrid}>
                <div>
                  <label style={s.label}>Shartnoma raqami</label>
                  <input value={form.contractNumber} onChange={e => f('contractNumber', e.target.value)} placeholder="Masalan: 2024-001" style={s.input} />
                </div>
                <div>
                  <label style={s.label}>Shartnoma sanasi</label>
                  <input type="date" value={form.contractDate} onChange={e => f('contractDate', e.target.value)} style={s.input} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={s.label}>Oylik ijara miqdori (so'm)</label>
                  <input type="number" value={form.monthlyRent} onChange={e => f('monthlyRent', e.target.value)} placeholder="Masalan: 1500000" style={s.input} />
                </div>
              </div>

              {formError && (
                <div style={{ padding: '10px 14px', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 8, color: '#c0392b', fontSize: 13, marginTop: 8 }}>
                  {formError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #eee' }}>
              <button onClick={() => setShowAddModal(false)} style={s.btnSecondary}>Bekor qilish</button>
              <button onClick={handleAdd} disabled={saving} style={s.btnPrimary}>
                {saving ? 'Saqlanmoqda...' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontWeight: 500, fontSize: 14 }}>{value}</div>
    </div>
  );
}

const s = {
  btnPrimary: { background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnSecondary: { background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  pageBtn: { background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  tableHead: { display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 1.5fr 1fr 1fr 1.2fr 0.8fr', padding: '12px 16px', background: '#f8f9fa', fontWeight: 600, fontSize: 13, color: '#555', borderBottom: '1px solid #eee' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 1.5fr 1fr 1fr 1.2fr 0.8fr', padding: '12px 16px', borderBottom: '1px solid #f5f5f5', fontSize: 14, alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8, paddingBottom: 4, borderBottom: '1px solid #eee' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
};
