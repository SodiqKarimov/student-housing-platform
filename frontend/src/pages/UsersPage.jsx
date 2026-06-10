import React, { useEffect, useState, useCallback } from 'react';
import { userApi, dormitoryApi } from '../services/api';

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Administrator',
  ADMIN: "Yotoqxona boshlig'i",
  DEAN_OFFICE: 'Dekanat xodimi',
  DORMITORY_STAFF: 'Yotoqxona xodimi',
  STUDENT: 'Talaba',
};
const ROLE_COLORS = {
  SUPER_ADMIN: '#1a3a6b', ADMIN: '#0d8f5c', DEAN_OFFICE: '#6b1a6b',
  DORMITORY_STAFF: '#8f4d0d', STUDENT: '#555',
};

const EMPTY_FORM = { firstName: '', lastName: '', middleName: '', email: '', phone: '', role: 'DEAN_OFFICE', pinfl: '', dormitoryId: '' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdInfo, setCreatedInfo] = useState(null);
  const [dormitories, setDormitories] = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    userApi.getAll({ page, limit: 15, search: search || undefined, role: filterRole || undefined })
      .then(({ data }) => {
        setUsers(data.data?.items || []);
        setTotal(data.data?.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, search, filterRole]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setError('');
    setCreatedInfo(null);
    setShowModal(true);
    dormitoryApi.getAll({ limit: 100 })
      .then(({ data }) => setDormitories(data.data?.items || []))
      .catch(() => {});
  };
  const openEdit = (u) => {
    setForm({ firstName: u.firstName, lastName: u.lastName, middleName: u.middleName || '', email: u.email, phone: u.phone || '', role: u.role, pinfl: '' });
    setEditTarget(u); setError(''); setCreatedInfo(null); setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (editTarget) {
        await userApi.update(editTarget.id, form);
        setShowModal(false);
      } else {
        const { data } = await userApi.create(form);
        setCreatedInfo(data.data);
      }
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Xato yuz berdi');
    } finally { setSaving(false); }
  };

  const handleToggle = async (u) => {
    if (!window.confirm(`${u.firstName} ${u.lastName}ni ${u.status === 'ACTIVE' ? 'bloklaysizmi' : 'faollashtirasizmi'}?`)) return;
    try {
      await userApi.toggleStatus(u.id);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Xato yuz berdi');
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const totalPages = Math.ceil(total / 15);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Foydalanuvchilar boshqaruvi</h1>
          <p style={s.sub}>Jami: {total} ta foydalanuvchi</p>
        </div>
        <button onClick={openAdd} style={s.btnPrimary}>+ Xodim qo'shish</button>
      </div>

      <div style={s.filters}>
        <input style={s.search} placeholder="Ism, familiya yoki email..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select style={s.select} value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}>
          <option value="">Barcha rollar</option>
          <option value="ADMIN">Yotoqxona boshlig'i</option>
          <option value="DEAN_OFFICE">Dekanat xodimi</option>
          <option value="DORMITORY_STAFF">Yotoqxona xodimi</option>
          <option value="STUDENT">Talaba</option>
        </select>
      </div>

      <div style={s.card}>
        {loading ? <div style={s.center}>Yuklanmoqda...</div>
          : users.length === 0 ? <div style={s.center}>Foydalanuvchilar topilmadi</div>
          : (
            <>
              <div style={s.tableHead}>
                <span>F.I.O</span><span>Email</span><span>Rol</span>
                <span>Holat</span><span>Oxirgi kirish</span><span>Amallar</span>
              </div>
              {users.map(u => (
                <div key={u.id} style={s.tableRow}>
                  <span style={{ fontWeight: 500 }}>{u.lastName} {u.firstName} {u.middleName}</span>
                  <span style={{ fontSize: 13, color: '#555' }}>{u.email}</span>
                  <span>
                    <span style={{ ...s.badge, background: (ROLE_COLORS[u.role] || '#555') + '20', color: ROLE_COLORS[u.role] || '#555' }}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </span>
                  <span>
                    <span style={{ ...s.badge, background: u.status === 'ACTIVE' ? '#e8f5e9' : '#ffebee', color: u.status === 'ACTIVE' ? '#2e7d32' : '#c62828' }}>
                      {u.status === 'ACTIVE' ? 'Faol' : 'Bloklangan'}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, color: '#888' }}>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('uz-UZ') : 'Hali kirmagan'}
                  </span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    {u.role !== 'SUPER_ADMIN' && <>
                      <button onClick={() => openEdit(u)} style={s.btnEdit}>Tahrirlash</button>
                      <button onClick={() => handleToggle(u)} style={{ ...s.btnEdit, background: u.status === 'ACTIVE' ? '#fff0f0' : '#e8f5e9', color: u.status === 'ACTIVE' ? '#c0392b' : '#2e7d32' }}>
                        {u.status === 'ACTIVE' ? 'Bloklash' : 'Faollashtirish'}
                      </button>
                    </>}
                  </span>
                </div>
              ))}
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

      {showModal && (
        <div style={s.overlay} onClick={() => { if (!createdInfo) setShowModal(false); }}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>{editTarget ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}</h2>
              <button onClick={() => setShowModal(false)} style={s.closeBtn}>✕</button>
            </div>

            {createdInfo ? (
              <div style={{ padding: 24 }}>
                <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 10, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#2e7d32', marginBottom: 8 }}>Xodim muvaffaqiyatli yaratildi!</div>
                  <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>Ism:</b> {createdInfo.lastName} {createdInfo.firstName}</div>
                  <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>Email:</b> {createdInfo.email}</div>
                  <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>Rol:</b> {ROLE_LABELS[createdInfo.role]}</div>
                </div>
                <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#b07a00', marginBottom: 8 }}>Vaqtinchalik parol (bir marta ko'rinadi):</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#1a3a6b', letterSpacing: 2 }}>{createdInfo.tempPassword}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Iltimos, bu parolni xodimga xavfsiz yetkazing. Tizimga kirgach o'zgartirishi mumkin.</div>
                </div>
                <div style={s.modalFooter}>
                  <button onClick={() => setShowModal(false)} style={s.btnPrimary}>Yopish</button>
                </div>
              </div>
            ) : (
              <>
                <div style={s.formGrid}>
                  <Field label="Familiya *" value={form.lastName} onChange={v => f('lastName', v)} />
                  <Field label="Ism *" value={form.firstName} onChange={v => f('firstName', v)} />
                  <Field label="Otasining ismi" value={form.middleName} onChange={v => f('middleName', v)} />
                  <Field label="Email *" value={form.email} onChange={v => f('email', v)} />
                  <Field label="Telefon" value={form.phone} onChange={v => f('phone', v)} placeholder="+998..." />
                  <SelectField label="Rol *" value={form.role} onChange={v => f('role', v)}
                    options={[['ADMIN',"Yotoqxona boshlig'i"],['DEAN_OFFICE','Dekanat xodimi'],['DORMITORY_STAFF','Yotoqxona xodimi']]} />
                  <Field label="PINFL (ixtiyoriy)" value={form.pinfl} onChange={v => f('pinfl', v)} placeholder="14 raqam" />
                  {form.role === 'ADMIN' && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={s.label}>Yotoqxona tayinlash</label>
                      <select value={form.dormitoryId} onChange={e => f('dormitoryId', e.target.value)} style={s.input}>
                        <option value="">Yotoqxona tanlanmagan</option>
                        {dormitories.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {error && <div style={s.errorBox}>{error}</div>}
                <div style={s.modalFooter}>
                  <button onClick={() => setShowModal(false)} style={s.btnSecondary}>Bekor qilish</button>
                  <button onClick={handleSave} disabled={saving} style={s.btnPrimary}>
                    {saving ? 'Saqlanmoqda...' : (editTarget ? 'Saqlash' : "Yaratish")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
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
  page: { padding: 24, maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, color: '#1a3a6b', margin: '0 0 4px' },
  sub: { color: '#888', fontSize: 14, margin: 0 },
  filters: { display: 'flex', gap: 12, marginBottom: 16 },
  search: { flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' },
  select: { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, background: '#fff', minWidth: 180 },
  card: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  center: { padding: 40, textAlign: 'center', color: '#888' },
  tableHead: { display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1.2fr 1.5fr', padding: '12px 16px', background: '#f8f9fa', fontWeight: 600, fontSize: 13, color: '#555', borderBottom: '1px solid #eee' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1.2fr 1.5fr', padding: '12px 16px', borderBottom: '1px solid #f5f5f5', fontSize: 14, alignItems: 'center' },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 },
  btnPrimary: { background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnSecondary: { background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnEdit: { background: '#e8f0fe', color: '#1a3a6b', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 500 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 },
  pageBtn: { background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fff', zIndex: 1 },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#1a3a6b', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', padding: 4 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 24 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  errorBox: { margin: '0 24px 16px', padding: '10px 14px', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 8, color: '#c0392b', fontSize: 13 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #eee' },
};
