'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  console.error('[ROOT_ERROR]', error.message, error.stack);
  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', textAlign: 'center' }}>
      <div className="glass-panel" style={{ padding: '60px 40px', maxWidth: '500px', margin: '0 auto' }}>
        <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: '1.8rem', marginBottom: '15px' }}>عذراً، حدث خطأ غير متوقع</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
          نواجه مشكلة تقنية حالياً. الرجاء المحاولة مرة أخرى.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} className="btn-primary" style={{ padding: '14px 36px' }}>
            إعادة المحاولة
          </button>
          <Link href="/" className="btn-secondary" style={{ padding: '14px 36px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
