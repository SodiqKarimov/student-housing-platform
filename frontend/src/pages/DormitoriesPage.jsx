import React, { useEffect, useState, useCallback } from 'react';
import { dormitoryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMPTY_DORM = { name: '', address: '', region: '', totalRooms: '', totalCapacity: '', genderRestriction: '', phoneNumber: '', email: '' };
const EMPTY_ROOM = { roomNumber: '', floor: '1', type: 'DOUBLE', capacity: '2', pricePerMonth: '0' };
const ROOM_TYPE_LABELS = { SINGLE: 'Yakka', DOUBLE: 'Juft', TRIPLE: 'Uchlik', QUAD: "To'rtlik" };

export default function DormitoriesPage() {
  const { user } = useAuth();
  const [dorms, setDorms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showDormModal, setShowDormModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [dormForm, setDormForm] = useState(EMPTY_DORM);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canAddRoom = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role);

  const loadDorms = useCallback(() => {
    setLoading(true);
    dormitoryApi.getAll({ limit: 50 })
      .then(({ data }) => setDorms(data.data?.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDorms(); }, [loadDorms]);

  const selectDorm = (dorm) => {
    setSelected(dorm);
    setLoadingRooms(true);
    dormitoryApi.getRooms(dorm.id)
      .then(({ data }) => setRooms(data.data || []))
      .finally(() => setLoadingRooms(false));
  };

  const saveDorm = async () => {
    setSaving(true); setError('');
    try {
      await dormitoryApi.create({
        ...dormForm,
        totalRooms: parseInt(dormForm.totalRooms),
        totalCapacity: parseInt(dormForm.totalCapacity),
        genderRestriction: dormForm.genderRestriction || null,
      });
      setShowDormModal(false);
      loadDorms();
    } catch (e) {
      setError(e.response?.data?.message || 'Xato yuz berdi');
    } finally { setSaving(false); }
  };

  const saveRoom = async () => {
    setSaving(true); setError('');
    try {
      await dormitoryApi.createRoom(selected.id, {
        ...roomForm,
        floor: parseInt(roomForm.floor),
        capacity: parseInt(roomForm.capacity),
        pricePerMonth: parseFloat(roomForm.pricePerMonth),
      });
      setShowRoomModal(false);
      selectDorm(selected);
    } catch (e) {
      setError(e.response?.data?.message || 'Xato yuz berdi');
    } finally { setSaving(false); }
  };

  const df = (k, v) => setDormForm(p => ({ ...p, [k]: v }));
  const rf = (k, v) => setRoomForm(p => ({ ...p, [k]: v }));

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Yotoqxonalar</h1>
          <p style={s.sub}>{dorms.length} ta yotoqxona</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => { setDormForm(EMPTY_DORM); setError(''); setShowDormModal(true); }} style={s.btnPrimary}>
            + Yotoqxona qo'shish
          </button>
        )}
      </div>

      <div style={s.layout}>
        {/* Yotoqxonalar ro'yxati */}
        <div style={s.leftPanel}>
          {loading ? (
            <div style={s.center}>Yuklanmoqda...</div>
          ) : dorms.length === 0 ? (
            <div style={s.center}>Yotoqxonalar topilmadi</div>
          ) : (
            dorms.map(d => (
              <div
                key={d.id}
                onClick={() => selectDorm(d)}
                style={{ ...s.dormCard, ...(selected?.id === d.id ? s.dormCardActive : {}) }}
              >
                <div style={s.dormName}>{d.name}</div>
                <div style={s.dormInfo}>{d.address}, {d.region}</div>
                <div style={s.dormStats}>
                  <span style={s.statChip}>{d.currentOccupancy}/{d.totalCapacity} joy</span>
                  <span style={{ ...s.statChip, background: d.genderRestriction === 'MALE' ? '#e3f2fd' : d.genderRestriction === 'FEMALE' ? '#fce4ec' : '#f5f5f5' }}>
                    {d.genderRestriction === 'MALE' ? 'Erkaklar' : d.genderRestriction === 'FEMALE' ? 'Ayollar' : 'Aralash'}
                  </span>
                </div>
                <div style={s.occupancyBar}>
                  <div style={{ ...s.occupancyFill, width: `${d.totalCapacity > 0 ? (d.currentOccupancy / d.totalCapacity) * 100 : 0}%` }} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Xonalar */}
        <div style={s.rightPanel}>
          {!selected ? (
            <div style={s.emptyState}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
              <p style={{ color: '#888' }}>Xonalarni ko'rish uchun yotoqxonani tanlang</p>
            </div>
          ) : (
            <>
              <div style={s.roomsHeader}>
                <div>
                  <h2 style={s.roomsTitle}>{selected.name} — Xonalar</h2>
                  <p style={s.roomsSub}>{rooms.length} ta xona</p>
                </div>
                {canAddRoom && (
                  <button onClick={() => { setRoomForm(EMPTY_ROOM); setError(''); setShowRoomModal(true); }} style={s.btnPrimary}>
                    + Xona qo'shish
                  </button>
                )}
              </div>

              {loadingRooms ? (
                <div style={s.center}>Yuklanmoqda...</div>
              ) : rooms.length === 0 ? (
                <div style={s.center}>Xonalar topilmadi</div>
              ) : (
                <div style={s.roomsGrid}>
                  {rooms.map(r => (
                    <div key={r.id} style={{ ...s.roomCard, borderLeft: `4px solid ${r.status === 'AVAILABLE' ? '#0d8f5c' : r.status === 'FULL' ? '#c0392b' : '#999'}` }}>
                      <div style={s.roomNumber}>{r.roomNumber}-xona</div>
                      <div style={s.roomDetail}>{r.floor}-qavat • {ROOM_TYPE_LABELS[r.type] || r.type}</div>
                      <div style={s.roomOccupancy}>
                        <span style={{ color: r.currentCount >= r.capacity ? '#c0392b' : '#0d8f5c', fontWeight: 600 }}>
                          {r.currentCount}/{r.capacity}
                        </span>
                        <span style={{ color: '#888', fontSize: 12 }}> joy band</span>
                      </div>
                      {r.pricePerMonth > 0 && (
                        <div style={s.roomPrice}>{r.pricePerMonth.toLocaleString()} so'm/oy</div>
                      )}
                      <span style={{ ...s.badge, background: r.status === 'AVAILABLE' ? '#e8f5e9' : r.status === 'FULL' ? '#ffebee' : '#f5f5f5', color: r.status === 'AVAILABLE' ? '#2e7d32' : r.status === 'FULL' ? '#c62828' : '#666' }}>
                        {r.status === 'AVAILABLE' ? 'Bo\'sh joy bor' : r.status === 'FULL' ? 'To\'liq band' : r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Yotoqxona modal */}
      {showDormModal && (
        <div style={s.overlay} onClick={() => setShowDormModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>Yangi yotoqxona qo'shish</h2>
              <button onClick={() => setShowDormModal(false)} style={s.closeBtn}>✕</button>
            </div>
            <div style={s.formGrid}>
              <Field label="Yotoqxona nomi *" value={dormForm.name} onChange={v => df('name', v)} span2 />
              <Field label="Manzil *" value={dormForm.address} onChange={v => df('address', v)} span2 />
              <Field label="Viloyat *" value={dormForm.region} onChange={v => df('region', v)} />
              <SelectField label="Jinsi cheklovi" value={dormForm.genderRestriction} onChange={v => df('genderRestriction', v)}
                options={[['', 'Cheklov yo\'q'], ['MALE', 'Faqat erkaklar'], ['FEMALE', 'Faqat ayollar']]} />
              <Field label="Jami xonalar soni *" type="number" value={dormForm.totalRooms} onChange={v => df('totalRooms', v)} />
              <Field label="Jami sig'im (o'rin) *" type="number" value={dormForm.totalCapacity} onChange={v => df('totalCapacity', v)} />
              <Field label="Telefon" value={dormForm.phoneNumber} onChange={v => df('phoneNumber', v)} placeholder="+998..." />
              <Field label="Email" value={dormForm.email} onChange={v => df('email', v)} />
            </div>
            {error && <div style={s.errorBox}>{error}</div>}
            <div style={s.modalFooter}>
              <button onClick={() => setShowDormModal(false)} style={s.btnSecondary}>Bekor qilish</button>
              <button onClick={saveDorm} disabled={saving} style={s.btnPrimary}>
                {saving ? 'Saqlanmoqda...' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Xona modal */}
      {showRoomModal && (
        <div style={s.overlay} onClick={() => setShowRoomModal(false)}>
          <div style={{ ...s.modal, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>{selected?.name} — Xona qo'shish</h2>
              <button onClick={() => setShowRoomModal(false)} style={s.closeBtn}>✕</button>
            </div>
            <div style={s.formGrid}>
              <Field label="Xona raqami *" value={roomForm.roomNumber} onChange={v => rf('roomNumber', v)} placeholder="Masalan: 101" />
              <Field label="Qavat *" type="number" value={roomForm.floor} onChange={v => rf('floor', v)} />
              <SelectField label="Xona turi" value={roomForm.type} onChange={v => rf('type', v)}
                options={[['SINGLE','Yakka (1)'],['DOUBLE','Juft (2)'],['TRIPLE','Uchlik (3)'],['QUAD',"To'rtlik (4)"]]} />
              <Field label="Sig'im (o'rin soni) *" type="number" value={roomForm.capacity} onChange={v => rf('capacity', v)} />
              <Field label="Narxi (so'm/oy)" type="number" value={roomForm.pricePerMonth} onChange={v => rf('pricePerMonth', v)} span2 />
            </div>
            {error && <div style={s.errorBox}>{error}</div>}
            <div style={s.modalFooter}>
              <button onClick={() => setShowRoomModal(false)} style={s.btnSecondary}>Bekor qilish</button>
              <button onClick={saveRoom} disabled={saving} style={s.btnPrimary}>
                {saving ? 'Saqlanmoqda...' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, span2 }) {
  return (
    <div style={{ gridColumn: span2 ? 'span 2' : 'span 1' }}>
      <label style={s.label}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={s.input} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={s.input}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

const s = {
  page: { padding: 24, maxWidth: 1400, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, color: '#1a3a6b', margin: '0 0 4px' },
  sub: { color: '#888', fontSize: 14, margin: 0 },
  layout: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 },
  leftPanel: { display: 'flex', flexDirection: 'column', gap: 12 },
  rightPanel: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minHeight: 300 },
  center: { padding: 40, textAlign: 'center', color: '#888' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40 },
  dormCard: { background: '#fff', borderRadius: 10, padding: 16, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '2px solid transparent', transition: 'all 0.15s' },
  dormCardActive: { border: '2px solid #1a3a6b', boxShadow: '0 4px 12px rgba(26,58,107,0.2)' },
  dormName: { fontWeight: 700, color: '#1a3a6b', fontSize: 15, marginBottom: 4 },
  dormInfo: { fontSize: 13, color: '#888', marginBottom: 8 },
  dormStats: { display: 'flex', gap: 8, marginBottom: 8 },
  statChip: { fontSize: 12, background: '#f0f0f0', color: '#555', padding: '2px 8px', borderRadius: 20 },
  occupancyBar: { height: 4, background: '#f0f0f0', borderRadius: 999 },
  occupancyFill: { height: '100%', background: '#1a3a6b', borderRadius: 999 },
  roomsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottom: '1px solid #eee' },
  roomsTitle: { fontSize: 18, fontWeight: 700, color: '#1a3a6b', margin: '0 0 4px' },
  roomsSub: { color: '#888', fontSize: 13, margin: 0 },
  roomsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, padding: 20 },
  roomCard: { background: '#fafafa', borderRadius: 8, padding: 14, border: '1px solid #eee' },
  roomNumber: { fontWeight: 700, color: '#1a3a6b', fontSize: 15, marginBottom: 4 },
  roomDetail: { fontSize: 12, color: '#888', marginBottom: 8 },
  roomOccupancy: { fontSize: 14, marginBottom: 4 },
  roomPrice: { fontSize: 12, color: '#666', marginBottom: 8 },
  badge: { padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 },
  btnPrimary: { background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnSecondary: { background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fff', zIndex: 1 },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#1a3a6b', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', padding: 4 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 24 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  errorBox: { margin: '0 24px 16px', padding: '10px 14px', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 8, color: '#c0392b', fontSize: 13 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #eee' },
};
