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

export default function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState({});
  const [auditFrom, setAuditFrom] = useState('');
  const [auditTo, setAuditTo] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [dormFilter, setDormFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [violDormFilter, setViolDormFilter] = useState('');
  const [dormitories, setDormitories] = useState([]);

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
    } catch (e) {
      alert(e.response ? 'Hisobot yuklab olishda xato' : 'Tarmoq xatosi');
    }
    setLoading(p => ({ ...p, [key]: false }));
  };

  const dormOptions = (
    <>
      <option value="">Barcha yotoqxonalar</option>
      {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
    </>
  );

  const courseOptions = (
    <>
      <option value="">Barcha kurslar</option>
      {[1,2,3,4,5,6].map(c => <option key={c} value={c}>{c}-kurs</option>)}
    </>
  );

  const reports = [
    {
      key: 'students',
      title: 'Talabalar ro\'yxati',
      desc: 'Yotoqxona, ijara, qatnab o\'quvchilar — yo\'nalish va kurs kesimida',
      icon: '🎓',
      color: '#3b82f6',
      onDownload: () => download('students', () => reportsApi.students({
        housingType: studentFilter || undefined,
        dormitoryId: dormFilter || undefined,
        courseYear: courseFilter || undefined,
      }), `talabalar_${today()}.xlsx`),
      extra: (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={studentFilter} onChange={e => setStudentFilter(e.target.value)} style={SEL}>
            <option value="">Barcha tur</option>
            <option value="DORMITORY">Yotoqxona</option>
            <option value="RENTAL">Ijara</option>
            <option value="COMMUTER">Uyidan qatnab</option>
          </select>
          <select value={dormFilter} onChange={e => setDormFilter(e.target.value)} style={SEL}>{dormOptions}</select>
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={SEL}>{courseOptions}</select>
        </div>
      ),
    },
    {
      key: 'dormitories',
      title: 'Yotoqxona statistikasi',
      desc: 'Har bir yotoqxona va uning qavatlari bo\'yicha xona, sig\'im, bandlik',
      icon: '🏢',
      color: '#10b981',
      onDownload: () => download('dormitories', () => reportsApi.dormitories({
        dormitoryId: dormFilter || undefined,
      }), `yotoqxonalar_${today()}.xlsx`),
      extra: (
        <select value={dormFilter} onChange={e => setDormFilter(e.target.value)} style={SEL}>{dormOptions}</select>
      ),
    },
    {
      key: 'rentals',
      title: 'Ijara ro\'yxati',
      desc: 'Ijarada yashovchi talabalar — yo\'nalish va kurs kesimida',
      icon: '🏠',
      color: '#f59e0b',
      onDownload: () => download('rentals', () => reportsApi.rentals({
        courseYear: courseFilter || undefined,
      }), `ijara_${today()}.xlsx`),
      extra: (
        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={SEL}>{courseOptions}</select>
      ),
    },
    {
      key: 'violations',
      title: 'Qoidabuzarliklar',
      desc: 'Yashil rejim qoidabuzarliklari — yotoqxona, yo\'nalish va kurs kesimida',
      icon: '⚠️',
      color: '#ef4444',
      onDownload: () => download('violations', () => reportsApi.violations({
        dormitoryId: violDormFilter || undefined,
        courseYear: courseFilter || undefined,
      }), `qoidabuzarliklar_${today()}.xlsx`),
      extra: (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={violDormFilter} onChange={e => setViolDormFilter(e.target.value)} style={SEL}>{dormOptions}</select>
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={SEL}>{courseOptions}</select>
        </div>
      ),
    },
    {
      key: 'faceid',
      title: 'Face ID hodisalari',
      desc: 'Kirish/chiqish hodisalari ro\'yxati — yotoqxona kesimida',
      icon: '🎥',
      color: '#8b5cf6',
      onDownload: () => download('faceid', () => reportsApi.faceId({
        dormitoryId: dormFilter || undefined,
      }), `faceid_${today()}.xlsx`),
      extra: (
        <select value={dormFilter} onChange={e => setDormFilter(e.target.value)} style={SEL}>{dormOptions}</select>
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
        Excel formatida hisobotlarni yuklab oling. Barcha hisobotlar O'RQ-547 standartlariga mos.
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

            <button
              onClick={r.onDownload}
              disabled={loading[r.key]}
              style={{
                width: '100%', padding: '12px', border: 'none', borderRadius: '8px', cursor: loading[r.key] ? 'default' : 'pointer',
                background: loading[r.key] ? '#e5e7eb' : r.color, color: loading[r.key] ? '#9ca3af' : 'white',
                fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {loading[r.key] ? (
                <>⏳ Yuklanmoqda...</>
              ) : (
                <>📥 Excel yuklab olish</>
              )}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '40px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: '8px' }}>📌 Eslatma</div>
        <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#0369a1', fontSize: '14px', lineHeight: '1.8' }}>
          <li>Barcha hisobotlar .xlsx (Excel) formatida yuklab olinadi</li>
          <li>Ma'lumotlar O'RQ-547 shaxsiy ma'lumotlarni himoya qilish qonuniga muvofiq audit logga qayd etiladi</li>
          <li>Audit log faqat Super Admin uchun mavjud</li>
          <li>Sana filtri faqat Audit log uchun ishlaydi</li>
        </ul>
      </div>
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
