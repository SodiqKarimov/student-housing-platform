import { useState, useEffect } from 'react';
import { reportsApi, dormitoryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const SEL = { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: 'white' };
const COURSES = [1, 2, 3, 4, 5, 6];

export default function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState({});
  const [dormitories, setDormitories] = useState([]);

  // Har bir hisobot uchun mustaqil filter holatlari
  const [sf, setSf] = useState({ housingType: '', dormId: '', course: '' });
  const [dorf, setDorf] = useState({ dormId: '', floor: '', direction: '' });
  const [rf, setRf] = useState({ course: '', faculty: '', direction: '' });
  const [vf, setVf] = useState({ dormId: '', course: '', direction: '' });
  const [ff, setFf] = useState({ dormId: '', course: '' });
  const [auditFrom, setAuditFrom] = useState('');
  const [auditTo, setAuditTo] = useState('');

  useEffect(() => {
    dormitoryApi.getAll({ limit: 50 })
      .then(({ data }) => setDormitories(data.data?.items || []))
      .catch(() => {});
  }, []);

  const download = async (key, apiFn, filename) => {
    setLoading(p => ({ ...p, [key]: true }));
    try {
      const res = await apiFn();
      downloadBlob(res.data, filename);
    } catch {
      alert('Hisobot yuklab olishda xato');
    }
    setLoading(p => ({ ...p, [key]: false }));
  };

  const DormSel = ({ val, onChange }) => (
    <select value={val} onChange={e => onChange(e.target.value)} style={SEL}>
      <option value="">Barcha yotoqxonalar</option>
      {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
    </select>
  );

  const CourseSel = ({ val, onChange }) => (
    <select value={val} onChange={e => onChange(e.target.value)} style={SEL}>
      <option value="">Barcha kurslar</option>
      {COURSES.map(c => <option key={c} value={c}>{c}-kurs</option>)}
    </select>
  );

  const Txt = ({ val, onChange, ph }) => (
    <input value={val} onChange={e => onChange(e.target.value)} placeholder={ph}
      style={{ ...SEL, minWidth: 120 }} />
  );

  const reports = [
    {
      key: 'students',
      title: "Talabalar ro'yxati",
      desc: "Yotoqxona, ijara, qatnab o'quvchilar — yo'nalish va kurs kesimida",
      icon: '🎓',
      color: '#3b82f6',
      onDownload: () => download('students', () => reportsApi.students({
        housingType: sf.housingType || undefined,
        dormitoryId: sf.dormId || undefined,
        courseYear: sf.course || undefined,
      }), `talabalar_${today()}.xlsx`),
      extra: (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={sf.housingType} onChange={e => setSf(p => ({ ...p, housingType: e.target.value }))} style={SEL}>
            <option value="">Barcha tur</option>
            <option value="DORMITORY">Yotoqxona</option>
            <option value="RENTAL">Ijara</option>
            <option value="COMMUTER">Uyidan qatnab</option>
          </select>
          <DormSel val={sf.dormId} onChange={v => setSf(p => ({ ...p, dormId: v }))} />
          <CourseSel val={sf.course} onChange={v => setSf(p => ({ ...p, course: v }))} />
        </div>
      ),
    },
    {
      key: 'dormitories',
      title: 'Yotoqxona statistikasi',
      desc: "Har bir yotoqxona va uning qavatlari bo'yicha xona, sig'im, bandlik",
      icon: '🏢',
      color: '#10b981',
      onDownload: () => download('dormitories', () => reportsApi.dormitories({
        dormitoryId: dorf.dormId || undefined,
        floor: dorf.floor || undefined,
        direction: dorf.direction || undefined,
      }), `yotoqxonalar_${today()}.xlsx`),
      extra: (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <DormSel val={dorf.dormId} onChange={v => setDorf(p => ({ ...p, dormId: v }))} />
          <select value={dorf.floor} onChange={e => setDorf(p => ({ ...p, floor: e.target.value }))} style={SEL}>
            <option value="">Barcha qavatlar</option>
            {[1,2,3,4,5,6,7,8,9,10].map(f => <option key={f} value={f}>{f}-qavat</option>)}
          </select>
          <Txt val={dorf.direction} onChange={v => setDorf(p => ({ ...p, direction: v }))} ph="Yo'nalish..." />
        </div>
      ),
    },
    {
      key: 'rentals',
      title: "Ijara ro'yxati",
      desc: "Ijarada yashovchi talabalar — fakultet, yo'nalish va kurs kesimida",
      icon: '🏠',
      color: '#f59e0b',
      onDownload: () => download('rentals', () => reportsApi.rentals({
        courseYear: rf.course || undefined,
        faculty: rf.faculty || undefined,
        direction: rf.direction || undefined,
      }), `ijara_${today()}.xlsx`),
      extra: (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <CourseSel val={rf.course} onChange={v => setRf(p => ({ ...p, course: v }))} />
          <Txt val={rf.faculty} onChange={v => setRf(p => ({ ...p, faculty: v }))} ph="Fakultet..." />
          <Txt val={rf.direction} onChange={v => setRf(p => ({ ...p, direction: v }))} ph="Yo'nalish..." />
        </div>
      ),
    },
    {
      key: 'violations',
      title: 'Qoidabuzarliklar',
      desc: "Yashil rejim qoidabuzarliklari — yotoqxona, yo'nalish va kurs kesimida",
      icon: '⚠️',
      color: '#ef4444',
      onDownload: () => download('violations', () => reportsApi.violations({
        dormitoryId: vf.dormId || undefined,
        courseYear: vf.course || undefined,
        direction: vf.direction || undefined,
      }), `qoidabuzarliklar_${today()}.xlsx`),
      extra: (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <DormSel val={vf.dormId} onChange={v => setVf(p => ({ ...p, dormId: v }))} />
          <CourseSel val={vf.course} onChange={v => setVf(p => ({ ...p, course: v }))} />
          <Txt val={vf.direction} onChange={v => setVf(p => ({ ...p, direction: v }))} ph="Yo'nalish..." />
        </div>
      ),
    },
    {
      key: 'faceid',
      title: 'Face ID hodisalari',
      desc: "Kirish/chiqish hodisalari ro'yxati — yotoqxona va kurs kesimida",
      icon: '🎥',
      color: '#8b5cf6',
      onDownload: () => download('faceid', () => reportsApi.faceId({
        dormitoryId: ff.dormId || undefined,
        courseYear: ff.course || undefined,
      }), `faceid_${today()}.xlsx`),
      extra: (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <DormSel val={ff.dormId} onChange={v => setFf(p => ({ ...p, dormId: v }))} />
          <CourseSel val={ff.course} onChange={v => setFf(p => ({ ...p, course: v }))} />
        </div>
      ),
    },
  ];

  if (user?.role === 'SUPER_ADMIN') {
    reports.push({
      key: 'audit',
      title: 'Amallar tarixi (Audit log)',
      desc: 'Tizimda bajarilgan barcha amallar va foydalanuvchilar faoliyati',
      icon: '📋',
      color: '#6b7280',
      onDownload: () => download('audit', () => reportsApi.audit({ from: auditFrom || undefined, to: auditTo || undefined }), `audit_${today()}.xlsx`),
      extra: (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="date" value={auditFrom} onChange={e => setAuditFrom(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
          <span style={{ color: '#6b7280', fontSize: '13px' }}>–</span>
          <input type="date" value={auditTo} onChange={e => setAuditTo(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
        </div>
      ),
    });
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px' }}>Hisobotlar</h1>
      <p style={{ color: '#6b7280', margin: '0 0 32px', fontSize: '14px' }}>
        Excel formatida hisobotlarni yuklab oling. Har bir bo'lim uchun alohida filtrlar ishlaydi.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {reports.map(r => (
          <div key={r.key} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: `4px solid ${r.color}` }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
              <span style={{ fontSize: '32px' }}>{r.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{r.title}</div>
                <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px', lineHeight: '1.4' }}>{r.desc}</div>
              </div>
            </div>
            {r.extra && <div style={{ marginBottom: '16px' }}>{r.extra}</div>}
            <button onClick={r.onDownload} disabled={loading[r.key]}
              style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
                cursor: loading[r.key] ? 'default' : 'pointer',
                background: loading[r.key] ? '#e5e7eb' : r.color,
                color: loading[r.key] ? '#9ca3af' : 'white',
                fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading[r.key] ? '⏳ Yuklanmoqda...' : '📥 Excel yuklab olish'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '40px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: '8px' }}>📌 Eslatma</div>
        <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#0369a1', fontSize: '14px', lineHeight: '1.8' }}>
          <li>Barcha hisobotlar .xlsx (Excel) formatida yuklab olinadi</li>
          <li>Har bir hisobot bo'limi uchun <strong>mustaqil filtrlar</strong> ishlaydi</li>
          <li>Ma'lumotlar O'RQ-547 shaxsiy ma'lumotlarni himoya qilish qonuniga muvofiq qayd etiladi</li>
          <li>Audit log faqat Super Admin uchun mavjud</li>
        </ul>
      </div>
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
