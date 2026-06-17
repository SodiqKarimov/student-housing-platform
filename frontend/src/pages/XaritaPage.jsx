import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '/api/v1';

const ROOM_STATUS_CONFIG = {
  AVAILABLE: { label: "Bo'sh", color: '#10b981', bg: '#d1fae5' },
  FULL: { label: 'To\'la', color: '#ef4444', bg: '#fee2e2' },
  MAINTENANCE: { label: "Ta'mirda", color: '#f59e0b', bg: '#fef3c7' },
  RESERVED: { label: 'Zaxirada', color: '#3b82f6', bg: '#dbeafe' },
};

export default function XaritaPage() {
  const { token } = useAuth();
  const [dormitories, setDormitories] = useState([]);
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [floor, setFloor] = useState('all');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/dormitories`, { headers })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setDormitories(data.data || []);
          if (data.data?.length > 0) setSelectedDorm(data.data[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDorm) return;
    fetch(`${API}/dormitories/${selectedDorm.id}/rooms`, { headers })
      .then(r => r.json())
      .then(data => {
        if (data.success) setRooms(data.data || []);
        else setRooms([]);
      })
      .catch(() => setRooms([]));
  }, [selectedDorm]);

  const floors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);
  const filteredRooms = floor === 'all' ? rooms : rooms.filter(r => r.floor === parseInt(floor));

  const occupancyPct = selectedDorm
    ? Math.round((selectedDorm.currentOccupancy / (selectedDorm.totalCapacity || 1)) * 100)
    : 0;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Xona Haritasi</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Yotoqxona xonalari holati va band eganlik</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Yuklanmoqda...</div>
      ) : (
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Left sidebar — dorm selection */}
          <div style={{ width: 260, flexShrink: 0 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 12 }}>Yotoqxonalar</div>
              {dormitories.map(d => (
                <button key={d.id} onClick={() => { setSelectedDorm(d); setFloor('all'); setSelectedRoom(null); }} style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: 'none', textAlign: 'left',
                  background: selectedDorm?.id === d.id ? '#eff6ff' : 'transparent',
                  color: selectedDorm?.id === d.id ? '#1d4ed8' : '#374151',
                  cursor: 'pointer', marginBottom: 4, display: 'block',
                  borderLeft: selectedDorm?.id === d.id ? '3px solid #1d4ed8' : '3px solid transparent',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    {d.genderRestriction === 'FEMALE' ? '👧 Qizlar' : d.genderRestriction === 'MALE' ? '👦 O\'g\'illar' : '👥 Aralash'}
                    {' · '}{d.currentOccupancy}/{d.totalCapacity}
                  </div>
                </button>
              ))}
              {dormitories.length === 0 && (
                <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>Yotoqxona topilmadi</p>
              )}
            </div>

            {/* Legend */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 12 }}>Ranglar</div>
              {Object.entries(ROOM_STATUS_CONFIG).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: v.bg, border: `2px solid ${v.color}` }} />
                  <span style={{ fontSize: 13, color: '#374151' }}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div style={{ flex: 1 }}>
            {selectedDorm && (
              <>
                {/* Dorm info */}
                <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{selectedDorm.name}</h2>
                      <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>{selectedDorm.address}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                      {[
                        { label: 'Jami joy', value: selectedDorm.totalCapacity },
                        { label: 'Band', value: selectedDorm.currentOccupancy },
                        { label: "Bo'sh", value: selectedDorm.totalCapacity - selectedDorm.currentOccupancy },
                        { label: 'Xonalar', value: rooms.length },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#1e3a5f' }}>{s.value}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                      <span>Band eganlik</span>
                      <span style={{ fontWeight: 700, color: occupancyPct > 90 ? '#ef4444' : occupancyPct > 70 ? '#f59e0b' : '#10b981' }}>
                        {occupancyPct}%
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#f3f4f6', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 8, transition: 'width 0.5s',
                        width: `${occupancyPct}%`,
                        background: occupancyPct > 90 ? '#ef4444' : occupancyPct > 70 ? '#f59e0b' : '#10b981',
                      }} />
                    </div>
                  </div>
                </div>

                {/* Floor filter */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <button onClick={() => setFloor('all')} style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: floor === 'all' ? '#1e3a5f' : '#e5e7eb', color: floor === 'all' ? '#fff' : '#374151',
                    fontWeight: 600, fontSize: 13,
                  }}>
                    Barcha qavatlar
                  </button>
                  {floors.map(f => (
                    <button key={f} onClick={() => setFloor(f)} style={{
                      padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: floor === f ? '#1e3a5f' : '#e5e7eb', color: floor === f ? '#fff' : '#374151',
                      fontWeight: 600, fontSize: 13,
                    }}>
                      {f}-qavat
                    </button>
                  ))}
                </div>

                {/* Rooms grid */}
                {filteredRooms.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>🏠</div>
                    <p>Xona ma'lumoti topilmadi</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                    {filteredRooms.map(room => {
                      const cfg = ROOM_STATUS_CONFIG[room.status] || ROOM_STATUS_CONFIG.AVAILABLE;
                      return (
                        <div key={room.id} onClick={() => setSelectedRoom(room)} style={{
                          background: cfg.bg, border: `2px solid ${cfg.color}`, borderRadius: 10,
                          padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                          transition: 'transform 0.15s, box-shadow 0.15s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          <div style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>{room.roomNumber}</div>
                          <div style={{ fontSize: 11, color: cfg.color, fontWeight: 600, marginTop: 2 }}>
                            {room.currentCount}/{room.capacity}
                          </div>
                          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>{room.floor}-qavat</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Room detail modal */}
      {selectedRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Xona #{selectedRoom.roomNumber}</h3>
              <button onClick={() => setSelectedRoom(null)} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Qavat', `${selectedRoom.floor}-qavat`],
                ['Sig\'im', `${selectedRoom.capacity} kishilik`],
                ['Band', `${selectedRoom.currentCount} ta`],
                ["Bo'sh joy", `${selectedRoom.capacity - selectedRoom.currentCount} ta`],
                ['Turi', selectedRoom.type],
                ['Narxi', selectedRoom.pricePerMonth ? `${selectedRoom.pricePerMonth.toLocaleString()} so'm/oy` : "Ko'rsatilmagan"],
                ['Holati', ROOM_STATUS_CONFIG[selectedRoom.status]?.label || selectedRoom.status],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 16, padding: 12, borderRadius: 8,
              background: ROOM_STATUS_CONFIG[selectedRoom.status]?.bg || '#f9fafb',
              textAlign: 'center', fontWeight: 700,
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
