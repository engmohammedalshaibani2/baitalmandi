'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Phone, MapPin, ChevronLeft, Pause, Play, Award, Clock, Truck, Users, CheckCircle, Smile, UtensilsCrossed, Star } from 'lucide-react';

const WhatsAppIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

export default function Home() {
  const [offers, setOffers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);
  const [counters, setCounters] = useState({ orders: 0, customers: 0, years: 0 });

  useEffect(() => {
    fetchData();

    // Animate counters
    const targets = { orders: 15000, customers: 8000, years: 12 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounters({
        orders: Math.floor(targets.orders * progress),
        customers: Math.floor(targets.customers * progress),
        years: Math.floor(targets.years * progress),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  async function fetchData() {
    const [{ data: offersData }, { data: reviewsData }] = await Promise.all([
      supabase.from('offers').select('*, items(name_ar, image, item_prices(*))').eq('status', 'active').order('created_at', { ascending: false }).limit(6),
      supabase.from('reviews').select('*').eq('is_featured', true).order('created_at', { ascending: false }).limit(6),
    ]);

    if (offersData && offersData.length > 0) {
      setOffers(offersData);
    } else {
      // Fallback demo offers
      setOffers([
        { id: 1, title_ar: 'وجبة نفر مندي لحم', discount_percent: 20, items: { name_ar: 'نفر مندي لحم', item_prices: [{ original_price: 80 }] }, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=300&h=200' },
        { id: 2, title_ar: 'دجاج مظبي مع الرز', discount_percent: 22, items: { name_ar: 'دجاج مظبي', item_prices: [{ original_price: 45 }] }, image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&q=80&w=300&h=200' },
        { id: 3, title_ar: 'وجبة التوفير العائلية', discount_percent: 20, items: { name_ar: 'وجبة العائلة', item_prices: [{ original_price: 150 }] }, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=300&h=200' },
      ]);
    }

    if (reviewsData && reviewsData.length > 0) {
      setReviews(reviewsData);
    } else {
      setReviews([
        { id: 1, reviewer_name: 'أحمد محمد', rating: 5, comment_ar: 'أفضل مندي تذوقته في حياتي! اللحم طري والبهارات رائعة.', source: 'Google' },
        { id: 2, reviewer_name: 'فاطمة علي', rating: 5, comment_ar: 'خدمة ممتازة وطعام لذيذ جداً. سأعود بالتأكيد!', source: 'Facebook' },
        { id: 3, reviewer_name: 'سعيد عبدالله', rating: 4, comment_ar: 'الطعام رائع والجو مريح. أنصح الجميع بزيارة بيت المندي.', source: 'Website' },
      ]);
    }
  }

  const getDiscountedPrice = (price: number, discount: number) =>
    Math.floor(price * (1 - discount / 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ━━━━━━━ HERO ━━━━━━━ */}
      <section className="plum-heritage-gradient" style={{
        position: 'relative',
        minHeight: '92vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Faded Circular Watermark */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/logo.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '450px',
          opacity: 0.08,
          pointerEvents: 'none',
          WebkitMaskImage: 'radial-gradient(circle 220px at center, black 0%, black 50%, transparent 80%)',
          maskImage: 'radial-gradient(circle 220px at center, black 0%, black 50%, transparent 80%)'
        }} />

        <div className="heritage-corner heritage-corner-tl" />
        <div className="heritage-corner heritage-corner-tr" />
        <div className="heritage-corner heritage-corner-bl" />
        <div className="heritage-corner heritage-corner-br" />

        <div className="container animate-fade-in relative z-10 py-16 px-4 md:px-8 mt-4 md:mt-10">
          <div className="inline-block border rounded-full px-5 py-2 mb-8 md:mb-10 text-sm md:text-base font-semibold tracking-wider" style={{ background: 'rgba(244,239,230,0.1)', borderColor: 'rgba(244,239,230,0.2)', color: '#F4EFE6' }}>
            <UtensilsCrossed size={18} className="inline mr-2 -mt-0.5"/> مطعم يمني أصيل
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-[6.5rem] mb-6 md:mb-10 font-[var(--font-tajawal)] leading-tight" style={{ color: 'var(--gold)', textShadow: '0 0 20px rgba(197, 155, 95, 0.4)' }}>
            بيت المندي
          </h1>
          <p className="text-lg md:text-2xl lg:text-3xl mb-12 md:mb-16 max-w-3xl mx-auto leading-relaxed" style={{ color: '#F4EFE6', opacity: 0.9 }}>
            أصالة الطعم اليمني العريق... تجربة فريدة تأخذك إلى قلب التراث
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link href="/menu" className="btn-primary text-lg px-12 py-4 rounded-2xl w-full sm:w-auto" style={{ background: '#590f2b', color: '#F4EFE6', border: '1px solid rgba(197,155,95,0.4)', boxShadow: 'none' }}>
              اطلب الآن
            </Link>
            <Link href="#contact" className="btn-secondary text-lg px-12 py-4 rounded-2xl w-full sm:w-auto" style={{ color: '#F4EFE6', borderColor: 'rgba(197,155,95,0.5)', background: 'transparent' }}>
              <MapPin size={20} className="inline mr-2 -mt-0.5" /> الموقع والفروع
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="absolute -bottom-16 md:bottom-0 left-1/2 md:left-auto md:right-4 -translate-x-1/2 md:translate-x-0 flex flex-col items-center gap-3 text-[var(--text-muted)] text-sm animate-[fadeIn_2s_ease_1s_both]">
            <div className="w-px h-12 md:h-16 bg-gradient-to-b from-transparent to-[var(--gold)] animate-[pulse-gold_2s_infinite]" />
            تمرير للأسفل
          </div>
        </div>
      </section>

      {/* ━━━━━━━ QUICK INFO ━━━━━━━ */}
      <section className="px-4 md:px-8 -mt-8 relative z-10">
        <div className="container" style={{ background: 'linear-gradient(90deg, #3D0820 0%, #520D29 50%, #74133A 100%)', borderRadius: '14px', border: '1px solid rgba(197,155,95,0.30)', padding: '20px 28px', color: '#F4EFE6' }}>
          <div className="flex flex-col lg:flex-row justify-between items-center gap-5">

            {/* Info items */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-5 flex-1">

              {/* Phone */}
              <div className="flex items-center gap-3">
                <a href="tel:01465888" className="p-2.5 rounded-xl shrink-0 transition-transform hover:scale-110" style={{ background: 'rgba(197,155,95,0.12)' }}>
                  <Phone size={20} color="var(--gold)" />
                </a>
                <div className="text-right flex flex-col items-end">
                  <a href="tel:01465888" className="font-extrabold text-[0.95rem] leading-tight hover:text-[var(--gold)] transition-colors">للحجز: 01/465888</a>
                  <a href="https://wa.me/967779898617" target="_blank" rel="noreferrer" className="text-xs text-[var(--gold)] mt-1 hover:underline">واتساب: 779898617</a>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-[var(--gold)] opacity-30 shrink-0 self-center" />

              {/* Location */}
              <a href="https://maps.app.goo.gl/uhKxKj2MtQARKGxU7" target="_blank" rel="noreferrer" className="flex items-center gap-3 group">
                <div className="p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110" style={{ background: 'rgba(197,155,95,0.12)' }}>
                  <MapPin size={20} color="var(--gold)" />
                </div>
                <div className="text-right group-hover:text-[var(--gold)] transition-colors">
                  <p className="font-extrabold text-[0.95rem] leading-tight">صنعاء - شارع الستين</p>
                  <p className="text-xs text-[var(--gold)] mt-1">نهاية شارع الرباط</p>
                </div>
              </a>

              <div className="hidden sm:block w-px h-8 bg-[var(--gold)] opacity-30 shrink-0 self-center" />

              {/* Hours */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl shrink-0" style={{ background: 'rgba(197,155,95,0.12)' }}>
                  <Clock size={20} color="var(--gold)" />
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-[0.95rem] leading-tight">يومياً 6ص - 12م</p>
                  <p className="text-xs text-[var(--gold)] mt-1">بما فيها الجمعة</p>
                </div>
              </div>

            </div>

            {/* CTA Button */}
            <div className="w-full lg:w-auto shrink-0 flex justify-center lg:items-center self-center mt-4 lg:mt-0">
              <Link href="/menu" style={{ background: 'linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 50%, var(--gold-light) 100%)', color: '#2C1E16', padding: '12px 30px', borderRadius: '12px', fontSize: '1rem', fontWeight: 800, minWidth: '140px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(197, 155, 95, 0.3)' }}>
                اطلب الآن ←
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ━━━━━━━ OFFERS MARQUEE ━━━━━━━ */}
      {offers.length > 0 && (
        <section style={{ position: 'relative', overflow: 'hidden', padding: '60px 0 40px', background: 'rgba(212, 160, 23, 0.03)' }}>
          <div className="container" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="title-gold" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>عروض حصرية</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.95rem' }}>عروض محدودة الوقت — لا تفوّتها!</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => setIsMarqueePaused(!isMarqueePaused)}
                className="btn-secondary"
                style={{ padding: '10px', borderRadius: '50%', width: '42px', height: '42px' }}
                aria-label="إيقاف/تشغيل العروض"
              >
                {isMarqueePaused ? <Play size={18} /> : <Pause size={18} />}
              </button>
              <Link href="/menu#offers" className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '0.9rem' }}>
                عرض الكل ←
              </Link>
            </div>
          </div>

          <div className="marquee-container" style={{ direction: 'ltr' }}>
            <div className={isMarqueePaused ? 'marquee-track paused' : 'marquee-track'} style={{ direction: 'rtl' }}>
              {[...offers, ...offers].map((offer, idx) => (
                <Link href="/menu#offers" key={`${offer.id}-${idx}`} style={{ textDecoration: 'none' }}>
                  <div className="glass-panel flex gap-4 p-4 min-w-[300px] md:min-w-[340px] items-center transition-transform transition-colors duration-300 cursor-pointer hover:-translate-y-1 hover:border-[rgba(212,160,23,0.5)]">
                    {(offer.image || offer.image_url) && (
                      <img src={offer.image || offer.image_url} alt={offer.title_ar} className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl shrink-0" />
                    )}
                    <div>
                      <h3 className="text-lg mb-1">{offer.title_ar}</h3>
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="line-through text-[var(--text-muted)] text-sm">
                          {offer.items?.item_prices?.[0]?.original_price} ريال
                        </span>
                        <span className="neon-text text-xl font-extrabold">
                          {getDiscountedPrice(offer.items?.item_prices?.[0]?.original_price, offer.discount_percent)} ريال
                        </span>
                      </div>
                      <span className="inline-block mt-2 bg-[var(--maroon)] text-white px-2.5 py-1 rounded-md text-xs font-bold">
                        خصم {offer.discount_percent}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ━━━━━━━ ABOUT & STATS UNIFIED ━━━━━━━ */}
      <section className="container py-20 px-4 md:px-8">
        
        <div className="glass-panel p-8 md:p-12 mb-16" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[var(--border)]">
            {[
              { label: 'سنة من الخبرة', value: '+12', icon: Award },
              { label: 'عميل سعيد', value: '+8,000', icon: Users },
              { label: 'طلب تم تسليمه', value: '+15,000', icon: CheckCircle },
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center pt-8 first:pt-0 md:pt-0 text-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(197,155,95,0.1)' }}>
                  <stat.icon size={32} color="var(--gold)" />
                </div>
                <div>
                  <p style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-tajawal)', lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', fontWeight: 600, marginTop: '8px' }}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-4 py-1.5 mb-5 text-sm font-semibold rounded-2xl" style={{ background: 'rgba(116, 19, 58, 0.2)', border: '1px solid rgba(116, 19, 58, 0.4)', color: 'var(--plum)' }}>
               قصتنا
            </div>
            <h2 className="title-gold text-3xl md:text-5xl mb-6 leading-tight">طعم الأصالة اليمنية</h2>
            <div className="w-20 h-px mb-6" style={{ background: 'linear-gradient(270deg, transparent, var(--gold))' }} />
            <p className="text-base md:text-lg leading-relaxed mb-4" style={{ color: 'var(--text-primary)', opacity: 0.85 }}>
              في بيت المندي، نقدم لكم تجربة طعام يمنية أصيلة تعكس تراثنا الغني. نستخدم أجود أنواع اللحوم الطازجة والبهارات المحضرة بعناية لضمان الطعم الفريد الذي يميزنا.
            </p>
            <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: 'var(--text-primary)', opacity: 0.85 }}>
              كل طبق نعده هو مزيج من الشغف والتقاليد التي توارثناها عن أجدادنا في أرض اليمن السعيد.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/menu" className="btn-primary px-8 py-3 w-full sm:w-auto justify-center" style={{ background: 'var(--plum)', color: '#F4EFE6', border: '1px solid var(--plum)', borderRadius: '12px' }}>
                تصفح القائمة <ChevronLeft size={18} />
              </Link>
              <Link href="/gallery" className="btn-secondary px-8 py-3 w-full sm:w-auto justify-center" style={{ borderColor: 'var(--gold-dark)', color: 'var(--gold)', background: 'transparent', borderRadius: '12px' }}>
                معرض الصور
              </Link>
            </div>
          </div>
          <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800"
            alt="صورة بيت المندي"
            className="w-full h-[300px] md:h-[420px] object-cover rounded-3xl shadow-2xl"
          />
          <div className="absolute -bottom-5 -right-5 md:-right-6 rounded-2xl p-4 md:p-6 font-black text-lg md:text-xl" style={{ background: 'var(--plum)', color: '#F4EFE6', boxShadow: '0 8px 30px rgba(116, 19, 58, 0.4)' }}>
             الأفضل في صنعاء
          </div>
        </div>
        </div>
      </section>

      {/* ━━━━━━━ REVIEWS ━━━━━━━ */}
      {reviews.length > 0 && (
        <section className="bg-[rgba(212,160,23,0.03)] py-20 px-4">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="title-gold text-3xl md:text-4xl mb-3">آراء عملائنا</h2>
              <p className="text-[var(--text-secondary)]">ماذا يقول زوارنا الكرام</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map(review => (
                <div key={review.id} className="glass-card p-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Award key={s} size={18} color="var(--gold)" fill="var(--gold)" />
                    ))}
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed mb-6 text-sm md:text-base">
                    "{review.comment_ar}"
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[var(--maroon)] to-[var(--gold)] rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {review.reviewer_name.charAt(0)}
                      </div>
                      <span className="font-bold">{review.reviewer_name}</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] bg-[var(--glass-bg)] px-3 py-1 rounded-md">
                      {review.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ━━━━━━━ CONTACT & BRANCHES ━━━━━━━ */}
      <section id="contact" className="container py-20 px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="title-gold text-3xl md:text-4xl mb-3">فروعنا والتواصل</h2>
          <p className="text-[var(--text-secondary)]">تفضّل بزيارتنا أو تواصل معنا للطلب والحجز</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'الفرع الرئيسي',
              address: 'صنعاء - نهاية شارع الرباط، بداية شارع الستين',
              phone: '01/465888',
              hours: 'يومياً 11:00 ص - 12:00 م',
            }
          ].map((branch, i) => (
            <div key={i} className="glass-panel p-8">
              <h3 className="text-2xl mb-6 text-gold">{branch.title}</h3>
              <div className="flex flex-col gap-4">
                <div className="flex gap-3 items-start">
                  <MapPin size={22} color="var(--gold)" className="shrink-0 mt-1" />
                  <p className="text-[var(--text-secondary)] leading-relaxed">{branch.address}</p>
                </div>
                <div className="flex gap-3 items-center">
                  <Phone size={22} color="var(--gold)" className="shrink-0" />
                  <p className="text-[var(--text-secondary)]">{branch.phone}</p>
                </div>
                <div className="flex gap-3 items-center">
                  <Clock size={22} color="var(--gold)" className="shrink-0" />
                  <p className="text-[var(--text-secondary)]">{branch.hours}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Delivery card */}
          <div style={{ background: '#251717', border: '1px solid rgba(197,155,95,0.15)', borderRadius: '16px', padding: '32px' }}>
            <h3 className="text-2xl mb-6 text-right" style={{ color: '#00E676', fontWeight: 800 }}>التوصيل والطلب</h3>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4 items-center">
                <Truck size={28} color="#00E676" className="shrink-0" />
                <p style={{ color: 'var(--gold)', fontSize: '1.1rem', fontWeight: 600 }}>خدمة توصيل سريعة لجميع أحياء صنعاء</p>
              </div>
              <div className="flex flex-row-reverse justify-end gap-3 flex-wrap mt-2">
                <a href="https://wa.me/967779898617" target="_blank" rel="noopener noreferrer" style={{ background: '#25D366', color: '#fff', borderRadius: '12px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.3s' }} className="hover:-translate-y-1 hover:shadow-lg">
                  واتساب: 779898617
                  <WhatsAppIcon size={20} color="#fff" />
                </a>
                <a href="tel:+967775577200" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '12px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.3s' }} className="hover:-translate-y-1 hover:border-[var(--gold)] hover:shadow-lg">
                  775577200
                  <Phone size={20} color="var(--gold)" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
