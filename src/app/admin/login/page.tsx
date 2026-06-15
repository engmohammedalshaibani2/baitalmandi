'use client';

import { useState } from 'react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // ensures cookies from response are saved
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ غير متوقع');
        setLoading(false);
        return;
      }

      // Hard navigate so the browser sends the new cookies to the server
      window.location.href = '/admin';
    } catch (err) {
      console.error('[Login page] fetch error:', err);
      setError('تعذر الاتصال بالسيرفر، تحقق من الاتصال وحاول مرة أخرى');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="glass-panel" style={{ padding: '50px', width: '100%', maxWidth: '450px', textAlign: 'center' }}>
        <h1 className="title-gold" style={{ fontSize: '2rem', marginBottom: '10px' }}>لوحة التحكم</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>بيت المندي — منطقة خاصة بالمدير</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'right' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>البريد الإلكتروني</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@baitalmandi.com"
              required
              style={{ direction: 'ltr', textAlign: 'right' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>كلمة المرور</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(231,76,60,0.15)', color: '#e74c3c', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '15px', marginTop: '10px' }}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-sign-in-alt"></i> تسجيل الدخول</>}
          </button>
        </form>
      </div>
    </div>
  );
}
