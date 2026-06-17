import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
const COLORS = {
  success: { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
  error:   { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  warning: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  info:    { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur || 6000),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10,
        maxWidth: 360, width: '100%',
      }}>
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 16px',
              background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,.12)',
              animation: 'slideIn 0.25s ease',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{ICONS[t.type]}</span>
              <span style={{ flex: 1, fontSize: 13, color: c.text, lineHeight: 1.5 }}>{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, fontSize: 16, padding: 0, flexShrink: 0 }}
              >×</button>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// API xatolarini o'qib qulay xabar chiqarish
export function parseApiError(err) {
  if (!err) return "Noma'lum xato";

  // Validation errors array
  if (err.response?.data?.errors?.length) {
    return err.response.data.errors.map(e => e.message).join('. ');
  }

  // Server xabar
  if (err.response?.data?.message) return err.response.data.message;

  // Network xato
  if (err.code === 'ECONNABORTED') return "So'rov muddati tugadi. Internet aloqasini tekshiring.";
  if (!err.response) return "Server bilan bog'lanib bo'lmadi. Internet aloqasini tekshiring.";

  // HTTP status bo'yicha
  switch (err.response?.status) {
    case 400: return "Ma'lumotlar noto'g'ri kiritilgan";
    case 401: return 'Sessiya tugagan. Qayta kiring';
    case 403: return "Bu amalni bajarish uchun ruxsatingiz yo'q";
    case 404: return "So'ralgan ma'lumot topilmadi";
    case 409: return "Bu ma'lumot allaqachon mavjud";
    case 429: return "Juda ko'p so'rov yuborildi. Biroz kuting.";
    case 500: return 'Server xatosi. Iltimos, keyinroq urinib ko\'ring.';
    case 502: return "Tashqi xizmat bilan bog'lanishda xato";
    case 503: return "Xizmat vaqtincha mavjud emas";
    default: return err.response?.data?.message || 'Xato yuz berdi';
  }
}
