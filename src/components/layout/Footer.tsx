'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSettings } from '@/lib/settings-context';
import { Phone, MapPin, Clock, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  const { settings } = useSettings();
  const name = settings['restaurant_name'] || 'بيت المندي';
  const address = settings['address_main'] || 'صنعاء - نهاية شارع الرباط، بداية شارع الستين';
  const phoneReservations = settings['phone_reservations'] || '01/465888';
  const phoneDeliveryWhatsapp = settings['phone_delivery_whatsapp'] || '967779898617';
  const phoneDeliveryCall = settings['phone_delivery_call'] || '967775577200';
  const workingHours = settings['working_hours'] || 'يومياً من 11:00 صباحاً حتى 12:00 منتصف الليل';
  const whatsappDisplay = phoneDeliveryWhatsapp.replace(/^967/, '');
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
                alt={`شعار ${name}`}
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
                {name}
              </span>
            </Link>
            <p style={{ color: 'rgba(244, 239, 230, 0.85)', lineHeight: 1.8, maxWidth: '260px', fontSize: '1rem' }}>
              أصالة الطعم اليمني العريق — نقدم لكم أشهى المأكولات المحضّرة بحب وتقاليد أصيلة.
            </p>
            {/* Social */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <a
                href={settings['instagram'] || 'https://www.instagram.com/baitalmandiy?igsh=MWVnYWRuZ3E1ZnB5dA=='}
                target="_blank" rel="noreferrer"
                aria-label="إنستغرام"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(197, 155, 95, 0.25)',
                  color: 'rgba(244, 239, 230, 0.85)', transition: 'all var(--transition)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--gold)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(197, 155, 95, 0.25)';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(244, 239, 230, 0.85)';
                }}
              >
                <Instagram size={20} />
              </a>
              <a
                href={settings['facebook'] || 'https://facebook.com/baitalmandiy'}
                target="_blank" rel="noreferrer"
                aria-label="فيسبوك"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(197, 155, 95, 0.25)',
                  color: 'rgba(244, 239, 230, 0.85)', transition: 'all var(--transition)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--gold)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(197, 155, 95, 0.25)';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(244, 239, 230, 0.85)';
                }}
              >
                <Facebook size={20} />
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
                  color: 'rgba(244, 239, 230, 0.85)',
                  padding: '8px 0',
                  fontSize: '1.05rem',
                  transition: 'color var(--transition)',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(244, 239, 230, 0.85)')}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <a
                href={`tel:+967${phoneReservations.replace(/[^0-9]/g, '')}`}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(244, 239, 230, 0.85)', fontSize: '1.05rem' }}
              >
                <Phone size={18} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                للحجز: {phoneReservations}
              </a>
              <a
                href={`https://wa.me/${phoneDeliveryWhatsapp}`}
                target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(244, 239, 230, 0.85)', fontSize: '1.05rem' }}
              >
                <Phone size={18} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                توصيل: {whatsappDisplay}
              </a>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: 'rgba(244, 239, 230, 0.85)', fontSize: '1.05rem' }}>
                <MapPin size={18} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '4px' }} />
                <span>{address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(244, 239, 230, 0.85)', fontSize: '1.05rem' }}>
                <Clock size={18} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                {workingHours}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(197, 155, 95, 0.2)',
          paddingTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}>
          <p style={{ color: 'rgba(244, 239, 230, 0.65)', fontSize: '0.95rem' }}>
            © {new Date().getFullYear()} مطعم {name} — جميع الحقوق محفوظة
          </p>
          <p style={{ color: 'rgba(244, 239, 230, 0.65)', fontSize: '0.95rem' }}>
            صنعاء، اليمن 🇾🇪
          </p>
        </div>
      </div>
    </footer>
  );
}

