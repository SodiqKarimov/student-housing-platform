import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '/api/v1';

const CATEGORIES = {
  SHIKOYAT: { label: 'Shikoyat', color: '#ef4444', icon: '⚠️' },
  TAKLIF: { label: 'Taklif', color: '#3b82f6', icon: '💡' },
  MUAMMO: { label: 'Texnik muammo', color: '#f59e0b', icon: '🔧' },
  BOSHQA: { label: 'Boshqa', color: '#6b7280', icon: '📋' },
};

const PRIORITIES = {
  URGENT: { label: 'Shoshilinch', color: '#ef4444' },
  YUQORI: { label: 'Yuqori', color: '#f59e0b' },
  ODDIY: { label: 'Oddiy', color: '#3b82f6' },
  PAST: { label: 'Past', color: '#6b7280' },
};

const STATUSES = {
  YANGI: { label: 'Yangi', color: '#3b82f6' },
  JARAYONDA: { label: 'Jarayonda', color: '#f59e0b' },
  BAJARILDI: { label: "Bajarildi", color: '#10b981' },
  YOPILDI: { label: 'Yopildi', color: '#6b7280' },
};

const CARD_STYLE = {
  background: '#fff', borderRadius: 12, padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6',
};

export default function IchkiArizalarPage() {
  const { getToken } = useAuth();
  const [arizalar, setArizalar] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', category: '' });
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'MUAMMO', priority: 'ODDIY', roomNumber: '', isAnonymous: false });
  const [creating, setCreating] = useState(false);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filter).filter(([, v]) => v)));
      const [aRes, sRes] = await Promise.all([
        fetch(`${API}/ichki-ariza?${params}`, { headers }),
        fetch(`${API}/ichki-ariza/stats`, { headers }),
      ]);
      const [aData, sData] = await Promise.all([aRes.json(), sRes.json()]);
      if (aData.success) setArizalar(aData.data);
      if (sData.success) setStats(sData.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`${API}/ichki-ariza`, { method: 'POST', headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setForm({ title: '', description: '', category: 'MUAMMO', priority: 'ODDIY', roomNumber: '', isAnonymous: false });
        fetchAll();
      }
    } catch { /* ignore */ } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (id, status) => {
    await fetch(`${API}/ichki-ariza/${id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status }) });
    fetchAll();
    setSelected(null);
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Ichki Murojaatlar</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Yotoqxona ichidagi shikoyat va murojaatlar</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: '#1e3a5f', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14,
        }}>
          + Yangi murojaat
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Jami', value: stats.total || 0, color: '#6b7280', icon: '📋' },
          { label: 'Yangi', value: stats.yangi || 0, color: '#3b82f6', icon: '🆕' },
          { label: 'Jarayonda', value: stats.jarayonda || 0, color: '#f59e0b', icon: '⏳' },
          { label: 'Bajarildi', value: stats.bajarildi || 0, color: '#10b981', icon: '✅' },
        ].map(s => (
          <div key={s.label} style={{ ...CARD_STYLE, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ ...CARD_STYLE, marginBottom: 20, display: 'flex', gap: 12 }}>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14 }}>
          <option value="">Barcha statuslar</option>
          {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14 }}>
          <option value="">Barcha kategoriyalar</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Yuklanmoqda...</div>
      ) : arizalar.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
          <p>Hozircha murojaatlar yo'q</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {arizalar.map(a => (
            <div key={a.id} onClick={() => setSelected(a)} style={{
              ...CARD_STYLE, cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'flex-start',
              borderLeft: `4px solid ${PRIORITIES[a.priority]?.color || '#6b7280'}`,
              transition: 'box-shadow 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
            >
              <div style={{ fontSize: 24, flexShrink: 0 }}>{CATEGORIES[a.category]?.icon || '📋'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{a.title}</div>
                  <span style={{
                    padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, flexShrink: 0,
                    background: (STATUSES[a.status]?.color || '#6b7280') + '20',
                    color: STATUSES[a.status]?.color || '#6b7280',
                  }}>
                    {STATUSES[a.status]?.label || a.status}
                  </span>
                </div>
                <p style={{ margin: '4px 0', color: '#6b7280', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.description}
                </p>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  <span>{CATEGORIES[a.category]?.label}</span>
                  {a.roomNumber && <span>Xona: {a.roomNumber}</span>}
                  {a.isAnonymous ? <span>Anonim</span> : <span>{a.studentName}</span>}
                  <span>{a.createdAt ? new Date(a.createdAt).toLocaleDateString('uz-UZ') : '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{selected.title}</h2>
              <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                ['Ariza raqami', selected.arizaNumber || '—'],
                ['Kategoriya', CATEGORIES[selected.category]?.label || selected.category],
                ['Ustuvorlik', PRIORITIES[selected.priority]?.label || selected.priority],
                ['Status', STATUSES[selected.status]?.label || selected.status],
                ['Muallif', selected.isAnonymous ? 'Anonim' : (selected.studentName || '—')],
                ['Yotoqxona', selected.dormitory?.name || '—'],
                ['Xona', selected.roomNumber || '—'],
                ['Sana', selected.createdAt ? new Date(selected.createdAt).toLocaleString('uz-UZ') : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{v || '—'}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Tavsif</div>
              <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>{selected.description}</p>
            </div>
            {selected.status !== 'YOPILDI' && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>Statusni o'zgartirish:</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(STATUSES).filter(([k]) => k !== selected.status).map(([k, v]) => (
                    <button key={k} onClick={() => updateStatus(selected.id, k)} style={{
                      padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${v.color}`,
                      background: 'transparent', color: v.color, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 520, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Yangi murojaat</h2>
              <button onClick={() => setShowCreate(false)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>Sarlavha *</label>
                <input value={form.title} onChange={set('title')} required placeholder="Muammo haqida qisqacha" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>Tavsif *</label>
                <textarea value={form.description} onChange={set('description')} required rows={4} placeholder="Muammoni batafsil yozing..." style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>Kategoriya</label>
                  <select value={form.category} onChange={set('category')} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db' }}>
                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>Ustuvorlik</label>
                  <select value={form.priority} onChange={set('priority')} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db' }}>
                    {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>Xona raqami</label>
                <input value={form.roomNumber} onChange={set('roomNumber')} placeholder="201-xona" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', boxSizing: 'border-box' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isAnonymous} onChange={set('isAnonymous')} />
                <span style={{ fontSize: 14, color: '#374151' }}>Anonim yuborish</span>
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Bekor qilish</button>
                <button type="submit" disabled={creating} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#1e3a5f', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  {creating ? 'Yuborilmoqda...' : 'Yuborish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
