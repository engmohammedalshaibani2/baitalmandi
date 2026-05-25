'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, Plus, Tag, Search } from 'lucide-react';

export default function MenuPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const addToCart = useCartStore((state) => state.addToCart);
  const cartTotalItems = useCartStore((state) => state.getTotalItems());
  const cartItems = useCartStore((state) => state.items);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [{ data: catsData }, { data: menuData }, { data: offersData }] = await Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('items').select('*, categories(name_ar), item_prices(*)').order('sort_order', { ascending: true }),
      supabase.from('offers').select('*, items(name_ar, item_prices(*))').eq('is_active', true).order('created_at', { ascending: false }),
    ]);

    if (catsData) setCategories(catsData);
    if (menuData) setItems(menuData);
    if (offersData) setOffers(offersData);
    setLoading(false);
  }

  const filteredItems = items.filter(item => {
    const matchCategory = activeCategory === 'all' || item.category_id === activeCategory;
    const matchSearch = !searchQuery || item.name_ar?.includes(searchQuery) || (item.description_ar || '').includes(searchQuery);
    return matchCategory && matchSearch;
  });

  const isInCart = (itemId: string) => cartItems.some(ci => ci.id.startsWith(itemId));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 15px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>جاري تحميل القائمة...</p>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: '120px' }}>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--maroon-dark) 0%, var(--maroon) 100%)',
        padding: '60px 20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(var(--gold) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="title-gold" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: 0, fontFamily: 'var(--font-tajawal)' }}>قائمة الطعام</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '1.1rem' }}>اكتشف أشهى الأطباق اليمنية الأصيلة</p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '40px' }}>

        {/* Offers Section */}
        {offers.length > 0 && (
          <section id="offers" style={{ marginBottom: '60px' }}>
            <h2 className="title-gold" style={{ fontSize: '2rem', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Tag size={28} /> عروض اليوم
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {offers.map(offer => (
                <div key={offer.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-5px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {offer.image_url && (
                    <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                      <img src={offer.image_url} alt={offer.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--maroon)', color: '#fff', padding: '5px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
                        خصم {offer.discount_percent}%
                      </span>
                    </div>
                  )}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>{offer.title}</h3>
                    {offer.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px', flex: 1 }}>{offer.description}</p>}
                    {offer.items && offer.items.item_prices && offer.items.item_prices.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <div>
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.95rem', marginLeft: '8px' }}>{offer.items.item_prices[0].original_price} ريال</span>
                          <span className="neon-text" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {Number(offer.items.item_prices[0].original_price) * (1 - offer.discount_percent / 100)} ريال
                          </span>
                        </div>
                        <button
                          className="btn-primary"
                          style={{ padding: '8px 18px', fontSize: '0.9rem', borderRadius: '10px' }}
                          onClick={() => addToCart({
                            id: `offer_${offer.id}`,
                            name: `${offer.title} — ${offer.items.name_ar}`,
                            price: Number(offer.items.item_prices[0].original_price) * (1 - offer.discount_percent / 100),
                            quantity: 1,
                            image: offer.image_url || offer.items.image
                          })}
                        >
                          <Plus size={16} /> إضافة
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Search + Categories */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 md:items-center">
          {/* Search */}
          <div className="relative w-full md:w-[320px] shrink-0">
            <Search size={18} className="absolute top-1/2 right-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              className="form-input w-full pr-11"
              placeholder="ابحث عن طبق..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 flex-1 w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
            <button
              onClick={() => setActiveCategory('all')}
              className={`${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'} whitespace-nowrap px-5 py-2 rounded-full text-sm shrink-0`}
            >
              الكل ({items.filter(i => i.is_available).length})
            </button>
            {categories.map(cat => {
              const count = items.filter(i => i.category_id === cat.id && i.is_available).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'} whitespace-nowrap px-5 py-2 rounded-full text-sm shrink-0`}
                >
                  {cat.name_ar} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.3rem', marginBottom: '10px' }}>لا توجد أطباق تطابق بحثك</p>
            <button onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} className="btn-secondary" style={{ marginTop: '15px' }}>
              إعادة ضبط الفلتر
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
            {filteredItems.map(item => (
              <div key={item.id} className="glass-panel" style={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                opacity: item.is_available ? 1 : 0.55,
                transition: 'transform 0.3s',
              }}
                onMouseEnter={e => item.is_available && (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {item.image ? (
                  <div style={{ height: '220px', overflow: 'hidden', position: 'relative' }}>
                    <img src={item.image} alt={item.name_ar} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                    {item.is_best_seller && (
                      <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--gold)', color: 'var(--maroon-dark)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800 }}>
                        ⭐ الأكثر مبيعاً
                      </span>
                    )}
                    {!item.is_available && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ background: 'rgba(239,68,68,0.9)', color: '#fff', padding: '8px 20px', borderRadius: '8px', fontWeight: 700 }}>غير متاح حالياً</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ height: '200px', background: 'linear-gradient(135deg, var(--maroon-dark), var(--maroon))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '3rem', opacity: 0.4 }}>🍽️</span>
                  </div>
                )}

                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.25rem', lineHeight: 1.3 }}>{item.name_ar}</h3>
                    {item.categories?.name_ar && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--glass-bg)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border)', whiteSpace: 'nowrap', marginRight: '8px' }}>
                        {item.categories.name_ar}
                      </span>
                    )}
                  </div>
                  {item.description_ar && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px', lineHeight: 1.6, flex: 1 }}>
                      {item.description_ar}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                    {item.item_prices && item.item_prices.map((price: any) => (
                      <div key={price.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.95rem' }}>{price.size_label_ar}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <span className="title-gold" style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                            {price.sale_price || price.original_price} ريال
                          </span>
                          <button
                            className={isInCart(price.id) ? 'btn-secondary' : 'btn-primary'}
                            disabled={!item.is_available}
                            onClick={() => addToCart({
                              id: price.id,
                              name: `${item.name_ar} (${price.size_label_ar})`,
                              price: Number(price.sale_price || price.original_price),
                              quantity: 1,
                              image: item.image
                            })}
                            style={{ padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                          >
                            <Plus size={16} />
                            {isInCart(price.id) ? 'في السلة' : 'أضف'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!item.item_prices || item.item_prices.length === 0) && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>السعر غير متوفر</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartTotalItems > 0 && (
        <div style={{
          position: 'fixed', bottom: '30px', left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 1000,
        }}>
          <Link href="/my-orders" style={{ pointerEvents: 'auto' }}>
            <div className="btn-primary" style={{
              padding: '16px 48px', borderRadius: '40px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px var(--gold-dark)',
              display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.15rem'
            }}>
              <ShoppingCart size={24} />
              <span>إتمام الطلب</span>
              <span style={{ background: 'var(--maroon)', color: 'white', padding: '3px 12px', borderRadius: '20px', fontSize: '1rem', fontWeight: 800 }}>
                {cartTotalItems}
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
