import React, { useEffect, useState, useCallback, useRef } from 'react';
import { studentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ALL_TABS = [
  { key: 'DORMITORY', label: 'Yotoqxonada' },
  { key: 'RENTAL', label: 'Ijarada' },
  { key: 'COMMUTER', label: "Qatnab o'quvchilar" },
];

const EMPTY_FORM = {
  firstName: '', lastName: '', middleName: '', pinfl: '', dateOfBirth: '',
  gender: 'MALE', phone: '', parentPhone: '',
  faculty: '', direction: '', courseYear: '1',
  educationForm: 'Kunduzgi',
  housingType: 'COMMUTER', homeRegion: '', homeDistrict: '', homeAddress: '',
};

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export default function StudentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('DORMITORY');
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef(null);

  const canEdit = ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'].includes(user?.role);
  const TABS = user?.role === 'ADMIN' ? ALL_TABS.filter(t => t.key === 'DORMITORY') : ALL_TABS;

  const load = useCallback(() => {
    setLoading(true);
    studentApi.getAll({ page, limit: 15, search: search || undefined, housingType: activeTab })
      .then(({ data }) => {
        setStudents(data.data?.items || []);
        setTotal(data.data?.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, search, activeTab]);

  useEffect(() => { load(); }, [load]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch('');
  };

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, housingType: activeTab });
    setEditTarget(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (st) => {
    setForm({
      firstName: st.user?.firstName || '',
      lastName: st.user?.lastName || '',
      middleName: st.user?.middleName || '',
      pinfl: st.pinfl || '',
      dateOfBirth: st.dateOfBirth ? st.dateOfBirth.slice(0, 10) : '',
      gender: st.gender || 'MALE',
      phone: st.user?.phone || '',
      parentPhone: st.parentPhone || '',
      faculty: st.faculty || '',
      direction: st.direction || '',
      courseYear: String(st.courseYear || 1),
      educationForm: st.educationForm || 'Kunduzgi',
      housingType: st.housingType || activeTab,
      homeRegion: st.homeRegion || '',
      homeDistrict: st.homeDistrict || '',
      homeAddress: st.homeAddress || '',
    });
    setEditTarget(st);
    setPhotoFile(null);
    setPhotoPreview(st.photoUrl ? `${API_BASE.replace('/api/v1', '')}${st.photoUrl}` : null);
    setFormError('');
    setShowModal(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.direction?.trim()) {
      setFormError("Yo'nalish majburiy maydon");
      return;
    }
    setSaving(true); setFormError('');
    try {
      if (editTarget) {
        await studentApi.update(editTarget.id, form);
      } else {
        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v !== '') formData.append(k, v); });
        if (photoFile) formData.append('photo', photoFile);
        await studentApi.create(formData);
      }
      setShowModal(false);
      load();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Xato yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const totalPages = Math.ceil(total / 15);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Talabalar</h1>
          <p style={s.sub}>Jami: {total} ta talaba</p>
        </div>
        {canEdit && (
          <button onClick={openAdd} style={s.btnPrimary}>+ Talaba qo'shish</button>
        )}
      </div>

      {/* Tablar */}
      <div style={s.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            style={{ ...s.tab, ...(activeTab === tab.key ? s.tabActive : {}) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Qidiruv */}
      <div style={s.filters}>
        <input
          style={s.search}
          placeholder="Ism, familiya yoki PINFL..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Jadval */}
      <div style={s.card}>
        {loading ? (
          <div style={s.center}>Yuklanmoqda...</div>
        ) : students.length === 0 ? (
          <div style={s.center}>Talabalar topilmadi</div>
        ) : (
          <>
            <div style={s.tableHead}>
              <span>Rasm</span>
              <span>F.I.O</span>
              <span>PINFL</span>
              <span>Fakultet</span>
              <span>Yo'nalish</span>
              <span>Kurs</span>
              <span>Holat</span>
              {canEdit && <span>Amallar</span>}
            </div>
            {students.map(st => {
              const fullName = `${st.user?.lastName || ''} ${st.user?.firstName || ''}`.trim();
              const initials = `${(st.user?.lastName || '')[0] || ''}${(st.user?.firstName || '')[0] || ''}`.toUpperCase();
              const photoSrc = st.photoUrl ? `${API_BASE.replace('/api/v1', '')}${st.photoUrl}` : null;
              return (
                <div key={st.id} style={s.tableRow}>
                  <span>
                    {photoSrc ? (
                      <img src={photoSrc} alt={initials} style={s.avatar} />
                    ) : (
                      <div style={s.avatarInitials}>{initials}</div>
                    )}
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    {st.user?.lastName} {st.user?.firstName} {st.user?.middleName}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{st.pinfl}</span>
                  <span>{st.faculty}</span>
                  <span style={{ fontSize: 13, color: '#555' }}>{st.direction || '—'}</span>
                  <span>{st.courseYear}-kurs</span>
                  <span>
                    <span style={{ ...s.badge, background: st.status === 'STUDYING' ? '#e8f5e9' : '#fff3e0', color: st.status === 'STUDYING' ? '#2e7d32' : '#e65100' }}>
                      {st.status === 'STUDYING' ? "O'qiyapti" : st.status}
                    </span>
                  </span>
                  {canEdit && (
                    <span>
                      <button onClick={() => openEdit(st)} style={s.btnEdit}>Tahrirlash</button>
                    </span>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Sahifalash */}
      {totalPages > 1 && (
        <div style={s.pagination}>
          <button style={s.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Oldingi</button>
          <span style={{ color: '#555', fontSize: 14 }}>{page} / {totalPages}</span>
          <button style={s.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Keyingi</button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>{editTarget ? 'Talabani tahrirlash' : "Yangi talaba qo'shish"}</h2>
              <button onClick={() => setShowModal(false)} style={s.closeBtn}>X</button>
            </div>

            <div style={s.formGrid}>
              {/* RASM TEPADA */}
              <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 20, padding: '12px 0', borderBottom: '1px solid #f3f4f6', marginBottom: 8 }}>
                <div style={{ position: 'relative' }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #1e3a5f' }} />
                  ) : (
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#9ca3af' }}>👤</div>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Talaba rasmi</div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{ ...s.btnSecondary, fontSize: 13 }}>
                    📷 {photoPreview ? 'Rasmni almashtirish' : 'Rasm yuklash'}
                  </button>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>JPG, PNG. Maks 2MB</div>
                </div>
              </div>

              <Field label="Familiya *" value={form.lastName} onChange={v => f('lastName', v)} />
              <Field label="Ism *" value={form.firstName} onChange={v => f('firstName', v)} />
              <Field label="Otasining ismi" value={form.middleName} onChange={v => f('middleName', v)} />
              {!editTarget && <Field label="PINFL (ixtiyoriy)" value={form.pinfl} onChange={v => f('pinfl', v)} placeholder="14 ta raqam" />}
              <Field label="Tug'ilgan sana *" type="date" value={form.dateOfBirth} onChange={v => f('dateOfBirth', v)} />
              <SelectField label="Jinsi" value={form.gender} onChange={v => f('gender', v)}
                options={[['MALE', 'Erkak'], ['FEMALE', 'Ayol']]} />
              <Field label="Telefon" value={form.phone} onChange={v => f('phone', v)} placeholder="+998..." />
              <Field label="Ota-ona/vasiy telefon" value={form.parentPhone} onChange={v => f('parentPhone', v)} placeholder="+998..." />
              <Field label="Fakultet *" value={form.faculty} onChange={v => f('faculty', v)} />
              <Field label="Yo'nalish *" value={form.direction} onChange={v => f('direction', v)} placeholder="Yo'nalish nomi (majburiy)" required />
              <SelectField label="Kurs" value={form.courseYear} onChange={v => f('courseYear', v)}
                options={[['1','1-kurs'],['2','2-kurs'],['3','3-kurs'],['4','4-kurs'],['5','5-kurs'],['6','6-kurs'],['7','7-kurs']]} />
              <SelectField label="Ta'lim shakli" value={form.educationForm} onChange={v => f('educationForm', v)}
                options={[['Kunduzgi','Kunduzgi'],['Sirtqi','Sirtqi'],['Kechki','Kechki']]} />
              <SelectField label="Yashash turi" value={form.housingType} onChange={v => f('housingType', v)}
                options={[['DORMITORY','Yotoqxona'],['RENTAL','Ijara'],['COMMUTER',"Qatnab o'qish"]]} />
              <Field label="Viloyat" value={form.homeRegion} onChange={v => f('homeRegion', v)} />
              <Field label="Tuman" value={form.homeDistrict} onChange={v => f('homeDistrict', v)} />
              <Field label="Uy manzili" value={form.homeAddress} onChange={v => f('homeAddress', v)} span2 />
            </div>

            {formError && <div style={s.errorBox}>{formError}</div>}

            <div style={s.modalFooter}>
              <button onClick={() => setShowModal(false)} style={s.btnSecondary}>Bekor qilish</button>
              <button onClick={handleSave} disabled={saving} style={s.btnPrimary}>
                {saving ? 'Saqlanmoqda...' : (editTarget ? 'Saqlash' : "Qo'shish")}
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
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={s.input}
      />
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 700, color: '#1a3a6b', margin: '0 0 4px' },
  sub: { color: '#888', fontSize: 14, margin: 0 },
  tabs: { display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #eee' },
  tab: { padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#888', borderBottom: '2px solid transparent', marginBottom: -2 },
  tabActive: { color: '#1a3a6b', borderBottom: '2px solid #1a3a6b', fontWeight: 700 },
  filters: { display: 'flex', gap: 12, marginBottom: 16 },
  search: { flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' },
  card: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  center: { padding: 40, textAlign: 'center', color: '#888' },
  tableHead: { display: 'grid', gridTemplateColumns: '52px 2.5fr 1.4fr 1.4fr 1.2fr 0.8fr 1fr 0.8fr', padding: '12px 16px', background: '#f8f9fa', fontWeight: 600, fontSize: 13, color: '#555', borderBottom: '1px solid #eee' },
  tableRow: { display: 'grid', gridTemplateColumns: '52px 2.5fr 1.4fr 1.4fr 1.2fr 0.8fr 1fr 0.8fr', padding: '10px 16px', borderBottom: '1px solid #f5f5f5', fontSize: 14, alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' },
  avatarInitials: { width: 36, height: 36, borderRadius: '50%', background: '#1a3a6b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 },
  btnPrimary: { background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnSecondary: { background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnEdit: { background: '#e8f0fe', color: '#1a3a6b', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 },
  pageBtn: { background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fff', zIndex: 1 },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#1a3a6b', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888', padding: 4 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 24 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  errorBox: { margin: '0 24px 16px', padding: '10px 14px', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 8, color: '#c0392b', fontSize: 13 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #eee' },
};
