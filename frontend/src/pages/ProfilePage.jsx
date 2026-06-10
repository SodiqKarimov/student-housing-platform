import { useState, useEffect } from 'react';
import { profileApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Administrator', DEAN_OFFICE: 'Dekanat', DORMITORY_STAFF: 'TTJ xodimi', STUDENT: 'Talaba',
};

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [tab, setTab] = useState('info');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const r = await profileApi.get();
      setProfile(r.data.data);
      setProfileForm({ firstName: r.data.data.firstName, lastName: r.data.data.lastName, middleName: r.data.data.middleName || '', phone: r.data.data.phone || '' });
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleSaveProfile = async () => {
    setLoading(true); setMsg(''); setErr('');
    try {
      await profileApi.update(profileForm);
      setMsg('Profil muvaffaqiyatli yangilandi');
      setEditMode(false);
      load();
    } catch (e) { setErr(e.response?.data?.message || 'Xato yuz berdi'); }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    setMsg(''); setErr('');
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setErr('Yangi parol va tasdiqlash mos emas');
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      setErr('Yangi parol kamida 8 belgidan iborat bo\'lishi kerak');
      return;
    }
    setLoading(true);
    try {
      const r = await profileApi.changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      setMsg(r.data.message || 'Parol o\'zgartirildi. Iltimos, qayta kiring.');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) { setErr(e.response?.data?.message || 'Xato yuz berdi'); }
    setLoading(false);
  };

  if (!profile) return <div style={{ padding: '24px', color: '#6b7280' }}>Yuklanmoqda...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '640px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 24px' }}>Profil</h1>

      {/* Header card */}
      <div style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '16px', padding: '24px', marginBottom: '24px', color: 'white', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700 }}>
          {profile.firstName?.[0]}{profile.lastName?.[0]}
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{profile.lastName} {profile.firstName} {profile.middleName}</div>
          <div style={{ opacity: 0.85, fontSize: '14px', marginTop: '4px' }}>
            {ROLE_LABELS[profile.role] || profile.role} • {profile.email}
          </div>
          <div style={{ opacity: 0.75, fontSize: '13px', marginTop: '2px' }}>
            Oxirgi kirish: {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString('uz-UZ') : 'Ma\'lumot yo\'q'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #e5e7eb', marginBottom: '24px' }}>
        {[{ id: 'info', label: 'Ma\'lumotlar' }, { id: 'password', label: 'Parol o\'zgartirish' }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setMsg(''); setErr(''); }}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer', background: 'transparent',
              borderBottom: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
              color: tab === t.id ? '#3b82f6' : '#6b7280',
              fontWeight: tab === t.id ? 600 : 400, marginBottom: '-2px',
            }}>{t.label}</button>
        ))}
      </div>

      {msg && <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 500 }}>{msg}</div>}
      {err && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 500 }}>{err}</div>}

      {tab === 'info' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {editMode ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {[
                  { key: 'lastName', label: 'Familiya' },
                  { key: 'firstName', label: 'Ism' },
                  { key: 'middleName', label: 'Otasining ismi' },
                  { key: 'phone', label: 'Telefon', type: 'tel' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>{f.label}</label>
                    <input type={f.type || 'text'} value={profileForm[f.key]} onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleSaveProfile} disabled={loading}
                  style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
                <button onClick={() => setEditMode(false)}
                  style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  Bekor
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                {[
                  { label: 'Familiya', value: profile.lastName },
                  { label: 'Ism', value: profile.firstName },
                  { label: 'Otasining ismi', value: profile.middleName || '—' },
                  { label: 'Telefon', value: profile.phone || '—' },
                  { label: 'Email', value: profile.email },
                  { label: 'Rol', value: ROLE_LABELS[profile.role] || profile.role },
                  { label: 'Holat', value: profile.status },
                  { label: "Ro'yxatdan o'tgan", value: new Date(profile.createdAt).toLocaleDateString('uz-UZ') },
                ].map(f => (
                  <div key={f.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{f.label}</div>
                    <div style={{ fontWeight: 500 }}>{f.value}</div>
                  </div>
                ))}
              </div>

              {profile.student && (
                <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ fontWeight: 600, color: '#1d4ed8', marginBottom: '12px', fontSize: '14px' }}>Talaba ma'lumotlari</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { label: 'Talaba ID', value: profile.student.studentIdNumber },
                      { label: 'Fakultet', value: profile.student.faculty },
                      { label: 'Mutaxassislik', value: profile.student.specialty },
                      { label: 'Kurs', value: profile.student.courseYear + '-kurs' },
                      { label: 'Yashash holati', value: profile.student.housingType === 'DORMITORY' ? 'Yotoqxona' : profile.student.housingType === 'RENTAL' ? 'Ijara' : 'Uyidan qatnab' },
                    ].map(f => (
                      <div key={f.label}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{f.label}: </span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1e3a8a' }}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setEditMode(true)}
                style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Tahrirlash
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'password' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '13px', color: '#92400e' }}>
            ⚠️ Parolni o'zgartirganingizdan so'ng barcha sessiyalar tugatiladi va qayta kirish talab etiladi.
          </div>
          {[
            { key: 'currentPassword', label: 'Joriy parol', placeholder: '••••••••' },
            { key: 'newPassword', label: 'Yangi parol (kamida 8 belgi)', placeholder: '••••••••' },
            { key: 'confirmPassword', label: 'Yangi parolni tasdiqlang', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>{f.label}</label>
              <input type="password" value={pwdForm[f.key]} onChange={e => setPwdForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
            </div>
          ))}
          <button onClick={handleChangePassword} disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? '#9ca3af' : '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: loading ? 'default' : 'pointer' }}>
            {loading ? 'O\'zgartirilmoqda...' : 'Parolni o\'zgartirish'}
          </button>
        </div>
      )}
    </div>
  );
}
