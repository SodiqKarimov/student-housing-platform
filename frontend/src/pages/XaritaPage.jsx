import React, { useState, useEffect } from 'react';
import { dormitoryApi } from '../services/api';

const ROOM_STATUS_CONFIG = {
  AVAILABLE: { label: "Bo'sh", color: '#10b981', bg: '#d1fae5' },
  FULL: { label: "To'la", color: '#ef4444', bg: '#fee2e2' },
  MAINTENANCE: { label: "Ta'mirda", color: '#f59e0b', bg: '#fef3c7' },
  RESERVED: { label: 'Zaxirada', color: '#3b82f6', bg: '#dbeafe' },
};

export default function XaritaPage() {
  const [dormitories, setDormitories] = useState([]);
  const [activeDormId, setActiveDormId] = useState('all');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [floor, setFloor] = useState('all');

  useEffect(() => {
    dormitoryApi.getAll({ limit: 50 })
      .then(({ data }) => {
        const list = data.data?.items || [];
        setDormitories(list);
        if (list.length > 0) {
          loadRoomsForDorm(list[0].id);
          setActiveDormId(list[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadRoomsForDorm = (dormId) => {
    setLoadingRooms(true);
    setFloor('all');
    setSelectedRoom(null);
    dormitoryApi.getRooms(dormId)
      .then(({ data }) => setRooms(data.data || []))
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
  };

  const switchDorm = (dormId) => {
    setActiveDormId(dormId);
    if (dormId === 'all') {
      Promise.all(dormitories.map(d => dormitoryApi.getRooms(d.id).then(r => r.data.data || [])))
        .then(results => setRooms(results.flat()))
        .catch(() => setRooms([]))
        .finally(() => setLoadingRooms(false));
      setLoadingRooms(true);
      setFloor('all');
      setSelectedRoom(null);
    } else {
      loadRoomsForDorm(dormId);
    }
  };

  const activeDorm = dormitories.find(d => d.id === activeDormId);
  const floors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);
  const filteredRooms = floor === 'all' ? rooms : rooms.filter(r => r.floor === parseInt(floor));

  const totalCapacity = (activeDormId === 'all' ? dormitories : [activeDorm]).filter(Boolean).reduce((s, d) => s + (d.totalCapacity || 0), 0);
  const totalOccupancy = (activeDormId === 'all' ? dormitories : [activeDorm]).filter(Boolean).reduce((s, d) => s + (d.currentOccupancy || 0), 0);
  const occupancyPct = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Yotoqxonalar Xaritasi</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Xona holatlari va band eganlik</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Yuklanmoqda...</div>
      ) : (
        <>
          {/* Yotoqxona tablar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <button onClick={() => switchDorm('all')} style={{
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: activeDormId === 'all' ? '#1e3a5f' : '#e5e7eb',
              color: activeDormId === 'all' ? '#fff' : '#374151',
            }}>
              Barchasi
            </button>
            {dormitories.map((d, i) => (
              <button key={d.id} onClick={() => switchDorm(d.id)} style={{
                padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                background: activeDormId === d.id ? '#1e3a5f' : '#e5e7eb',
                color: activeDormId === d.id ? '#fff' : '#374151',
              }}>
                {i + 1}-yotoqxona
                {d.genderRestriction === 'FEMALE' ? ' (Qizlar)' : d.genderRestriction === 'MALE' ? " (O'g'illar)" : ''}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            {/* Legend + stats sidebar */}
            <div style={{ width: 220, flexShrink: 0 }}>
              {/* Dormitory info */}
              {activeDorm && (
                <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#1e3a5f' }}>{activeDorm.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{activeDorm.address}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {activeDorm.genderRestriction === 'FEMALE' ? '👧 Faqat qizlar' : activeDorm.genderRestriction === 'MALE' ? "👦 Faqat o'g'illar" : '👥 Aralash'}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 }}>
                {[
                  { label: 'Jami joy', value: totalCapacity, color: '#1e3a5f' },
                  { label: 'Band', value: totalOccupancy, color: '#ef4444' },
                  { label: "Bo'sh", value: totalCapacity - totalOccupancy, color: '#10b981' },
                  { label: 'Xonalar', value: rooms.length, color: '#6b7280' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</span>
                    <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#6b7280' }}>Band eganlik</span>
                    <span style={{ fontWeight: 700, color: occupancyPct > 90 ? '#ef4444' : occupancyPct > 70 ? '#f59e0b' : '#10b981' }}>{occupancyPct}%</span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 8, width: `${occupancyPct}%`,
                      background: occupancyPct > 90 ? '#ef4444' : occupancyPct > 70 ? '#f59e0b' : '#10b981',
                    }} />
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#374151' }}>Rang belgisi</div>
                {Object.entries(ROOM_STATUS_CONFIG).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, background: v.bg, border: `2px solid ${v.color}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#374151' }}>{v.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main rooms area */}
            <div style={{ flex: 1 }}>
              {/* Floor tabs */}
              {floors.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <button onClick={() => setFloor('all')} style={{
                    padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: floor === 'all' ? '#374151' : '#e5e7eb', color: floor === 'all' ? '#fff' : '#374151',
                  }}>Barcha qavatlar</button>
                  {floors.map(f => (
                    <button key={f} onClick={() => setFloor(f)} style={{
                      padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: floor === f ? '#374151' : '#e5e7eb', color: floor === f ? '#fff' : '#374151',
                    }}>{f}-qavat</button>
                  ))}
                </div>
              )}

              {loadingRooms ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Xonalar yuklanmoqda...</div>
              ) : filteredRooms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🏠</div>
                  <p>Xonalar topilmadi</p>
                  <p style={{ fontSize: 13 }}>Yotoqxona bo'limidan xona qo'shing</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                  {filteredRooms.map(room => {
                    const cfg = ROOM_STATUS_CONFIG[room.status] || ROOM_STATUS_CONFIG.AVAILABLE;
                    const activeCount = room.bookings?.filter(b => b.status === 'ACTIVE').length || room.currentCount || 0;
                    return (
                      <div key={room.id} onClick={() => setSelectedRoom(room)} style={{
                        background: cfg.bg, border: `2px solid ${cfg.color}`, borderRadius: 10,
                        padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>{room.roomNumber}</div>
                        <div style={{ fontSize: 12, color: cfg.color, fontWeight: 600, marginTop: 3 }}>{activeCount}/{room.capacity}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{room.floor}-qavat</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Room detail modal */}
      {selectedRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Xona #{selectedRoom.roomNumber}</h3>
              <button onClick={() => setSelectedRoom(null)} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                ['Qavat', `${selectedRoom.floor}-qavat`],
                ["Sig'im", `${selectedRoom.capacity} kishilik`],
                ['Band', `${selectedRoom.bookings?.filter(b=>b.status==='ACTIVE').length || selectedRoom.currentCount || 0} ta`],
                ["Bo'sh joy", `${selectedRoom.capacity - (selectedRoom.bookings?.filter(b=>b.status==='ACTIVE').length || selectedRoom.currentCount || 0)} ta`],
                ['Turi', selectedRoom.type],
                ['Narxi', selectedRoom.pricePerMonth ? `${selectedRoom.pricePerMonth.toLocaleString()} so'm` : "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Active students */}
            {selectedRoom.bookings?.filter(b => b.status === 'ACTIVE').length > 0 && (
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Xonadagi talabalar:</div>
                {selectedRoom.bookings.filter(b => b.status === 'ACTIVE').map(b => (
                  <div key={b.id} style={{ fontSize: 13, color: '#374151', padding: '4px 0', borderBottom: '1px solid #e5e7eb' }}>
                    {b.student?.user?.lastName} {b.student?.user?.firstName}
                  </div>
                ))}
              </div>
            )}

            <div style={{
              marginTop: 12, padding: 10, borderRadius: 8, textAlign: 'center', fontWeight: 700,
              background: (ROOM_STATUS_CONFIG[selectedRoom.status]?.bg || '#f9fafb'),
              color: ROOM_STATUS_CONFIG[selectedRoom.status]?.color || '#374151',
            }}>
              {ROOM_STATUS_CONFIG[selectedRoom.status]?.label || selectedRoom.status}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
