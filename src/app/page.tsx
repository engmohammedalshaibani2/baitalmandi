'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Phone, MapPin, ChevronLeft, Pause, Play, Star, Clock, Truck } from 'lucide-react';

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
      <section style={{
        position: 'relative',
        minHeight: '92vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(150deg, #2d0a10 0%, #1C1C1E 45%, #1a0808 100%)',
      }}>
        {/* Animated particle background */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(var(--gold) 1px, transparent 1px)', backgroundSize: '40px 40px', animation: 'fadeIn 3s ease-in-out' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(123,28,42,0.4) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(212,160,23,0.08) 0%, transparent 60%)' }} />

        <div className="container animate-fade-in relative z-10 py-16 px-4 md:px-8">
          <div className="inline-block bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.3)] rounded-full px-5 py-1.5 mb-6 text-gold text-sm font-semibold tracking-wider">
            🍽️ مطعم يمني أصيل
          </div>
          <h1 className="neon-text text-5xl md:text-7xl lg:text-8xl mb-5 font-[var(--font-tajawal)] leading-tight">
            بيت المندي
          </h1>
          <p className="text-base md:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
            أصالة الطعم اليمني العريق... تجربة فريدة تأخذك إلى قلب التراث
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/menu" className="btn-primary text-lg px-10 py-4 rounded-2xl w-full sm:w-auto">
               اطلب الآن
            </Link>
            <Link href="#contact" className="btn-secondary text-lg px-10 py-4 rounded-2xl w-full sm:w-auto">
              <MapPin size={20} /> الموقع والفروع
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--text-muted)] text-xs animate-[fadeIn_2s_ease_1s_both] hidden md:flex">
            <div className="w-px h-10 bg-gradient-to-b from-transparent to-[var(--gold)] animate-[pulse-gold_2s_infinite]" />
            تمرير للأسفل
          </div>
        </div>
      </section>

      {/* ━━━━━━━ QUICK INFO ━━━━━━━ */}
      <section className="px-4 md:px-8 -mt-8 relative z-10">
        <div className="container glass-panel p-6 flex flex-col lg:flex-row justify-around items-center gap-8 lg:gap-4 border-[rgba(212,160,23,0.35)]">
          <div className="flex items-center justify-start gap-4 w-full max-w-[260px] mx-auto lg:mx-0">
            <div className="bg-[rgba(212,160,23,0.1)] p-3 rounded-xl shrink-0">
              <Phone size={24} color="var(--gold)" />
            </div>
            <div className="text-right">
              <p className="font-extrabold text-lg">للحجز: 01/465888</p>
              <p className="text-sm text-[var(--text-secondary)]">واتساب: 779898617</p>
            </div>
          </div>
          <div className="hidden lg:block w-px h-10 bg-[var(--border)] shrink-0" />
          <div className="flex items-center justify-start gap-4 w-full max-w-[260px] mx-auto lg:mx-0">
            <div className="bg-[rgba(212,160,23,0.1)] p-3 rounded-xl shrink-0">
              <MapPin size={24} color="var(--gold)" />
            </div>
            <div className="text-right">
              <p className="font-extrabold text-lg">صنعاء - شارع الستين</p>
              <p className="text-sm text-[var(--text-secondary)]">نهاية شارع الرباط</p>
            </div>
          </div>
          <div className="hidden lg:block w-px h-10 bg-[var(--border)] shrink-0" />
          <div className="flex items-center justify-start gap-4 w-full max-w-[260px] mx-auto lg:mx-0">
            <div className="bg-[rgba(212,160,23,0.1)] p-3 rounded-xl shrink-0">
              <Clock size={24} color="var(--gold)" />
            </div>
            <div className="text-right">
              <p className="font-extrabold text-lg">يومياً 6ص - 12م</p>
              <p className="text-sm text-[var(--text-secondary)]">بما فيها الجمعة</p>
            </div>
          </div>
          <Link href="/menu" className="btn-primary px-8 py-3 rounded-xl mt-2 w-full max-w-[260px] lg:w-auto mx-auto lg:mx-0">
            اطلب الآن ←
          </Link>
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

      {/* ━━━━━━━ STATS ━━━━━━━ */}
      <section className="container py-16 px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'طلب تم تسليمه', value: counters.orders.toLocaleString('ar-SA') + '+', icon: '🍽️' },
            { label: 'عميل سعيد', value: counters.customers.toLocaleString('ar-SA') + '+', icon: '😊' },
            { label: 'سنة من الخبرة', value: counters.years + '+', icon: '⭐' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-8 text-center">
              <div className="text-4xl mb-4">{stat.icon}</div>
              <div className="neon-text text-5xl font-black leading-none">{stat.value}</div>
              <div className="text-[var(--text-secondary)] mt-4 text-lg">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━ ABOUT ━━━━━━━ */}
      <section className="container grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-20 px-4 md:px-8">
        <div>
          <div className="inline-block bg-[rgba(123,28,42,0.1)] border border-[rgba(123,28,42,0.3)] rounded-full px-4 py-1.5 mb-5 text-[var(--maroon-light)] text-sm font-semibold">
             قصتنا
          </div>
          <h2 className="title-gold text-3xl md:text-5xl mb-6 leading-tight">طعم الأصالة اليمنية</h2>
          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed mb-4">
            في بيت المندي، نقدم لكم تجربة طعام يمنية أصيلة تعكس تراثنا الغني. نستخدم أجود أنواع اللحوم الطازجة والبهارات المحضرة بعناية لضمان الطعم الفريد الذي يميزنا.
          </p>
          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
            كل طبق نعده هو مزيج من الشغف والتقاليد التي توارثناها عن أجدادنا في أرض اليمن السعيد.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/menu" className="btn-primary px-8 py-3 rounded-xl w-full sm:w-auto justify-center">
              تصفح القائمة <ChevronLeft size={18} />
            </Link>
            <Link href="/gallery" className="btn-secondary px-8 py-3 rounded-xl w-full sm:w-auto justify-center">
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
          <div className="absolute -bottom-5 -right-5 md:-right-6 bg-[var(--gold)] text-[var(--maroon-dark)] rounded-2xl p-4 md:p-6 font-black text-lg md:text-xl shadow-[0_8px_30px_rgba(212,160,23,0.5)]">
             الأفضل في صنعاء
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
                      <Star key={s} size={18} fill={s <= review.rating ? 'var(--gold)' : 'none'} color="var(--gold)" />
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
          <div className="glass-panel p-8 bg-[rgba(37,211,102,0.05)] border-[rgba(37,211,102,0.2)]">
            <h3 className="text-2xl mb-6 text-[#25D366]">التوصيل والطلب</h3>
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 items-center">
                <Truck size={22} color="#25D366" className="shrink-0" />
                <p className="text-[var(--text-secondary)]">خدمة توصيل سريعة لجميع أحياء صنعاء</p>
              </div>
              <div className="flex gap-3 flex-wrap mt-2">
                <a href="https://wa.me/967779898617" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#25D366] text-white px-5 py-3 rounded-xl font-bold text-sm md:text-base w-full sm:w-auto justify-center transition-transform hover:-translate-y-1">
                   واتساب: 779898617 📱
                </a>
                <a href="tel:+967775577200" className="flex items-center gap-2 bg-[var(--glass-bg)] border border-[var(--border)] text-[var(--text-primary)] px-5 py-3 rounded-xl font-bold text-sm md:text-base w-full sm:w-auto justify-center transition-transform hover:-translate-y-1">
                   775577200 📞
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
