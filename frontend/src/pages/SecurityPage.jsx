import React from 'react';
import { useAuth } from '../context/AuthContext';

const CONTROLS = [
  {
    standard: 'ISO/IEC 27001',
    title: 'Axborot Xavfsizligini Boshqarish Tizimi (AXBT)',
    color: '#1e3a5f',
    items: [
      { label: 'Kirish nazorati (A.9)', status: 'active', desc: 'Rol asosida kirish huquqi (RBAC): 6 rol, minimal imtiyoz prinsipi' },
      { label: 'Audit va monitoring (A.12.4)', status: 'active', desc: 'Barcha muhim amallar audit logga qayd etiladi' },
      { label: 'Kriptografiya (A.10)', status: 'active', desc: 'AES-256 shifrlash, JWT (RS256), bcrypt parol xeshlash' },
      { label: 'Muvofiqlik (A.18.1)', status: 'active', desc: "O'RQ-547 shaxsiy ma'lumotlar himoyasi" },
      { label: 'Xavfsiz ishlab chiqish (A.14)', status: 'active', desc: 'XSS, SQL injection, CSRF himoyasi' },
    ],
  },
  {
    standard: 'ISO/IEC 27002',
    title: 'Axborot xavfsizligi nazorat amaliyoti',
    color: '#0d7c59',
    items: [
      { label: 'Parol siyosati (9.4.3)', status: 'active', desc: '10+ belgi, katta/kichik harf, raqam, maxsus belgi majburiy' },
      { label: 'Sessiya boshqaruvi (9.4.2)', status: 'active', desc: '8 soatlik sessiya, avtomatik tugash' },
      { label: 'Tarmoq xavfsizligi (13.1)', status: 'active', desc: 'HTTPS, HSTS, CORS nazorati, TLS 1.2+' },
      { label: 'Rate limiting (13.1.1)', status: 'active', desc: 'DDoS himoyasi: 100 so\'rov/15 daqiqa, login uchun 10/15 daqiqa' },
      { label: 'Brute-force himoyasi', status: 'active', desc: '5 muvaffaqiyatsiz urinishdan keyin 15 daqiqalik blok' },
    ],
  },
  {
    standard: 'ISO/IEC 27003',
    title: "Axborot xavfsizligi tizimini joriy etish qo'llanmasi",
    color: '#7c3aed',
    items: [
      { label: 'Tizim arxitekturasi', status: 'active', desc: 'Backend (Render) + Frontend (Netlify) ajratilgan arxitektura' },
      { label: 'Ma\'lumotlar bazasi xavfsizligi', status: 'active', desc: 'Prisma ORM, parametrlangan so\'rovlar, SQL injection oldini olish' },
      { label: 'API xavfsizligi', status: 'active', desc: 'JWT autentifikatsiya, HTTPS, versiyalangan API (/api/v1)' },
      { label: 'Muhit ajratish', status: 'active', desc: '.env fayllari orqali maxfiy kalitlar boshqaruvi' },
    ],
  },
  {
    standard: 'ISO/IEC 27005',
    title: 'Axborot xavfsizligi risklarini boshqarish',
    color: '#b45309',
    items: [
      { label: "Shaxsiy ma'lumotlarga kirish logi", status: 'active', desc: "Talabalar, foydalanuvchilar ma'lumotlariga har bir kirishni qayd etish" },
      { label: 'Nozik ma\'lumotlar maskalash', status: 'active', desc: 'PINFL, parol hashlari log fayllarida maskalanadi' },
      { label: 'Risklar monitoringi', status: 'active', desc: 'Winston logger orqali barcha xatolar va ogohlantirishlar' },
      { label: 'Ma\'lumot toifalash', status: 'active', desc: 'X-Data-Classification: CONFIDENTIAL sarlavhasi' },
    ],
  },
  {
    standard: 'ISO/IEC 27008',
    title: "Axborot xavfsizligi nazoratini baholash bo'yicha qo'llanma",
    color: '#0891b2',
    items: [
      { label: 'Audit log yozuvlari', status: 'active', desc: 'Foydalanuvchi ID, vaqt, IP, harakat turi, natija qayd etiladi' },
      { label: 'Nazorat samaradorligi', status: 'active', desc: 'Har bir xavfsizlik nazorati avtomatik tekshiruvga ega' },
      { label: 'Buzilish aniqlash', status: 'active', desc: 'Anormal faollik (brute-force, injection) real vaqtda aniqlash' },
    ],
  },
  {
    standard: 'ISO/IEC 27014',
    title: "Axborot xavfsizligi boshqaruvi",
    color: '#dc2626',
    items: [
      { label: 'Super Admin boshqaruvi', status: 'active', desc: 'Yagona Super Admin roli barcha tizim sozlamalarini nazorat qiladi' },
      { label: 'Rol delegatsiyasi', status: 'active', desc: 'Super Admin xodimlarni yaratadi va huquqlarini belgilaydi' },
      { label: 'Sessiya nazorati (boshqaruv)', status: 'active', desc: 'Sessiya muddati, multi-session nazorati' },
      { label: 'Muvofiqlik hisobotlari', status: 'active', desc: "O'RQ-547 va OneID standartlari bo'yicha audit hisobotlari" },
    ],
  },
];

const PASPORT = [
  { label: 'Tizim nomi', value: 'Talabalar Turar Joyi Boshqaruv Tizimi' },
  { label: 'Versiya', value: '2.0.0' },
  { label: 'Backend', value: 'Node.js + Express.js (Render.com)' },
  { label: 'Frontend', value: 'React + Vite (Netlify)' },
  { label: 'Ma\'lumotlar bazasi', value: 'PostgreSQL (SSL)' },
  { label: 'Autentifikatsiya', value: 'JWT + OneID' },
  { label: 'Shifrlash', value: 'AES-256, bcrypt, TLS 1.2+' },
  { label: 'Standartlar', value: 'ISO/IEC 27001/27002/27003/27005/27008/27014' },
  { label: 'Milliy qonun', value: "O'RQ-547 (Shaxsiy ma'lumotlar, 2019)" },
];

export default function SecurityPage() {
  const { user } = useAuth();

  if (!['SUPER_ADMIN', 'ADMIN'].includes(user?.role)) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <p>Bu sahifaga kirish huquqingiz yo'q.</p>
      </div>
    );
  }

  const totalItems = CONTROLS.reduce((s, c) => s + c.items.length, 0);
  const activeItems = CONTROLS.reduce((s, c) => s + c.items.filter(i => i.status === 'active').length, 0);
  const compliancePct = Math.round((activeItems / totalItems) * 100);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a3a6b', margin: 0 }}>
          🛡️ Axborot Xavfsizligi Boshqaruvi
        </h1>
        <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>
          ISO/IEC 27001 · 27002 · 27003 · 27005 · 27008 · 27014 muvofiqlik holati
        </p>
      </div>

      {/* Umumiy holat */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', textAlign: 'center', borderTop: '4px solid #10b981' }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#10b981' }}>{compliancePct}%</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Muvofiqlik darajasi</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', textAlign: 'center', borderTop: '4px solid #3b82f6' }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#3b82f6' }}>{activeItems}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Faol nazorat ({totalItems}dan)</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', textAlign: 'center', borderTop: '4px solid #1e3a5f' }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#1e3a5f' }}>6</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>ISO/IEC standarti</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', textAlign: 'center', borderTop: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#8b5cf6' }}>6</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Rol asosida kirish</div>
        </div>
      </div>

      {/* Tizim pasporti */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a3a6b', margin: '0 0 16px' }}>📋 Tizim xavfsizlik pasporti</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px 24px' }}>
          {PASPORT.map(p => (
            <div key={p.label} style={{ display: 'flex', gap: 8, borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#374151', minWidth: 160, flexShrink: 0 }}>{p.label}:</span>
              <span style={{ fontSize: 13, color: '#6b7280' }}>{p.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Standartlar bo'yicha nazorat ro'yxati */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 20 }}>
        {CONTROLS.map(ctrl => (
          <div key={ctrl.standard} style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderLeft: `5px solid ${ctrl.color}` }}>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: ctrl.color, background: `${ctrl.color}15`, padding: '3px 10px', borderRadius: 20 }}>{ctrl.standard}</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginTop: 8 }}>{ctrl.title}</div>
            </div>
            {ctrl.items.map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f9fafb' }}>
                <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>
                  {item.status === 'active' ? '✅' : '⚠️'}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, lineHeight: '1.4' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16, fontSize: 13, color: '#1e40af' }}>
        <strong>📌 Eslatma:</strong> Ushbu sahifa axborot xavfsizligi tekshirish guruhlari (auditorlar) uchun mo'ljallangan.
        Tizimning to'liq xavfsizlik holati faqat Super Admin va Yotoqxona boshlig'i tomonidan ko'riladi.
      </div>
    </div>
  );
}
