import { useState, useEffect } from 'react';
import { recommendationApi, studentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const RATING_LABELS = { 1: 'Juda yomon', 2: 'Yomon', 3: "O'rtacha", 4: 'Yaxshi', 5: 'A\'lo' };
const RATING_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#10b981', 5: '#3b82f6' };

function Stars({ rating }) {
  return (
    <span>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ color: n <= rating ? RATING_COLORS[rating] : '#d1d5db', fontSize: '16px' }}>★</span>
      ))}
    </span>
  );
}

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [recs, setRecs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ studentId: '', behavior: '', activity: '', discipline: '', comment: '', rating: 3 });
  const [students, setStudents] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await recommendationApi.getAll({ page, limit: 20 });
      setRecs(r.data.data?.items || []);
      setTotal(r.data.data?.total || 0);
    } catch { setRecs([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  useEffect(() => {
    if (showModal) {
      studentApi.getAll({ limit: 200 }).then(r => setStudents(r.data.data?.items || [])).catch(() => {});
    }
  }, [showModal]);

  const openCreate = () => {
    setEditing(null);
    setForm({ studentId: '', behavior: '', activity: '', discipline: '', comment: '', rating: 3 });
    setShowModal(true);
  };

  const openEdit = (rec) => {
    setEditing(rec);
    setForm({ studentId: rec.studentId, behavior: rec.behavior, activity: rec.activity, discipline: rec.discipline, comment: rec.comment || '', rating: rec.rating });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await recommendationApi.update(editing.id, form);
      } else {
        await recommendationApi.create(form);
      }
      setShowModal(false);
      load();
    } catch (e) { alert(e.response?.data?.message || 'Xato'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tavsiyanomani o\'chirmoqchimisiz?')) return;
    try {
      await recommendationApi.remove(id);
      load();
    } catch (e) { alert(e.response?.data?.message || 'Xato'); }
  };

  const canEdit = (rec) => rec.authorId === user?.id || user?.role === 'SUPER_ADMIN';

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Tavsiyanomalar</h1>
        <button onClick={openCreate}
          style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          + Yangi tavsiyanoma
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Yuklanmoqda...</div>
      ) : recs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Tavsiyanomalar topilmadi</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {recs.map(r => (
            <div key={r.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${RATING_COLORS[r.rating] || '#6b7280'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>
                    {r.student?.user?.lastName} {r.student?.user?.firstName}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>
                    Muallif: {r.author?.lastName} {r.author?.firstName} ({r.author?.role})
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Stars rating={r.rating} />
                  <span style={{ fontSize: '13px', color: RATING_COLORS[r.rating], fontWeight: 600 }}>{RATING_LABELS[r.rating]}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: r.comment ? '12px' : '0' }}>
                {[
                  { label: 'Xulq-atvor', value: r.behavior },
                  { label: 'Faollik', value: r.activity },
                  { label: 'Intizom', value: r.discipline },
                ].map(f => (
                  <div key={f.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{f.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{f.value}</div>
                  </div>
                ))}
              </div>

              {r.comment && (
                <div style={{ background: '#fef9c3', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#854d0e' }}>{r.comment}</div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {new Date(r.createdAt).toLocaleDateString('uz-UZ')}
                </span>
                {canEdit(r) && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(r)}
                      style={{ padding: '6px 12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      Tahrirlash
                    </button>
                    <button onClick={() => handleDelete(r.id)}
                      style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      O'chirish
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => (
            <button key={i + 1} onClick={() => setPage(i + 1)}
              style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: page === i + 1 ? '#3b82f6' : '#f3f4f6', color: page === i + 1 ? 'white' : '#374151' }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '560px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 700 }}>
              {editing ? 'Tavsiyanomani tahrirlash' : 'Yangi tavsiyanoma'}
            </h2>

            {!editing && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Talaba</label>
                <select value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                  <option value="">Talabani tanlang...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.user?.lastName} {s.user?.firstName} — {s.faculty}</option>)}
                </select>
              </div>
            )}

            {[
              { key: 'behavior', label: 'Xulq-atvor', placeholder: 'Talabaning xulq-atvorini tavsiflang...' },
              { key: 'activity', label: 'Faollik', placeholder: 'Ijtimoiy va o\'quv faolligini tavsiflang...' },
              { key: 'discipline', label: 'Intizom', placeholder: 'Intizom darajasini tavsiflang...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>{f.label}</label>
                <textarea value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} rows={2}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            ))}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Qo'shimcha izoh</label>
              <textarea value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                placeholder="Ixtiyoriy izoh..." rows={2}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Umumiy baho: {RATING_LABELS[form.rating]}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setForm(p => ({ ...p, rating: n }))}
                    style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: form.rating === n ? RATING_COLORS[n] : '#f3f4f6', color: form.rating === n ? 'white' : '#374151', fontWeight: form.rating === n ? 600 : 400 }}>
                    {n} ★
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleSave}
                style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Saqlash
              </button>
              <button onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Bekor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
