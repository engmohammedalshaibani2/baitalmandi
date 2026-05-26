'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/lib/constants';
import { Phone, MapPin, Clock, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="plum-heritage-gradient" style={{
      marginTop: '80px',
      position: 'relative'
    }}>
      {/* Faded Circular Watermark */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/logo.jpg)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '400px',
        opacity: 0.05,
        pointerEvents: 'none',
        WebkitMaskImage: 'radial-gradient(circle 200px at center, black 0%, black 50%, transparent 80%)',
        maskImage: 'radial-gradient(circle 200px at center, black 0%, black 50%, transparent 80%)'
      }} />
      {/* Gold divider */}
      <div style={{
        height: '3px',
        background: 'linear-gradient(90deg, var(--maroon-dark), var(--gold), var(--maroon-dark))',
      }} />

      <div className="container" style={{ padding: '60px 20px 40px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
          {/* Brand column */}
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Image
                src="/logo.jpg"
                alt="شعار بيت المندي"
                width={52}
                height={52}
                style={{ borderRadius: '50%', background: 'var(--maroon)', padding: '5px' }}
              />
              <span style={{
                fontFamily: 'var(--font-tajawal), sans-serif',
                fontSize: '1.5rem',
                fontWeight: 900,
                color: 'var(--gold)',
              }}>
                بيت المندي
              </span>
            </Link>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: '260px' }}>
              أصالة الطعم اليمني العريق — نقدم لكم أشهى المأكولات المحضّرة بحب وتقاليد أصيلة.
            </p>
            {/* Social */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <a
                href={siteConfig.social.instagram}
                target="_blank" rel="noreferrer"
                aria-label="إنستغرام"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'var(--glass-bg)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', transition: 'all var(--transition)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--gold)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                }}
              >
                <Instagram size={18} />
              </a>
              <a
                href={siteConfig.social.facebook}
                target="_blank" rel="noreferrer"
                aria-label="فيسبوك"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'var(--glass-bg)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', transition: 'all var(--transition)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--gold)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                }}
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 style={{ color: 'var(--gold)', marginBottom: '16px', fontWeight: 800, fontSize: '1.1rem' }}>
              روابط سريعة
            </h3>
            {[
              { href: '/', label: 'الرئيسية' },
              { href: '/menu', label: 'قائمة الطعام' },
              { href: '/gallery', label: 'معرض الصور' },
              { href: '/contact', label: 'اتصل بنا' },
              { href: '/my-orders', label: 'سلة الطلبات' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'block',
                  color: 'var(--text-secondary)',
                  padding: '6px 0',
                  fontSize: '0.95rem',
                  transition: 'color var(--transition)',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h3 style={{ color: 'var(--gold)', marginBottom: '16px', fontWeight: 800, fontSize: '1.1rem' }}>
              تواصل معنا
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a
                href={siteConfig.contact.booking.url}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}
              >
                <Phone size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                للحجز: {siteConfig.contact.booking.display}
              </a>
              <a
                href={siteConfig.contact.delivery.whatsapp}
                target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}
              >
                <Phone size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                توصيل: {siteConfig.contact.delivery.display}
              </a>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                <MapPin size={16} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '3px' }} />
                <span>{siteConfig.address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                <Clock size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                يومياً 11:00 ص — 12:00 م
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} مطعم بيت المندي — جميع الحقوق محفوظة
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            صنعاء، اليمن 🇾🇪
          </p>
        </div>
      </div>
    </footer>
  );
}

