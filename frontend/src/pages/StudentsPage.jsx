import React, { useEffect, useState, useCallback } from 'react';
import { studentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const HOUSING_LABELS = { DORMITORY: 'Yotoqxona', RENTAL: 'Ijara', COMMUTER: 'Uyidan' };
const HOUSING_COLORS = { DORMITORY: '#1a3a6b', RENTAL: '#0d8f5c', COMMUTER: '#8f4d0d' };

const EMPTY_FORM = {
  firstName: '', lastName: '', middleName: '', pinfl: '', dateOfBirth: '',
  gender: 'MALE', phone: '', email: '',
  faculty: '', department: '', specialty: '', courseYear: '1',
  educationForm: 'Kunduzgi', educationBasis: 'Grant',
  housingType: 'COMMUTER', homeRegion: '', homeDistrict: '', homeAddress: '',
};

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterHousing, setFilterHousing] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canEdit = ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'].includes(user?.role);

  const load = useCallback(() => {
    setLoading(true);
    studentApi.getAll({ page, limit: 15, search: search || undefined, housingType: filterHousing || undefined })
      .then(({ data }) => {
        setStudents(data.data?.data || []);
        setTotal(data.data?.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, search, filterHousing]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditTarget(null); setError(''); setShowModal(true); };
  const openEdit = (s) => {
    setForm({
      firstName: s.user?.firstName || '', lastName: s.user?.lastName || '',
      middleName: s.user?.middleName || '', pinfl: s.pinfl || '',
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : '',
      gender: s.gender || 'MALE', phone: s.user?.phone || '', email: s.user?.email || '',
      faculty: s.faculty || '', department: s.department || '', specialty: s.specialty || '',
      courseYear: String(s.courseYear || 1), educationForm: s.educationForm || 'Kunduzgi',
      educationBasis: s.educationBasis || 'Grant', housingType: s.housingType || 'COMMUTER',
      homeRegion: s.homeRegion || '', homeDistrict: s.homeDistrict || '', homeAddress: s.homeAddress || '',
    });
    setEditTarget(s);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (editTarget) {
        await studentApi.update(editTarget.id, form);
      } else {
        await studentApi.create(form);
      }
      setShowModal(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Xato yuz berdi');
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

      {/* Filters */}
      <div style={s.filters}>
        <input
          style={s.search}
          placeholder="Ism, familiya yoki PINFL..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select style={s.select} value={filterHousing} onChange={e => { setFilterHousing(e.target.value); setPage(1); }}>
          <option value="">Barcha yashash holati</option>
          <option value="DORMITORY">Yotoqxona</option>
          <option value="RENTAL">Ijara</option>
          <option value="COMMUTER">Uyidan qatnab</option>
        </select>
      </div>

      {/* Table */}
      <div style={s.card}>
        {loading ? (
          <div style={s.center}>Yuklanmoqda...</div>
        ) : students.length === 0 ? (
          <div style={s.center}>Talabalar topilmadi</div>
        ) : (
          <>
            <div style={s.tableHead}>
              <span>F.I.O</span><span>PINFL</span><span>Fakultet</span>
              <span>Kurs</span><span>Yashash holati</span><span>Holat</span>
              {canEdit && <span>Amallar</span>}
            </div>
            {students.map(st => (
              <div key={st.id} style={s.tableRow}>
                <span style={{ fontWeight: 500 }}>
                  {st.user?.lastName} {st.user?.firstName} {st.user?.middleName}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{st.pinfl}</span>
                <span>{st.faculty}</span>
                <span>{st.courseYear}-kurs</span>
                <span>
                  <span style={{ ...s.badge, background: HOUSING_COLORS[st.housingType] + '20', color: HOUSING_COLORS[st.housingType] }}>
                    {HOUSING_LABELS[st.housingType] || st.housingType}
                  </span>
                </span>
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
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={s.pagination}>
          <button style={s.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Oldingi</button>
          <span style={{ color: '#555', fontSize: 14 }}>{page} / {totalPages}</span>
          <button style={s.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Keyingi →</button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>{editTarget ? "Talabani tahrirlash" : "Yangi talaba qo'shish"}</h2>
              <button onClick={() => setShowModal(false)} style={s.closeBtn}>✕</button>
            </div>

            <div style={s.formGrid}>
              <Field label="Familiya *" value={form.lastName} onChange={v => f('lastName', v)} />
              <Field label="Ism *" value={form.firstName} onChange={v => f('firstName', v)} />
              <Field label="Otasining ismi" value={form.middleName} onChange={v => f('middleName', v)} />
              {!editTarget && <Field label="PINFL *" value={form.pinfl} onChange={v => f('pinfl', v)} placeholder="14 raqam" />}
              <Field label="Tug'ilgan sana *" type="date" value={form.dateOfBirth} onChange={v => f('dateOfBirth', v)} />
              <SelectField label="Jinsi" value={form.gender} onChange={v => f('gender', v)}
                options={[['MALE', 'Erkak'], ['FEMALE', 'Ayol']]} />
              <Field label="Telefon" value={form.phone} onChange={v => f('phone', v)} placeholder="+998..." />
              {!editTarget && <Field label="Email" value={form.email} onChange={v => f('email', v)} placeholder="ixtiyoriy" />}
              <Field label="Fakultet *" value={form.faculty} onChange={v => f('faculty', v)} />
              <Field label="Kafedra" value={form.department} onChange={v => f('department', v)} />
              <Field label="Mutaxassislik" value={form.specialty} onChange={v => f('specialty', v)} />
              <SelectField label="Kurs" value={form.courseYear} onChange={v => f('courseYear', v)}
                options={[['1','1-kurs'],['2','2-kurs'],['3','3-kurs'],['4','4-kurs'],['5','5-kurs'],['6','6-kurs']]} />
              <SelectField label="Ta'lim shakli" value={form.educationForm} onChange={v => f('educationForm', v)}
                options={[['Kunduzgi','Kunduzgi'],['Sirtqi','Sirtqi'],['Kechki','Kechki']]} />
              <SelectField label="Ta'lim asosi" value={form.educationBasis} onChange={v => f('educationBasis', v)}
                options={[['Grant','Grant'],['Kontrakt','Kontrakt']]} />
              <SelectField label="Yashash holati" value={form.housingType} onChange={v => f('housingType', v)}
                options={[['COMMUTER','Uyidan qatnab'],['DORMITORY','Yotoqxona'],['RENTAL','Ijara']]} />
              <Field label="Viloyat" value={form.homeRegion} onChange={v => f('homeRegion', v)} />
              <Field label="Tuman" value={form.homeDistrict} onChange={v => f('homeDistrict', v)} />
              <Field label="Manzil" value={form.homeAddress} onChange={v => f('homeAddress', v)} span2 />
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, color: '#1a3a6b', margin: '0 0 4px' },
  sub: { color: '#888', fontSize: 14, margin: 0 },
  filters: { display: 'flex', gap: 12, marginBottom: 16 },
  search: { flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' },
  select: { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, background: '#fff', minWidth: 180 },
  card: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  center: { padding: 40, textAlign: 'center', color: '#888' },
  tableHead: { display: 'grid', gridTemplateColumns: '2.5fr 1.5fr 1.5fr 0.8fr 1.2fr 1fr 1fr', padding: '12px 16px', background: '#f8f9fa', fontWeight: 600, fontSize: 13, color: '#555', borderBottom: '1px solid #eee' },
  tableRow: { display: 'grid', gridTemplateColumns: '2.5fr 1.5fr 1.5fr 0.8fr 1.2fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid #f5f5f5', fontSize: 14, alignItems: 'center' },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 },
  btnPrimary: { background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnSecondary: { background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnEdit: { background: '#e8f0fe', color: '#1a3a6b', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 },
  pageBtn: { background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fff', zIndex: 1 },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#1a3a6b', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', padding: 4 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 24 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  errorBox: { margin: '0 24px 16px', padding: '10px 14px', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 8, color: '#c0392b', fontSize: 13 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #eee' },
};
