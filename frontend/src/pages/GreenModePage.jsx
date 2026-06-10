import { useState, useEffect } from 'react';
import { greenModeApi, dormitoryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TAB_LOGS = 'logs';
const TAB_VIOLATIONS = 'violations';
const TAB_EXCEPTIONS = 'exceptions';
const TAB_SETTINGS = 'settings';

export default function GreenModePage() {
  const { user } = useAuth();
  const [dormitories, setDormitories] = useState([]);
  const [selectedDorm, setSelectedDorm] = useState('');
  const [tab, setTab] = useState(TAB_VIOLATIONS);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  // Add log modal
  const [showAddLog, setShowAddLog] = useState(false);
  const [logForm, setLogForm] = useState({ studentId: '', eventType: 'CHECKIN', note: '' });

  // Settings form
  const [settingsForm, setSettingsForm] = useState({ entryDeadline: '22:00', exitDeadline: '05:00', isActive: true, reason: '' });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Exception modal
  const [showExcModal, setShowExcModal] = useState(false);
  const [excForm, setExcForm] = useState({ studentId: '', dormitoryId: '', reason: '', allowedFrom: '', allowedUntil: '' });

  useEffect(() => {
    dormitoryApi.getAll({ limit: 100 }).then(r => {
      const dorms = r.data.data?.items || r.data.data || [];
      setDormitories(dorms);
      if (dorms.length > 0) setSelectedDorm(dorms[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDorm) return;
    loadData();
    loadStats();
    loadSettings();
  }, [selectedDorm, tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === TAB_LOGS) {
        const r = await greenModeApi.getLogs({ dormitoryId: selectedDorm, limit: 50 });
        setData(r.data.data?.items || []);
      } else if (tab === TAB_VIOLATIONS) {
        const r = await greenModeApi.getViolations({ dormitoryId: selectedDorm });
        setData(r.data.data?.items || []);
      } else if (tab === TAB_EXCEPTIONS) {
        const r = await greenModeApi.getExceptions();
        setData(r.data.data || []);
      }
    } catch { setData([]); }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const r = await greenModeApi.getStats({ dormitoryId: selectedDorm });
      setStats(r.data.data);
    } catch {}
  };

  const loadSettings = async () => {
    try {
      const r = await greenModeApi.getSettings(selectedDorm);
      const s = r.data.data;
      setSettings(s);
      setSettingsForm({ entryDeadline: s.entryDeadline, exitDeadline: s.exitDeadline, isActive: s.isActive, reason: '' });
    } catch {}
  };

  const handleAddLog = async () => {
    try {
      await greenModeApi.addLog({ ...logForm, dormitoryId: selectedDorm });
      setShowAddLog(false);
      setLogForm({ studentId: '', eventType: 'CHECKIN', note: '' });
      loadData();
      loadStats();
    } catch (e) { alert(e.response?.data?.message || 'Xato'); }
  };

  const handleSaveSettings = async () => {
    try {
      await greenModeApi.updateSettings(selectedDorm, settingsForm);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      loadSettings();
    } catch (e) { alert(e.response?.data?.message || 'Xato'); }
  };

  const handleResolve = async (id) => {
    const note = prompt('Hal qilish izohi (ixtiyoriy):') ?? '';
    try {
      await greenModeApi.resolveViolation(id, { note });
      loadData();
      loadStats();
    } catch (e) { alert(e.response?.data?.message || 'Xato'); }
  };

  const handleGrantException = async () => {
    try {
      await greenModeApi.grantException({ ...excForm, dormitoryId: selectedDorm });
      setShowExcModal(false);
      setExcForm({ studentId: '', dormitoryId: '', reason: '', allowedFrom: '', allowedUntil: '' });
      if (tab === TAB_EXCEPTIONS) loadData();
    } catch (e) { alert(e.response?.data?.message || 'Xato'); }
  };

  const TABS = [
    { id: TAB_VIOLATIONS, label: 'Qoidabuzarliklar' },
    { id: TAB_LOGS, label: 'Kirish/Chiqish tarixi' },
    { id: TAB_EXCEPTIONS, label: 'Istisnolar' },
    { id: TAB_SETTINGS, label: 'Sozlamalar' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 24px' }}>Yashil rejim (Green Mode)</h1>

      {/* Dorm selector + stats */}
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
              { label: "Bugungi hodisalar", value: stats.todayLogs, color: '#3b82f6' },
              { label: 'Hal qilinmagan', value: stats.violations, color: '#ef4444' },
              { label: 'Faol istisnolar', value: stats.activeExceptions, color: '#f59e0b' },
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
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer', background: 'transparent',
              borderBottom: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
              color: tab === t.id ? '#3b82f6' : '#6b7280',
              fontWeight: tab === t.id ? 600 : 400,
              marginBottom: '-2px',
            }}
          >{t.label}</button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', paddingBottom: '8px' }}>
          <button
            onClick={() => setShowAddLog(true)}
            style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}
          >
            + Hodisa qo'shish
          </button>
          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setShowExcModal(true)}
              style={{ padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}
            >
              + Istisno berish
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {tab === TAB_SETTINGS ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '480px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>Vaqt sozlamalari</h2>
          {[
            { key: 'entryDeadline', label: 'Kirish vaqti chegarasi (kirish kerak bo\'lgan paytgacha)', type: 'time' },
            { key: 'exitDeadline', label: 'Chiqish vaqti chegarasi (chiqish mumkin bo\'lgan paytdan)', type: 'time' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>{f.label}</label>
              <input
                type={f.type}
                value={settingsForm[f.key]}
                onChange={e => setSettingsForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          ))}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={settingsForm.isActive} onChange={e => setSettingsForm(p => ({ ...p, isActive: e.target.checked }))} />
              <span style={{ fontWeight: 500 }}>Yashil rejim faol</span>
            </label>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>O'zgarish sababi (majburiy)</label>
            <input
              value={settingsForm.reason}
              onChange={e => setSettingsForm(p => ({ ...p, reason: e.target.value }))}
              placeholder="Sabab kiriting..."
              style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={!settingsForm.reason}
            style={{ padding: '12px 24px', background: settingsForm.reason ? '#3b82f6' : '#9ca3af', color: 'white', border: 'none', borderRadius: '8px', cursor: settingsForm.reason ? 'pointer' : 'default', fontWeight: 600 }}
          >
            {settingsSaved ? 'Saqlandi!' : 'Saqlash'}
          </button>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Yuklanmoqda...</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Ma'lumot topilmadi</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                {tab === TAB_LOGS && ['Talaba', 'Hodisa', 'Vaqt', 'Qoidabuzarlik', 'Izoh'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                ))}
                {tab === TAB_VIOLATIONS && ['Talaba', 'Turi', 'Vaqt', 'Holat', 'Amallar'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                ))}
                {tab === TAB_EXCEPTIONS && ['Talaba', 'Sabab', 'Boshlanish', 'Tugash', 'Holat'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  {tab === TAB_LOGS && (
                    <>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{row.student?.user?.lastName} {row.student?.user?.firstName}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: row.eventType === 'CHECKIN' ? '#10b981' : '#ef4444' }}>
                          {row.eventType === 'CHECKIN' ? 'Kirish' : 'Chiqish'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>{new Date(row.eventTime).toLocaleString('uz-UZ')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {row.isViolation ? <span style={{ color: '#ef4444', fontWeight: 600 }}>Ha</span> : <span style={{ color: '#6b7280' }}>Yo'q</span>}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{row.note || '—'}</td>
                    </>
                  )}
                  {tab === TAB_VIOLATIONS && (
                    <>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{row.student?.user?.lastName} {row.student?.user?.firstName}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {row.violationType === 'LATE_ENTRY' ? 'Kech kirish' : row.violationType === 'EARLY_EXIT' ? 'Erta chiqish' : row.violationType}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>{new Date(row.violationTime).toLocaleString('uz-UZ')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {row.resolvedAt
                          ? <span style={{ color: '#10b981', fontSize: '13px' }}>Hal qilingan</span>
                          : <span style={{ color: '#ef4444', fontSize: '13px' }}>Ochiq</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {!row.resolvedAt && (
                          <button onClick={() => handleResolve(row.id)} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            Hal qilish
                          </button>
                        )}
                      </td>
                    </>
                  )}
                  {tab === TAB_EXCEPTIONS && (
                    <>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{row.student?.user?.lastName} {row.student?.user?.firstName}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>{row.reason}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>{new Date(row.allowedFrom).toLocaleString('uz-UZ')}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>{new Date(row.allowedUntil).toLocaleString('uz-UZ')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {row.isActive ? <span style={{ color: '#10b981', fontSize: '13px' }}>Faol</span> : <span style={{ color: '#6b7280', fontSize: '13px' }}>Tugagan</span>}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Log Modal */}
      {showAddLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '400px', maxWidth: '95vw' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>Hodisa qo'shish</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Talaba ID</label>
              <input value={logForm.studentId} onChange={e => setLogForm(p => ({ ...p, studentId: e.target.value }))}
                placeholder="Talaba ID kiriting..."
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Hodisa turi</label>
              <select value={logForm.eventType} onChange={e => setLogForm(p => ({ ...p, eventType: e.target.value }))}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                <option value="CHECKIN">Kirish</option>
                <option value="CHECKOUT">Chiqish</option>
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Izoh (ixtiyoriy)</label>
              <input value={logForm.note} onChange={e => setLogForm(p => ({ ...p, note: e.target.value }))}
                placeholder="Izoh..."
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleAddLog} style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Saqlash</button>
              <button onClick={() => setShowAddLog(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Bekor</button>
            </div>
          </div>
        </div>
      )}

      {/* Exception Modal */}
      {showExcModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '440px', maxWidth: '95vw' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>Istisnoli ruxsat berish</h2>
            {[
              { key: 'studentId', label: 'Talaba ID', type: 'text', placeholder: 'Talaba ID...' },
              { key: 'reason', label: 'Sabab', type: 'text', placeholder: 'Ruxsat sababi...' },
              { key: 'allowedFrom', label: 'Boshlanish vaqti', type: 'datetime-local' },
              { key: 'allowedUntil', label: 'Tugash vaqti', type: 'datetime-local' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>{f.label}</label>
                <input type={f.type} value={excForm[f.key]} placeholder={f.placeholder}
                  onChange={e => setExcForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={handleGrantException} style={{ flex: 1, padding: '12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Berish</button>
              <button onClick={() => setShowExcModal(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Bekor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
