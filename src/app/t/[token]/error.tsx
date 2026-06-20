'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function TokenTrackingError({ error, reset }: { error: Error; reset: () => void }) {
  console.error('[TOKEN_TRACKING_ERROR]', error.message, error.stack);
  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', textAlign: 'center' }}>
      <div className="glass-panel" style={{ padding: '60px 40px', maxWidth: '500px', margin: '0 auto' }}>
        <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: '1.8rem', marginBottom: '15px' }}>عذراً، حدث خطأ في تحميل الطلبات</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
          لم نتمكن من تحميل بيانات الطلبات. الرجاء المحاولة مرة أخرى.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} className="btn-primary" style={{ padding: '14px 36px' }}>
            إعادة المحاولة
          </button>
          <Link href="/menu" className="btn-secondary" style={{ padding: '14px 36px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            العودة للقائمة
          </Link>
        </div>
      </div>
    </div>
  );
}
