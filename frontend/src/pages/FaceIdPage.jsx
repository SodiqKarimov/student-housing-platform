import { useState, useEffect } from 'react';
import { faceIdApi, dormitoryApi } from '../services/api';

export default function FaceIdPage() {
  const [dormitories, setDormitories] = useState([]);
  const [selectedDorm, setSelectedDorm] = useState('');
  const [tab, setTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [absent, setAbsent] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ studentId: '', eventType: 'CHECKIN', cameraId: '', note: '' });

  useEffect(() => {
    dormitoryApi.getAll({ limit: 100 }).then(r => {
      const dorms = r.data.data?.items || r.data.data || [];
      setDormitories(dorms);
      if (dorms.length > 0) setSelectedDorm(dorms[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDorm) return;
    loadStats();
    if (tab === 'events') loadEvents();
    if (tab === 'absent') loadAbsent();
  }, [selectedDorm, tab, page]);

  const loadStats = async () => {
    try {
      const r = await faceIdApi.getStats();
      setStats(r.data.data);
    } catch {}
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const r = await faceIdApi.getEvents({ dormitoryId: selectedDorm, page, limit: 30 });
      setEvents(r.data.data?.items || []);
      setTotal(r.data.data?.total || 0);
    } catch { setEvents([]); }
    setLoading(false);
  };

  const loadAbsent = async () => {
    setLoading(true);
    try {
      const r = await faceIdApi.getAbsent({ dormitoryId: selectedDorm });
      setAbsent(r.data.data || []);
    } catch { setAbsent([]); }
    setLoading(false);
  };

  const handleAddEvent = async () => {
    try {
      await faceIdApi.addEvent({ ...addForm, dormitoryId: selectedDorm });
      setShowAdd(false);
      setAddForm({ studentId: '', eventType: 'CHECKIN', cameraId: '', note: '' });
      loadEvents();
      loadStats();
    } catch (e) { alert(e.response?.data?.message || 'Xato'); }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 24px' }}>Face ID tizimi</h1>

      {/* Dorm + stats */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
        <select
          value={selectedDorm}
          onChange={e => setSelectedDorm(e.target.value)}
          style={{ padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', minWidth: '220px' }}
        >
          {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        {stats && (
          <>
            {[
              { label: 'Bugun kirish', value: stats.todayIn, color: '#10b981' },
              { label: 'Bugun chiqish', value: stats.todayOut, color: '#3b82f6' },
              { label: 'Aniqlanmadi', value: stats.unrecognized, color: '#ef4444' },
              { label: 'Jami hodisalar', value: stats.total, color: '#6b7280' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: '10px', padding: '12px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</span>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>{s.label}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
        {[{ id: 'events', label: 'Hodisalar' }, { id: 'absent', label: "Ko'rinmagan talabalar" }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer', background: 'transparent',
              borderBottom: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
              color: tab === t.id ? '#3b82f6' : '#6b7280',
              fontWeight: tab === t.id ? 600 : 400, marginBottom: '-2px',
            }}>{t.label}</button>
        ))}
        <div style={{ marginLeft: 'auto', paddingBottom: '8px' }}>
          <button onClick={() => setShowAdd(true)}
            style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
            + Qo'lda kiritish
          </button>
        </div>
      </div>

      {/* Mock camera simulation panel */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '20px' }}>🎥</span>
        <div>
          <div style={{ fontWeight: 600, color: '#065f46', fontSize: '14px' }}>Mock kamera - sinov rejimi</div>
          <div style={{ color: '#047857', fontSize: '13px' }}>Real Face ID kamera o'rniga qo'lda hodisa kiritish orqali tizimni sinab ko'ring</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Yuklanmoqda...</div>
      ) : tab === 'absent' ? (
        absent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#10b981', fontWeight: 500 }}>
            Barcha talabalar 24 soat ichida ko'ringan
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '16px', color: '#ef4444', fontWeight: 600 }}>
              {absent.length} ta talaba 24 soatdan ko'p vaqtdan beri ko'rinmagan
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {absent.map(a => (
                <div key={a.bookingId} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', gap: '16px', alignItems: 'center', borderLeft: '4px solid #ef4444' }}>
                  <div style={{ fontSize: '32px' }}>⚠️</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{a.student?.user?.lastName} {a.student?.user?.firstName}</div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>{a.dormitory?.name} • Tel: {a.student?.user?.phone || '—'}</div>
                    <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px' }}>Oxirgi ko'rinish: 24+ soat oldin</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Hodisalar topilmadi</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  {['Talaba', 'Yotoqxona', 'Hodisa', 'Aniqlik', 'Kamera', "Qo'lda", 'Vaqt'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                      {e.student ? `${e.student.user?.lastName} ${e.student.user?.firstName}` : <span style={{ color: '#ef4444' }}>Aniqlanmadi</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{e.dormitory?.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: e.eventType === 'CHECKIN' ? '#10b981' : e.eventType === 'CHECKOUT' ? '#3b82f6' : '#ef4444' }}>
                        {e.eventType === 'CHECKIN' ? '🟢 Kirish' : e.eventType === 'CHECKOUT' ? '🔵 Chiqish' : '🔴 Aniqlanmadi'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                      <span style={{ color: e.confidence > 0.9 ? '#10b981' : e.confidence > 0.7 ? '#f59e0b' : '#ef4444' }}>
                        {(e.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{e.cameraId || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{e.isManual ? <span style={{ color: '#f59e0b' }}>Ha</span> : 'Yo\'q'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{new Date(e.eventTime).toLocaleString('uz-UZ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 30 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              {Array.from({ length: Math.min(Math.ceil(total / 30), 10) }, (_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)}
                  style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: page === i + 1 ? '#3b82f6' : '#f3f4f6', color: page === i + 1 ? 'white' : '#374151' }}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Event Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '400px', maxWidth: '95vw' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>Face ID hodisasi kiritish</h2>
            {[
              { key: 'studentId', label: 'Talaba ID (ixtiyoriy)', type: 'text', placeholder: 'Talaba ID...' },
              { key: 'cameraId', label: 'Kamera ID (ixtiyoriy)', type: 'text', placeholder: 'Cam-01...' },
              { key: 'note', label: 'Izoh', type: 'text', placeholder: 'Izoh...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>{f.label}</label>
                <input type={f.type} value={addForm[f.key]} placeholder={f.placeholder}
                  onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Hodisa turi</label>
              <select value={addForm.eventType} onChange={e => setAddForm(p => ({ ...p, eventType: e.target.value }))}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                <option value="CHECKIN">Kirish</option>
                <option value="CHECKOUT">Chiqish</option>
                <option value="UNRECOGNIZED">Aniqlanmadi</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleAddEvent} style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Saqlash</button>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Bekor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
