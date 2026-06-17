import React from 'react';

// Asosiy skeleton blok
function SkeletonBlock({ width = '100%', height = 16, borderRadius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      ...style,
    }} />
  );
}

// Jadval qatori skeleton
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <SkeletonBlock height={14} width={i === 0 ? '80%' : i === cols - 1 ? '60%' : '90%'} />
        </td>
      ))}
    </tr>
  );
}

// Karta skeleton (dashboard metric)
export function MetricCardSkeleton() {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: '20px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <SkeletonBlock width={100} height={12} />
      <SkeletonBlock width={60} height={28} />
      <SkeletonBlock width={120} height={10} />
    </div>
  );
}

// Talaba qatori skeleton
export function StudentRowSkeleton() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 20px', borderBottom: '1px solid #f3f4f6',
    }}>
      <SkeletonBlock width={40} height={40} borderRadius={20} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SkeletonBlock width="40%" height={14} />
        <SkeletonBlock width="60%" height={11} />
      </div>
      <SkeletonBlock width={80} height={24} borderRadius={20} />
      <SkeletonBlock width={60} height={14} />
    </div>
  );
}

// Sahifa yuklanmoqda spinner
export function PageLoader({ text = 'Yuklanmoqda...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 300, gap: 16,
      color: '#6b7280',
    }}>
      <div style={{
        width: 40, height: 40, border: '3px solid #e5e7eb',
        borderTop: '3px solid #6366f1', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: 13 }}>{text}</span>
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// Button loading holati
export function LoadingButton({ loading, children, onClick, style = {}, disabled = false, ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: loading || disabled ? 0.7 : 1,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...props}
    >
      {loading && (
        <span style={{
          width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
          borderTop: '2px solid white', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', display: 'inline-block',
        }} />
      )}
      {children}
    </button>
  );
}

// Bo'sh holat ko'rsatish
export function EmptyState({ icon = '📋', title = "Ma'lumot topilmadi", description = '', action = null }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 20px', gap: 12,
      color: '#9ca3af', textAlign: 'center',
    }}>
      <span style={{ fontSize: 48 }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: 16, color: '#374151' }}>{title}</h3>
      {description && <p style={{ margin: 0, fontSize: 13 }}>{description}</p>}
      {action}
    </div>
  );
}

// Xato holati
export function ErrorState({ error, onRetry = null }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 20px', gap: 12,
      color: '#ef4444', textAlign: 'center',
    }}>
      <span style={{ fontSize: 48 }}>⚠️</span>
      <h3 style={{ margin: 0, fontSize: 16, color: '#374151' }}>Xato yuz berdi</h3>
      <p style={{ margin: 0, fontSize: 13, color: '#6b7280', maxWidth: 400 }}>{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 8, padding: '8px 20px', background: '#6366f1', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13,
          }}
        >
          Qayta urinib ko'rish
        </button>
      )}
    </div>
  );
}

export default SkeletonBlock;
