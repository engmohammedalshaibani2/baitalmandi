'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Phone, MapPin, Clock, MessageCircle, Send, Star, CheckCircle } from 'lucide-react';

export default function ContactPage() {
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
      await supabase.from('reviews').insert([{
        customer_name: name.trim(),
        rating,
        comment: comment.trim(),
        source,
        is_approved: false,
      }]);
      setSubmitted(true);
    } catch {
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
            {[
              {
                icon: Phone, color: 'var(--gold)',
                title: 'للحجز والاستفسار',
                lines: ['01/465888']
              },
              {
                icon: MessageCircle, color: '#25D366',
                title: 'التوصيل واتساب/اتصال',
                lines: [' واتساب: 779898617 📱', ' اتصال: 775577200📞']
              },
              {
                icon: MapPin, color: 'var(--maroon-light)',
                title: 'موقعنا',
                lines: ['صنعاء - نهاية شارع الرباط', 'بداية شارع الستين']
              },
              {
                icon: Clock, color: '#3b82f6',
                title: 'مواعيد العمل',
                lines: ['يومياً من 6:00 صباحاً', 'حتى 12:00  منتصف الليل']
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="glass-card" style={{ padding: '22px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ background: `${card.color}18`, padding: '12px', borderRadius: '12px', flexShrink: 0 }}>
                    <Icon size={24} color={card.color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>{card.title}</h3>
                    {card.lines.map((line, j) => (
                      <p key={j} style={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.7 }}>{line}</p>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* WhatsApp Button */}
            <a
              href="https://wa.me/967779898617"
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
              <MessageCircle size={22} />
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
