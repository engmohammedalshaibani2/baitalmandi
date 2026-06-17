import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <WifiOff size={64} strokeWidth={1.5} />
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>لا يوجد اتصال بالإنترنت</h1>
      <p style={{ color: 'var(--muted-foreground, #666)', maxWidth: 400, lineHeight: 1.6 }}>
        يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.
        سيتم إرسال طلبك تلقائياً عند استعادة الاتصال.
      </p>
    </div>
  );
}
