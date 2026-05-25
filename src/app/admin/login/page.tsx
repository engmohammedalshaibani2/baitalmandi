'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--black)' }}>
      <div className="glass-panel" style={{ padding: '50px', width: '100%', maxWidth: '450px', textAlign: 'center' }}>
        <h1 className="title-gold" style={{ fontSize: '2rem', marginBottom: '10px' }}>لوحة التحكم</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '30px' }}>بيت المندي — منطقة خاصة بالمدير</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'right' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>البريد الإلكتروني</label>
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
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>كلمة المرور</label>
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
