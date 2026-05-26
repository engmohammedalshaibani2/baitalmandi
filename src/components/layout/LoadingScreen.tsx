'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoadingScreen() {
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setHidden(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div id="loading-screen" className={hidden ? 'hidden' : ''} aria-hidden={hidden}>
      <div className="loading-logo">
        <Image
          src="/logo.jpg"
          alt="بيت المندي"
          width={100}
          height={100}
          priority
          style={{
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            padding: '12px',
            boxShadow: '0 0 40px rgba(212,160,23,0.3)',
          }}
        />
      </div>

      <p className="loading-text">بيت المندي</p>

      <div className="loading-bar">
        <div className="loading-bar-fill" />
      </div>

      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', letterSpacing: '2px' }}>
        أصالة الطعم اليمني
      </p>
    </div>
  );
}
