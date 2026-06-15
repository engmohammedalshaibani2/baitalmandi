'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';
import { MapPin, Clock, Send, Star, CheckCircle } from 'lucide-react';

// WhatsApp SVG Icon
const WhatsAppIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

// Phone Call SVG Icon
const PhoneIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.09-1.09a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.72 2z"/>
  </svg>
);

export default function ContactPage() {
  const { settings } = useSettings();
  const phoneReservations = settings['phone_reservations'] || '01/465888';
  const phoneDeliveryWhatsapp = settings['phone_delivery_whatsapp'] || '967779898617';
  const phoneDeliveryCall = settings['phone_delivery_call'] || '967775577200';
  const addressMain = settings['address_main'] || 'صنعاء - نهاية شارع الرباط، بداية شارع الستين';
  const workingHours = settings['working_hours'] || 'يومياً من 6:00 صباحاً حتى 12:00 منتصف الليل';
  const whatsappDisplay = phoneDeliveryWhatsapp.replace(/^967/, '');
  const deliveryCallDisplay = phoneDeliveryCall.replace(/^967/, '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [source, setSource] = useState('Website');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert([{
        reviewer_name: name.trim(),
        rating,
        comment_ar: comment.trim(),
        source,
        is_featured: false,
      }]);

      if (error) {
        throw error;
      }

      setSubmitted(true);
      setName('');
      setPhone('');
      setRating(5);
      setComment('');
      setSource('Website');
    } catch (err) {
      console.error('[Contact page] submit error', err);
      alert('حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--maroon-dark) 0%, var(--maroon) 100%)',
        padding: '60px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(var(--gold) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="title-gold" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: 0, fontFamily: 'var(--font-tajawal)' }}>تواصل معنا</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '1.1rem' }}>نسعد بخدمتك دائماً</p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '60px' }}>

          {/* Info Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Booking Phone Card */}
            <a href={`tel:+967${phoneReservations.replace(/[^0-9]/g, '')}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-card" style={{ padding: '22px', display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ background: 'rgba(212,175,55,0.12)', padding: '12px', borderRadius: '12px', flexShrink: 0, color: 'var(--gold)' }}>
                  <PhoneIcon size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>للحجز والاستفسار</h3>
                  <p style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--gold)' }}>{phoneReservations}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>اضغط للاتصال</p>
                </div>
              </div>
            </a>

            {/* WhatsApp Delivery Card */}
            <a href={`https://wa.me/${phoneDeliveryWhatsapp}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-card" style={{ padding: '22px', display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ background: 'rgba(37,211,102,0.12)', padding: '12px', borderRadius: '12px', flexShrink: 0, color: '#25D366' }}>
                  <WhatsAppIcon size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>واتساب التوصيل</h3>
                  <p style={{ fontWeight: 700, fontSize: '1.15rem', color: '#25D366' }}>{whatsappDisplay}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>اضغط لفتح واتساب</p>
                </div>
              </div>
            </a>

            {/* Call Delivery Card */}
            <a href={`tel:+${phoneDeliveryCall}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-card" style={{ padding: '22px', display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ background: 'rgba(59,130,246,0.12)', padding: '12px', borderRadius: '12px', flexShrink: 0, color: '#3b82f6' }}>
                  <PhoneIcon size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>اتصال التوصيل</h3>
                  <p style={{ fontWeight: 700, fontSize: '1.15rem', color: '#3b82f6' }}>{deliveryCallDisplay}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>اضغط للاتصال</p>
                </div>
              </div>
            </a>

            {/* Location Card */}
            <a href="https://maps.app.goo.gl/DBDdrSVqYJ5H2L5d8?g_st=ipc" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-card" style={{ padding: '22px', display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ background: 'rgba(239,68,68,0.12)', padding: '12px', borderRadius: '12px', flexShrink: 0, color: '#ef4444' }}>
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>موقعنا</h3>
                  <p style={{ fontWeight: 700, fontSize: '1rem' }}>{addressMain}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>اضغط لفتح خرائط جوجل</p>
                </div>
              </div>
            </a>

            {/* Hours Card */}
            <div className="glass-card" style={{ padding: '22px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ background: 'rgba(59,130,246,0.12)', padding: '12px', borderRadius: '12px', flexShrink: 0, color: '#3b82f6' }}>
                <Clock size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>مواعيد العمل</h3>
                <p style={{ fontWeight: 700, fontSize: '1rem' }}>{workingHours}</p>
              </div>
            </div>

            {/* WhatsApp CTA Button */}
            <a
              href={`https://wa.me/${phoneDeliveryWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                background: '#25D366', color: '#fff', padding: '16px', borderRadius: '14px',
                fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none',
                boxShadow: '0 8px 20px rgba(37,211,102,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 30px rgba(37,211,102,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(37,211,102,0.3)'; }}
            >
              <WhatsAppIcon size={22} />
              تواصل عبر واتساب الآن
            </a>
          </div>

          {/* Review Form */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: '70px', height: '70px', background: 'rgba(16,185,129,0.1)', border: '2px solid #10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={36} color="#10b981" />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', color: '#10b981' }}>شكراً لتقييمك!</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  تم استلام تقييمك وسيتم نشره بعد مراجعته من قِبل فريقنا.
                </p>
                <button onClick={() => { setSubmitted(false); setName(''); setComment(''); setRating(5); }} className="btn-primary" style={{ marginTop: '25px' }}>
                  إضافة تقييم آخر
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>أضف تقييمك</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.95rem' }}>
                  رأيك يهمنا ويساعدنا على التطوير المستمر
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>اسمك *</label>
                    <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="أحمد محمد" />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>رقم هاتفك (اختياري)</label>
                    <input type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="77XXXXXXX" />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>تقييمك</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <button type="button" key={s} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          <Star size={28} fill={s <= rating ? 'var(--gold)' : 'none'} color="var(--gold)" />
                        </button>
                      ))}
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', alignSelf: 'center', marginRight: '8px' }}>
                        {rating === 5 ? 'ممتاز!' : rating === 4 ? 'جيد جداً' : rating === 3 ? 'جيد' : rating === 2 ? 'مقبول' : 'يحتاج تحسين'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>تعليقك *</label>
                    <textarea className="form-input" rows={4} value={comment} onChange={e => setComment(e.target.value)} required placeholder="شاركنا تجربتك مع بيت المندي..." />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>من أين تتابعنا؟</label>
                    <select className="form-input" value={source} onChange={e => setSource(e.target.value)}>
                      <option value="Website">الموقع</option>
                      <option value="Google">Google</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                    </select>
                  </div>

                  <button type="submit" className="btn-primary" style={{ padding: '14px', fontSize: '1.05rem', marginTop: '5px' }} disabled={submitting}>
                    <Send size={18} />
                    {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                  </button>
                </form>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
