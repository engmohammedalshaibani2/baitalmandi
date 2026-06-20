import React from 'react';

export default function TokenTrackingLoading() {
  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 15px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>جاري تحميل الطلبات...</p>
      </div>
    </div>
  );
}
