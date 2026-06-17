import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '/api/v1';

const STATUS_CONFIG = {
  "TO'LANDI": { label: "To'lagan", color: '#10b981', bg: '#d1fae5' },
  KUTILMOQDA: { label: "To'lamagan", color: '#6b7280', bg: '#f3f4f6' },
  KECHIKDI: { label: 'Qarzdor', color: '#ef4444', bg: '#fee2e2' },
};

const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(str) {
  if (!str) return '';
  const [y, m] = str.split('-');
  return `${MONTHS[parseInt(m) - 1]} ${y}`;
}

export default function PaymentPage() {
  const { getToken } = useAuth();
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentId: '', dormitoryId: '', month: getCurrentMonth(), amount: '', status: "TO'LANDI", receiptNum: '', note: '' });
  const [dormitories, setDormitories] = useState([]);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/students?limit=500`, { headers }).then(r => r.json()),
      fetch(`${API}/dormitories?limit=50`, { headers }).then(r => r.json()),
    ]).then(([sData, dData]) => {
      if (sData.success) setStudents(sData.data?.items || sData.data || []);
      if (dData.success) setDormitories(dData.data?.items || dData.data || []);
    });
  }, []);

  useEffect(() => { fetchPayments(); }, [selectedMonth]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/payments?month=${selectedMonth}`, { headers });
      const data = await res.json();
      if (data.success) setPayments(data.data || []);
      else setPayments([]);
    } catch { setPayments([]); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/payments`, { method: 'POST', headers, body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) });
      setShowForm(false);
      fetchPayments();
    } catch { /* ignore */ }
  };

  const toggleStatus = async (p) => {
    const next = p.status === "TO'LANDI" ? 'KUTILMOQDA' : "TO'LANDI";
    await fetch(`${API}/payments/${p.id}`, { method: 'PATCH', headers, body: JSON.stringify({ status: next, paidAt: next === "TO'LANDI" ? new Date().toISOString() : null }) });
    fetchPayments();
  };

  const filtered = payments.filter(p => {
    const name = `${p.student?.lastName || ''} ${p.student?.firstName || ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const totalAmount = filtered.reduce((s, p) => s + (p.amount || 0), 0);
  const paidCount = filtered.filter(p => p.status === "TO'LANDI").length;
  const pendingCount = filtered.filter(p => p.status === 'KUTILMOQDA').length;
  const lateCount = filtered.filter(p => p.status === 'KECHIKDI').length;

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const downloadReport = () => {
    if (filtered.length === 0) return;
    const rows = [
      ['F.I.O', "Yo'nalish", 'Kurs', 'Yotoqxona', 'Oy', 'Summa', 'Status', 'Chek raqami'],
      ...filtered.map(p => [
        `${p.student?.lastName || ''} ${p.student?.firstName || ''}`,
        p.student?.direction || '—',
        p.student?.courseYear ? `${p.student.courseYear}-kurs` : '—',
        p.dormitory?.name || '—',
        monthLabel(p.month),
        p.amount,
        STATUS_CONFIG[p.status]?.label || p.status,
        p.receiptNum || '—',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tolovlar_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>To'lov Kuzatuvi</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Yotoqxona to'lovlari holati</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14 }} />
          <button onClick={downloadReport} style={{
            padding: '10px 16px', borderRadius: 10, border: '1.5px solid #10b981',
            background: '#fff', color: '#10b981', fontWeight: 600, cursor: 'pointer', fontSize: 14,
          }}>
            📊 CSV
          </button>
          <button onClick={() => setShowForm(true)} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: '#1e3a5f', color: '#fff', fontWeight: 600, cursor: 'pointer',
          }}>
            + Qo'shish
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Jami', value: `${totalAmount.toLocaleString()} so'm`, color: '#1e3a5f', icon: '💰' },
          { label: "To'lagan", value: paidCount, color: '#10b981', icon: '✅' },
          { label: "To'lamagan", value: pendingCount, color: '#6b7280', icon: '⏸️' },
          { label: 'Qarzdor', value: lateCount, color: '#ef4444', icon: '⚠️' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Talaba bo'yicha izlash..."
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💳</div>
            <p>{monthLabel(selectedMonth)} uchun to'lovlar topilmadi</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                {['Talaba', 'Oy', 'Summa', 'Status', 'Chek raqami', 'Amal'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.KUTILMOQDA;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{p.student?.lastName} {p.student?.firstName}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{p.dormitory?.name}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>{monthLabel(p.month)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>{p.amount?.toLocaleString()} so'm</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{p.receiptNum || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => toggleStatus(p)} style={{
                        padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: p.status === "TO'LANDI" ? '#fee2e2' : '#d1fae5',
                        color: p.status === "TO'LANDI" ? '#ef4444' : '#10b981',
                      }}>
                        {p.status === "TO'LANDI" ? 'Bekor qilish' : "To'landi"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 480, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>To'lov qo'shish</h2>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              {[
                { label: 'Talaba', field: 'studentId', type: 'select', options: students.map(s => ({ value: s.id, label: `${s.lastName} ${s.firstName}` })) },
                { label: 'Yotoqxona', field: 'dormitoryId', type: 'select', options: dormitories.map(d => ({ value: d.id, label: d.name })) },
                { label: 'Oy', field: 'month', type: 'month' },
                { label: 'Summa (so\'m)', field: 'amount', type: 'number', placeholder: '450000' },
                { label: 'Holat', field: 'status', type: 'select', options: Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label })) },
                { label: 'Chek raqami', field: 'receiptNum', type: 'text', placeholder: 'CH-XXXX' },
                { label: 'Izoh', field: 'note', type: 'text', placeholder: "Qo'shimcha ma'lumot" },
              ].map(({ label, field, type, options, placeholder }) => (
                <div key={field} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#374151' }}>{label}</label>
                  {type === 'select' ? (
                    <select value={form[field]} onChange={set(field)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db' }}>
                      <option value="">Tanlang</option>
                      {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type={type} value={form[field]} onChange={set(field)} placeholder={placeholder}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', boxSizing: 'border-box' }} />
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  Bekor
                </button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#1e3a5f', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
