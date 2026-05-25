'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { ShoppingCart, Moon, Sun, Monitor, Menu, X } from 'lucide-react';

type Theme = 'light' | 'dark' | 'auto';

function applyTheme(theme: Theme) {
  if (theme === 'auto') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

const NAV_LINKS = [
  { href: '/',         label: 'الرئيسية' },
  { href: '/menu',     label: 'قائمة الطعام' },
  { href: '/gallery',  label: 'معرض الصور' },
  { href: '/contact',  label: 'اتصل بنا' },
];

export default function Navbar() {
  const pathname  = usePathname();
  const [theme,   setTheme]   = useState<Theme>('auto');
  const [isClient, setIsClient] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const cartTotal = useCartStore((s) => s.getTotalItems());

  /* ── init ── */
  useEffect(() => {
    setIsClient(true);
    const saved = (localStorage.getItem('bam-theme') ?? 'auto') as Theme;
    setTheme(saved);
    applyTheme(saved);

    /* listen for system changes when auto */
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if ((localStorage.getItem('bam-theme') ?? 'auto') === 'auto') applyTheme('auto');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* ── scroll shadow ── */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* close mobile menu on route change */
  useEffect(() => setMenuOpen(false), [pathname]);

  const cycleTheme = useCallback(() => {
    const next: Theme = theme === 'auto' ? 'dark' : theme === 'dark' ? 'light' : 'auto';
    setTheme(next);
    localStorage.setItem('bam-theme', next);
    applyTheme(next);
  }, [theme]);

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const themeLabel =
    theme === 'dark' ? 'الوضع الداكن' : theme === 'light' ? 'الوضع الفاتح' : 'تلقائي';

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container">
          {/* ── Brand ── */}
          <Link href="/" className="nav-brand" aria-label="بيت المندي - الرئيسية">
            <Image
              src="/logo.jpg"
              alt="شعار بيت المندي"
              width={46}
              height={46}
              priority
              style={{ borderRadius: '50%', background: 'var(--maroon)', padding: '4px' }}
            />
            <span className="nav-brand-text">بيت المندي</span>
          </Link>

          {/* ── Desktop links ── */}
          <div className="nav-links desktop" style={{ alignItems: 'center', gap: '4px' }}>
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link${pathname === href ? ' active' : ''}`}
              >
                {label}
              </Link>
            ))}

            {/* theme toggle */}
            {isClient && (
              <button
                id="theme-toggle"
                onClick={cycleTheme}
                className="nav-icon-btn"
                title={themeLabel}
                aria-label={themeLabel}
                style={{ marginInlineStart: '8px' }}
              >
                <ThemeIcon size={18} />
              </button>
            )}

            {/* cart */}
            <Link
              href="/my-orders"
              className="nav-icon-btn"
              style={{ position: 'relative', marginInlineStart: '4px' }}
              aria-label="السلة"
            >
              <ShoppingCart size={20} />
              {isClient && cartTotal > 0 && (
                <span className="cart-badge">{cartTotal}</span>
              )}
            </Link>
          </div>

          {/* ── Mobile row ── */}
          <div className="mobile-only" style={{ alignItems: 'center', gap: '8px' }}>
            {/* cart (mobile) */}
            <Link
              href="/my-orders"
              className="nav-icon-btn"
              style={{ position: 'relative' }}
              aria-label="السلة"
            >
              <ShoppingCart size={20} />
              {isClient && cartTotal > 0 && (
                <span className="cart-badge">{cartTotal}</span>
              )}
            </Link>

            {/* hamburger */}
            <button
              className="nav-icon-btn hamburger-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} role="navigation">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`nav-link${pathname === href ? ' active' : ''}`}
          >
            {label}
          </Link>
        ))}

        <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />

        {isClient && (
          <button
            onClick={cycleTheme}
            className="nav-link"
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '1.15rem', padding: '14px 20px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <ThemeIcon size={20} />
            <span>{themeLabel}</span>
          </button>
        )}
      </div>
    </>
  );
}
