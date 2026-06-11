import React, { useEffect, useState, useCallback } from 'react';
import { dormitoryApi, userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMPTY_DORM = { name: '', address: '', region: '', floors: '', totalRooms: '', totalCapacity: '', genderRestriction: '', phoneNumber: '', managerId: '' };
const EMPTY_ROOM = { roomNumber: '', floor: '1', type: 'DOUBLE', capacity: '2', pricePerMonth: '0' };
const ROOM_TYPE_LABELS = { SINGLE: 'Yakka', DOUBLE: 'Juft', TRIPLE: 'Uchlik', QUAD: "To'rtlik" };

const API_BASE = (import.meta.env.VITE_API_URL || '/api/v1').replace('/api/v1', '');

export default function DormitoriesPage() {
  const { user } = useAuth();
  const [dorms, setDorms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showDormModal, setShowDormModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [dormForm, setDormForm] = useState(EMPTY_DORM);
  const [adminUsers, setAdminUsers] = useState([]);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Xona tafsilotlari modali
  const [roomDetail, setRoomDetail] = useState(null);
  const [roomStudents, setRoomStudents] = useState([]);
  const [loadingRoomStudents, setLoadingRoomStudents] = useState(false);

  // Talaba tafsilotlari modali
  const [studentDetail, setStudentDetail] = useState(null);
  const [showStudentEdit, setShowStudentEdit] = useState(false);
  const [studentEditForm, setStudentEditForm] = useState({});

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canAddRoom = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role);

  const loadDorms = useCallback(() => {
    setLoading(true);
    dormitoryApi.getAll({ limit: 50 })
      .then(({ data }) => setDorms(data.data?.items || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDorms(); }, [loadDorms]);

  const selectDorm = (dorm) => {
    setSelected(dorm);
    setRoomDetail(null);
    setStudentDetail(null);
    setLoadingRooms(true);
    dormitoryApi.getRooms(dorm.id)
      .then(({ data }) => setRooms(data.data || []))
      .finally(() => setLoadingRooms(false));
  };

  const openDormModal = () => {
    setDormForm(EMPTY_DORM);
    setError('');
    setShowDormModal(true);
    userApi.getAll({ role: 'ADMIN', limit: 100 })
      .then(({ data }) => setAdminUsers(data.data?.items || []))
      .catch(() => {});
  };

  const saveDorm = async () => {
    setSaving(true); setError('');
    try {
      await dormitoryApi.create({
        ...dormForm,
        floors: dormForm.floors ? parseInt(dormForm.floors) : null,
        totalRooms: parseInt(dormForm.totalRooms),
        totalCapacity: parseInt(dormForm.totalCapacity),
        genderRestriction: dormForm.genderRestriction || null,
        managerId: dormForm.managerId || null,
      });
      setShowDormModal(false);
      loadDorms();
    } catch (e) {
      setError(e.response?.data?.message || 'Xato yuz berdi');
    } finally { setSaving(false); }
  };

  const saveRoom = async () => {
    setSaving(true); setError('');
    try {
      await dormitoryApi.createRoom(selected.id, {
        ...roomForm,
        floor: parseInt(roomForm.floor),
        capacity: parseInt(roomForm.capacity),
        pricePerMonth: parseFloat(roomForm.pricePerMonth),
      });
      setShowRoomModal(false);
      selectDorm(selected);
    } catch (e) {
      setError(e.response?.data?.message || 'Xato yuz berdi');
    } finally { setSaving(false); }
  };

  const openRoomDetail = (room) => {
    setRoomDetail(room);
    setStudentDetail(null);
    setLoadingRoomStudents(true);
    dormitoryApi.getRoomStudents(room.id)
      .then(({ data }) => setRoomStudents(data.data || []))
      .catch(() => setRoomStudents([]))
      .finally(() => setLoadingRoomStudents(false));
  };

  const openStudentDetail = (st) => {
    setStudentDetail(st);
    setShowStudentEdit(false);
    setStudentEditForm({
      firstName: st.user?.firstName || '',
      lastName: st.user?.lastName || '',
      middleName: st.user?.middleName || '',
      phone: st.user?.phone || '',
      parentPhone: st.parentPhone || '',
      faculty: st.faculty || '',
      direction: st.direction || '',
      courseYear: String(st.courseYear || 1),
      homeRegion: st.homeRegion || '',
      homeDistrict: st.homeDistrict || '',
      homeAddress: st.homeAddress || '',
    });
  };

  const handlePrint = () => { window.print(); };

  const df = (k, v) => setDormForm(p => ({ ...p, [k]: v }));
  const rf = (k, v) => setRoomForm(p => ({ ...p, [k]: v }));

  const photoSrc = studentDetail?.photoUrl ? `${API_BASE}${studentDetail.photoUrl}` : null;

  return (
    <div style={s.page}>
      {/* Print-only div — faqat print paytida ko'rinadi */}
      {studentDetail && (
        <div id="studentPdf" className="print-only" style={{ display: 'none' }}>
          <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Talaba ma'lumot varag'i</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              <tr><td style={{ padding: '6px 12px', fontWeight: 600, width: '40%' }}>F.I.O</td><td style={{ padding: '6px 12px' }}>{studentDetail.user?.lastName} {studentDetail.user?.firstName} {studentDetail.user?.middleName}</td></tr>
              <tr><td style={{ padding: '6px 12px', fontWeight: 600 }}>JSHSHIR (PINFL)</td><td style={{ padding: '6px 12px' }}>{studentDetail.pinfl}</td></tr>
              <tr><td style={{ padding: '6px 12px', fontWeight: 600 }}>Tug'ilgan sana</td><td style={{ padding: '6px 12px' }}>{studentDetail.dateOfBirth ? new Date(studentDetail.dateOfBirth).toLocaleDateString('uz-UZ') : '—'}</td></tr>
              <tr><td style={{ padding: '6px 12px', fontWeight: 600 }}>Telefon</td><td style={{ padding: '6px 12px' }}>{studentDetail.user?.phone || '—'}</td></tr>
              <tr><td style={{ padding: '6px 12px', fontWeight: 600 }}>Ota-ona telefoni</td><td style={{ padding: '6px 12px' }}>{studentDetail.parentPhone || '—'}</td></tr>
              <tr><td style={{ padding: '6px 12px', fontWeight: 600 }}>Fakultet</td><td style={{ padding: '6px 12px' }}>{studentDetail.faculty}</td></tr>
              <tr><td style={{ padding: '6px 12px', fontWeight: 600 }}>Yo'nalish</td><td style={{ padding: '6px 12px' }}>{studentDetail.direction || '—'}</td></tr>
              <tr><td style={{ padding: '6px 12px', fontWeight: 600 }}>Kurs</td><td style={{ padding: '6px 12px' }}>{studentDetail.courseYear}-kurs</td></tr>
              <tr><td style={{ padding: '6px 12px', fontWeight: 600 }}>Manzil</td><td style={{ padding: '6px 12px' }}>{studentDetail.homeRegion}, {studentDetail.homeDistrict}, {studentDetail.homeAddress}</td></tr>
            </tbody>
          </table>
          <p style={{ marginTop: 40, fontSize: 12, color: '#888' }}>Sana: {new Date().toLocaleDateString('uz-UZ')}</p>
        </div>
      )}

      <style>{`
        .print-only { display: none !important; }
        @media print {
          .print-only { display: block !important; }
          body > * { display: none !important; }
          #studentPdf { display: block !important; }
        }
      `}</style>

      <div style={s.header}>
        <div>
          <h1 style={s.title}>Yotoqxonalar</h1>
          <p style={s.sub}>{dorms.length} ta yotoqxona</p>
        </div>
        {isSuperAdmin && (
          <button onClick={openDormModal} style={s.btnPrimary}>+ Yotoqxona qo'shish</button>
        )}
      </div>

      <div style={s.layout}>
        {/* Yotoqxonalar ro'yxati */}
        <div style={s.leftPanel}>
          {loading ? (
            <div style={s.center}>Yuklanmoqda...</div>
          ) : dorms.length === 0 ? (
            <div style={s.center}>Yotoqxonalar topilmadi</div>
          ) : (
            dorms.map(d => (
              <div
                key={d.id}
                onClick={() => selectDorm(d)}
                style={{ ...s.dormCard, ...(selected?.id === d.id ? s.dormCardActive : {}) }}
              >
                <div style={s.dormName}>{d.name}</div>
                <div style={s.dormInfo}>{d.address}, {d.region}</div>
                <div style={s.dormStats}>
                  <span style={s.statChip}>{d.currentOccupancy}/{d.totalCapacity} joy</span>
                  <span style={{ ...s.statChip, background: d.genderRestriction === 'MALE' ? '#e3f2fd' : d.genderRestriction === 'FEMALE' ? '#fce4ec' : '#f5f5f5' }}>
                    {d.genderRestriction === 'MALE' ? 'Erkaklar' : d.genderRestriction === 'FEMALE' ? 'Ayollar' : 'Aralash'}
                  </span>
                </div>
                <div style={s.occupancyBar}>
                  <div style={{ ...s.occupancyFill, width: `${d.totalCapacity > 0 ? (d.currentOccupancy / d.totalCapacity) * 100 : 0}%` }} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Xonalar paneli */}
        <div style={s.rightPanel}>
          {!selected ? (
            <div style={s.emptyState}>
              <p style={{ color: '#888' }}>Xonalarni ko'rish uchun yotoqxonani tanlang</p>
            </div>
          ) : (
            <>
              <div style={s.roomsHeader}>
                <div>
                  <h2 style={s.roomsTitle}>{selected.name} — Xonalar</h2>
                  <p style={s.roomsSub}>{rooms.length} ta xona</p>
                </div>
                {canAddRoom && (
                  <button onClick={() => { setRoomForm(EMPTY_ROOM); setError(''); setShowRoomModal(true); }} style={s.btnPrimary}>
                    + Xona qo'shish
                  </button>
                )}
              </div>

              {loadingRooms ? (
                <div style={s.center}>Yuklanmoqda...</div>
              ) : rooms.length === 0 ? (
                <div style={s.center}>Xonalar topilmadi</div>
              ) : (
                <div style={s.roomsGrid}>
                  {rooms.map(r => {
                    const activeCount = r.bookings?.filter(b => b.status === 'ACTIVE').length ?? r._count?.bookings ?? r.currentCount ?? 0;
                    return (
                      <div
                        key={r.id}
                        onClick={() => openRoomDetail(r)}
                        style={{ ...s.roomCard, borderLeft: `4px solid ${r.status === 'AVAILABLE' ? '#0d8f5c' : r.status === 'FULL' ? '#c0392b' : '#999'}`, cursor: 'pointer' }}
                      >
                        <div style={s.roomNumber}>{r.roomNumber}-xona</div>
                        <div style={s.roomDetail}>{r.floor}-qavat - {ROOM_TYPE_LABELS[r.type] || r.type}</div>
                        <div style={s.roomOccupancy}>
                          <span style={{ color: r.currentCount >= r.capacity ? '#c0392b' : '#0d8f5c', fontWeight: 600 }}>
                            {r.currentCount}/{r.capacity}
                          </span>
                          <span style={{ color: '#888', fontSize: 12 }}> talaba</span>
                        </div>
                        {r.pricePerMonth > 0 && (
                          <div style={s.roomPrice}>{r.pricePerMonth.toLocaleString()} so'm/oy</div>
                        )}
                        <span style={{ ...s.badge, background: r.status === 'AVAILABLE' ? '#e8f5e9' : r.status === 'FULL' ? '#ffebee' : '#f5f5f5', color: r.status === 'AVAILABLE' ? '#2e7d32' : r.status === 'FULL' ? '#c62828' : '#666' }}>
                          {r.status === 'AVAILABLE' ? "Bo'sh joy bor" : r.status === 'FULL' ? "To'liq band" : r.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Yotoqxona qo'shish modali */}
      {showDormModal && (
        <div style={s.overlay} onClick={() => setShowDormModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>Yangi yotoqxona qo'shish</h2>
              <button onClick={() => setShowDormModal(false)} style={s.closeBtn}>X</button>
            </div>
            <div style={s.formGrid}>
              <Field label="Yotoqxona nomi *" value={dormForm.name} onChange={v => df('name', v)} span2 />
              <Field label="Manzil *" value={dormForm.address} onChange={v => df('address', v)} span2 />
              <Field label="Viloyat *" value={dormForm.region} onChange={v => df('region', v)} />
              <SelectField label="Jinsi" value={dormForm.genderRestriction} onChange={v => df('genderRestriction', v)}
                options={[['', "Cheklov yo'q"], ['MALE', 'Faqat erkaklar'], ['FEMALE', 'Faqat ayollar']]} />
              <Field label="Qavatlar soni" type="number" value={dormForm.floors} onChange={v => df('floors', v)} placeholder="Masalan: 5" />
              <Field label="Jami xonalar soni *" type="number" value={dormForm.totalRooms} onChange={v => df('totalRooms', v)} />
              <Field label="Sig'im (jami o'rinlar) *" type="number" value={dormForm.totalCapacity} onChange={v => df('totalCapacity', v)} />
              <Field label="Telefon raqami" value={dormForm.phoneNumber} onChange={v => df('phoneNumber', v)} placeholder="+998..." />
              <div style={{ gridColumn: 'span 2' }}>
                <label style={s.label}>Rahbar (ADMIN)</label>
                <select value={dormForm.managerId} onChange={e => df('managerId', e.target.value)} style={s.input}>
                  <option value="">Rahbar tayinlanmagan</option>
                  {adminUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.lastName} {u.firstName}</option>
                  ))}
                </select>
              </div>
            </div>
            {error && <div style={s.errorBox}>{error}</div>}
            <div style={s.modalFooter}>
              <button onClick={() => setShowDormModal(false)} style={s.btnSecondary}>Bekor qilish</button>
              <button onClick={saveDorm} disabled={saving} style={s.btnPrimary}>
                {saving ? 'Saqlanmoqda...' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Xona qo'shish modali */}
      {showRoomModal && (
        <div style={s.overlay} onClick={() => setShowRoomModal(false)}>
          <div style={{ ...s.modal, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>{selected?.name} — Xona qo'shish</h2>
              <button onClick={() => setShowRoomModal(false)} style={s.closeBtn}>X</button>
            </div>
            <div style={s.formGrid}>
              <Field label="Xona raqami *" value={roomForm.roomNumber} onChange={v => rf('roomNumber', v)} placeholder="101" />
              <Field label="Qavat *" type="number" value={roomForm.floor} onChange={v => rf('floor', v)} />
              <SelectField label="Xona turi" value={roomForm.type} onChange={v => rf('type', v)}
                options={[['SINGLE','Yakka (1)'],['DOUBLE','Juft (2)'],['TRIPLE','Uchlik (3)'],['QUAD',"To'rtlik (4)"]]} />
              <Field label="Sig'im *" type="number" value={roomForm.capacity} onChange={v => rf('capacity', v)} />
              <Field label="Narxi (so'm/oy)" type="number" value={roomForm.pricePerMonth} onChange={v => rf('pricePerMonth', v)} span2 />
            </div>
            {error && <div style={s.errorBox}>{error}</div>}
            <div style={s.modalFooter}>
              <button onClick={() => setShowRoomModal(false)} style={s.btnSecondary}>Bekor qilish</button>
              <button onClick={saveRoom} disabled={saving} style={s.btnPrimary}>
                {saving ? 'Saqlanmoqda...' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Xona tafsilotlari modali */}
      {roomDetail && !studentDetail && (
        <div style={s.overlay} onClick={() => setRoomDetail(null)}>
          <div style={{ ...s.modal, maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>Xona tafsilotlari — {roomDetail.roomNumber}-xona</h2>
              <button onClick={() => setRoomDetail(null)} style={s.closeBtn}>X</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={s.detailGrid}>
                <InfoRow label="Xona raqami" value={roomDetail.roomNumber} />
                <InfoRow label="Qavat" value={`${roomDetail.floor}-qavat`} />
                <InfoRow label="Turi" value={ROOM_TYPE_LABELS[roomDetail.type] || roomDetail.type} />
                <InfoRow label="Sig'im" value={`${roomDetail.capacity} o'rin`} />
                <InfoRow label="Band joylar" value={roomDetail.currentCount} />
                <InfoRow label="Bo'sh joylar" value={roomDetail.capacity - roomDetail.currentCount} />
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={s.sectionTitle}>Xonadagi talabalar</div>
                {loadingRoomStudents ? (
                  <div style={s.center}>Yuklanmoqda...</div>
                ) : roomStudents.length === 0 ? (
                  <div style={{ color: '#888', fontSize: 14, padding: '12px 0' }}>Hozirda xona bo'sh</div>
                ) : (
                  roomStudents.map(st => {
                    const initials = `${(st.user?.lastName || '')[0] || ''}${(st.user?.firstName || '')[0] || ''}`.toUpperCase();
                    const photoSrcLocal = st.photoUrl ? `${API_BASE}${st.photoUrl}` : null;
                    return (
                      <div
                        key={st.id}
                        onClick={() => openStudentDetail(st)}
                        style={s.studentRow}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {photoSrcLocal ? (
                            <img src={photoSrcLocal} alt={initials} style={{ ...s.avatar, width: 32, height: 32 }} />
                          ) : (
                            <div style={{ ...s.avatarInitials, width: 32, height: 32, fontSize: 12 }}>{initials}</div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{st.user?.lastName} {st.user?.firstName} {st.user?.middleName}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>{st.courseYear}-kurs, {st.direction || st.faculty}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, color: '#555' }}>{st.user?.phone || '—'}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Talaba tafsilotlari modali */}
      {studentDetail && (
        <div style={s.overlay} onClick={() => setStudentDetail(null)}>
          <div style={{ ...s.modal, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>Talaba tafsilotlari</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={handlePrint} style={s.btnSecondary}>PDF yuklab olish</button>
                <button onClick={() => setStudentDetail(null)} style={s.closeBtn}>X</button>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'flex-start' }}>
                {photoSrc ? (
                  <img src={photoSrc} alt="photo" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd', flexShrink: 0 }} />
                ) : (
                  <div style={{ ...s.avatarInitials, width: 80, height: 80, fontSize: 24, flexShrink: 0 }}>
                    {`${(studentDetail.user?.lastName || '')[0] || ''}${(studentDetail.user?.firstName || '')[0] || ''}`.toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3a6b' }}>
                    {studentDetail.user?.lastName} {studentDetail.user?.firstName} {studentDetail.user?.middleName}
                  </div>
                  <div style={{ color: '#888', fontSize: 14 }}>{studentDetail.faculty} — {studentDetail.direction || '—'}</div>
                  <div style={{ color: '#888', fontSize: 14 }}>{studentDetail.courseYear}-kurs</div>
                </div>
              </div>

              {showStudentEdit ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Familiya" value={studentEditForm.lastName} onChange={v => setStudentEditForm(p => ({ ...p, lastName: v }))} />
                  <Field label="Ism" value={studentEditForm.firstName} onChange={v => setStudentEditForm(p => ({ ...p, firstName: v }))} />
                  <Field label="Telefon" value={studentEditForm.phone} onChange={v => setStudentEditForm(p => ({ ...p, phone: v }))} />
                  <Field label="Ota-ona telefoni" value={studentEditForm.parentPhone} onChange={v => setStudentEditForm(p => ({ ...p, parentPhone: v }))} />
                  <Field label="Fakultet" value={studentEditForm.faculty} onChange={v => setStudentEditForm(p => ({ ...p, faculty: v }))} />
                  <Field label="Yo'nalish" value={studentEditForm.direction} onChange={v => setStudentEditForm(p => ({ ...p, direction: v }))} />
                  <Field label="Viloyat" value={studentEditForm.homeRegion} onChange={v => setStudentEditForm(p => ({ ...p, homeRegion: v }))} />
                  <Field label="Tuman" value={studentEditForm.homeDistrict} onChange={v => setStudentEditForm(p => ({ ...p, homeDistrict: v }))} />
                  <div style={{ gridColumn: 'span 2' }}>
                    <Field label="Manzil" value={studentEditForm.homeAddress} onChange={v => setStudentEditForm(p => ({ ...p, homeAddress: v }))} />
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowStudentEdit(false)} style={s.btnSecondary}>Bekor qilish</button>
                    <button style={s.btnPrimary}>Saqlash</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={s.detailGrid}>
                    <InfoRow label="JSHSHIR (PINFL)" value={studentDetail.pinfl} />
                    <InfoRow label="Tug'ilgan sana" value={studentDetail.dateOfBirth ? new Date(studentDetail.dateOfBirth).toLocaleDateString('uz-UZ') : '—'} />
                    <InfoRow label="Telefon" value={studentDetail.user?.phone || '—'} />
                    <InfoRow label="Ota-ona telefoni" value={studentDetail.parentPhone || '—'} />
                    <InfoRow label="Ta'lim shakli" value={studentDetail.educationForm || '—'} />
                    <InfoRow label="Jinsi" value={studentDetail.gender === 'MALE' ? 'Erkak' : 'Ayol'} />
                    <InfoRow label="Viloyat" value={studentDetail.homeRegion} />
                    <InfoRow label="Tuman" value={studentDetail.homeDistrict} />
                    <InfoRow label="Uy manzili" value={studentDetail.homeAddress} />
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowStudentEdit(true)} style={s.btnEdit}>Tahrirlash</button>
                  </div>
                </>
              )}
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
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={s.input} />
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

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{value ?? '—'}</div>
    </div>
  );
}

const s = {
  page: { padding: 24, maxWidth: 1400, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, color: '#1a3a6b', margin: '0 0 4px' },
  sub: { color: '#888', fontSize: 14, margin: 0 },
  layout: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 },
  leftPanel: { display: 'flex', flexDirection: 'column', gap: 12 },
  rightPanel: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minHeight: 300 },
  center: { padding: 40, textAlign: 'center', color: '#888' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40 },
  dormCard: { background: '#fff', borderRadius: 10, padding: 16, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '2px solid transparent', transition: 'all 0.15s' },
  dormCardActive: { border: '2px solid #1a3a6b', boxShadow: '0 4px 12px rgba(26,58,107,0.2)' },
  dormName: { fontWeight: 700, color: '#1a3a6b', fontSize: 15, marginBottom: 4 },
  dormInfo: { fontSize: 13, color: '#888', marginBottom: 8 },
  dormStats: { display: 'flex', gap: 8, marginBottom: 8 },
  statChip: { fontSize: 12, background: '#f0f0f0', color: '#555', padding: '2px 8px', borderRadius: 20 },
  occupancyBar: { height: 4, background: '#f0f0f0', borderRadius: 999 },
  occupancyFill: { height: '100%', background: '#1a3a6b', borderRadius: 999 },
  roomsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottom: '1px solid #eee' },
  roomsTitle: { fontSize: 18, fontWeight: 700, color: '#1a3a6b', margin: '0 0 4px' },
  roomsSub: { color: '#888', fontSize: 13, margin: 0 },
  roomsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, padding: 20 },
  roomCard: { background: '#fafafa', borderRadius: 8, padding: 14, border: '1px solid #eee' },
  roomNumber: { fontWeight: 700, color: '#1a3a6b', fontSize: 15, marginBottom: 4 },
  roomDetail: { fontSize: 12, color: '#888', marginBottom: 8 },
  roomOccupancy: { fontSize: 14, marginBottom: 4 },
  roomPrice: { fontSize: 12, color: '#666', marginBottom: 8 },
  badge: { padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 },
  btnPrimary: { background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnSecondary: { background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnEdit: { background: '#e8f0fe', color: '#1a3a6b', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fff', zIndex: 1 },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#1a3a6b', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888', padding: 4 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 24 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  errorBox: { margin: '0 24px 16px', padding: '10px 14px', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 8, color: '#c0392b', fontSize: 13 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #eee' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingBottom: 4, borderBottom: '1px solid #eee' },
  studentRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, border: '1px solid #eee', marginBottom: 8, cursor: 'pointer', background: '#fafafa' },
  avatar: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' },
  avatarInitials: { width: 36, height: 36, borderRadius: '50%', background: '#1a3a6b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
};
