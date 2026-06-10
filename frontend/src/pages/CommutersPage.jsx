import { useState, useEffect } from 'react';
import { commuterApi } from '../services/api';

const TRANSPORT_LABELS = {
  BUS: 'Avtobus', METRO: 'Metro', TAXI: 'Taksi', WALK: 'Piyoda', OWN_CAR: 'O\'z mashinasi', OTHER: 'Boshqa',
};

export default function CommutersPage() {
  const [commuters, setCommuters] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        commuterApi.getAll({ page, limit: 20, search: search || undefined }),
        commuterApi.getStats(),
      ]);
      setCommuters(listRes.data.data?.items || []);
      setTotal(listRes.data.data?.total || 0);
      setStats(statsRes.data.data);
    } catch {
      setCommuters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Qatnab o'quvchilar</h1>
        <span style={{ color: '#6b7280' }}>Jami: {total} ta</span>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Jami', value: stats.total, color: '#3b82f6' },
            { label: 'Nafaqa huquqli', value: stats.eligible, color: '#10b981' },
            { label: "O'rtacha masofa", value: stats.avgDistance ? `${stats.avgDistance.toFixed(1)} km` : '—', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Talaba ismi yoki viloyat bo'yicha qidiring..."
          style={{ padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: '8px', width: '320px', outline: 'none' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Yuklanmoqda...</div>
      ) : commuters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Ma'lumot topilmadi</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                {['Talaba', 'Viloyat / Tuman', 'Manzil', 'Masofa', "Yo'l vaqti", 'Transport', 'Nafaqa'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commuters.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500 }}>{c.student?.user?.lastName} {c.student?.user?.firstName}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{c.student?.faculty}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{c.region}, {c.district}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', maxWidth: '200px' }}>{c.address}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: c.distanceKm > 30 ? '#ef4444' : '#374151' }}>{c.distanceKm} km</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{c.travelTimeMin} min</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{TRANSPORT_LABELS[c.transportType] || c.transportType}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {c.isEligibleForBenefit ? (
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#d1fae5', color: '#065f46' }}>Ha</span>
                    ) : (
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#f3f4f6', color: '#6b7280' }}>Yo'q</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              style={{
                width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: page === i + 1 ? '#3b82f6' : '#f3f4f6',
                color: page === i + 1 ? 'white' : '#374151',
              }}
            >{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}
