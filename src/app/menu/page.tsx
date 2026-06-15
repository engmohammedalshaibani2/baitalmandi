'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase';
import { calculateOfferPrice, resolveItemPrice, offerTypeLabel } from '@/lib/offer-pricing';
import { useSettings } from '@/lib/settings-context';
import { ShoppingCart, Plus, Tag, Search, Percent, Gift } from 'lucide-react';

export default function MenuPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const addToCart = useCartStore((state) => state.addToCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const cartTotalItems = useCartStore((state) => state.getTotalItems());
  const cartItems = useCartStore((state) => state.items);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { settings } = useSettings();
  const currency = settings['currency'] || 'ريال';

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const now = new Date().toISOString();
    const [{ data: catsData }, { data: menuData }, { data: offersData }] = await Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('items').select('*, categories(name_ar), item_prices(*)').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('offers').select(`
        *,
        offer_items(*, menu_item:menu_item_id(*, item_prices(*)))
      `)
        .eq('status', 'active')
        .eq('is_active', true)
        .is('deleted_at', null)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false }),
    ]);

    if (catsData) setCategories(catsData);
    if (menuData) setItems(menuData);
    if (offersData) {
      // [DIAGNOSE] Trace raw offer data from Supabase
      console.group('[DIAGNOSE] Raw offers from Supabase');
      offersData.forEach((offer: any) => {
        console.log('offer.id:', offer.id);
        console.log('offer.title_ar:', offer.title_ar);
        console.log('offer.offer_type:', offer.offer_type);
        console.log('offer.discount_percent:', offer.discount_percent);
        console.log('offer.discount_amount:', offer.discount_amount);
        (offer.offer_items || []).forEach((oi: any, idx: number) => {
          console.log(`  offer_items[${idx}]:`, {
            id: oi.id,
            menu_item_id: oi.menu_item_id,
            quantity: oi.quantity,
            unit_price: oi.unit_price,
            price_id: oi.price_id,
            variant_name: oi.variant_name,
            menu_item_exists: !!oi.menu_item,
            menu_item_name: oi.menu_item?.name_ar,
          });
        });
      });
      console.groupEnd();
      setOffers(offersData);
    }
    setLoading(false);
  }

  const offersWithPricing = useMemo(() => {
    const result = offers.map(offer => {
      const bundleItems = (offer.offer_items || []).map((oi: any) => {
        const menuItem = oi.menu_item;
        const prices = menuItem?.item_prices || [];
        // Primary: use stored unit_price from offer_items (saved at offer creation time)
        let unitPrice = oi.unit_price ? Number(oi.unit_price) : 0;
        // Fallback: if unit_price is 0, resolve from item_prices
        if (unitPrice === 0 && prices.length > 0) {
          const resolved = resolveItemPrice(prices, oi.price_id || undefined);
          unitPrice = resolved.effectivePrice;
          console.log(`[DIAGNOSE] Fallback resolveItemPrice for ${menuItem?.name_ar}: stored=${oi.unit_price}, resolved=${resolved.effectivePrice}`);
        }
        return {
          itemId: menuItem?.id || '',
          itemName: menuItem?.name_ar || '',
          quantity: oi.quantity,
          unitPrice,
          priceId: oi.price_id || '',
          variantName: oi.variant_name || '',
          sizeLabel: oi.variant_name || (prices.length > 0 ? prices[0]?.size_label_ar : undefined),
          categoryName: '',
          image: menuItem?.image || '',
        };
      });

      const pricingInput = {
        offerType: offer.offer_type || 'percentage_discount',
        salePrice: offer.sale_price ? Number(offer.sale_price) : undefined,
        discountPercent: offer.discount_percent || undefined,
        discountAmount: offer.discount_amount ? Number(offer.discount_amount) : undefined,
        items: bundleItems,
      };
      // [DIAGNOSE] Trace calculateOfferPrice input/output
      console.group(`[DIAGNOSE] calculateOfferPrice for ${offer.title_ar}`);
      console.log('bundleItems:', bundleItems.map((bi: any) => ({ itemName: bi.itemName, unitPrice: bi.unitPrice, quantity: bi.quantity })));
      console.log('input:', JSON.parse(JSON.stringify(pricingInput)));
      const pricing = calculateOfferPrice(pricingInput);
      console.log('output:', JSON.parse(JSON.stringify(pricing)));
      console.groupEnd();

      return { ...offer, _pricing: pricing, _bundleItems: bundleItems };
    });

    // [DIAGNOSE] Warn about invalid prices
    result.forEach((offer: any) => {
      if (offer._pricing.originalPrice <= 0 || offer._pricing.finalPrice <= 0) {
        console.warn(`[INVALID_OFFER_PRICE] offer_id: ${offer.id}, name: ${offer.title_ar}, originalPrice: ${offer._pricing.originalPrice}, finalPrice: ${offer._pricing.finalPrice}`);
      }
    });

    return result;
  }, [offers]);

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
        {offersWithPricing.length > 0 && (
          <section id="offers" style={{ marginBottom: '60px' }}>
            <h2 className="title-gold" style={{ fontSize: '2rem', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Tag size={28} /> العروض والباقات
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {offersWithPricing.map(offer => {
                const p = offer._pricing;
                const items = offer._bundleItems;
                return (
                  <div key={offer.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s', border: '1px solid rgba(197,155,95,0.2)' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    {offer.image && (
                      <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                        <img src={offer.image} alt={offer.title_ar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--maroon)', color: '#fff', padding: '5px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Percent size={14} /> وفر {p.discountPercent}%
                        </span>
                      </div>
                    )}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '1.3rem', margin: 0 }}>{offer.title_ar}</h3>
                        <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: '20px', background: 'rgba(197,155,95,0.15)', color: 'var(--gold)', whiteSpace: 'nowrap' }}>
                          {offerTypeLabel(offer.offer_type || 'percentage_discount')}
                        </span>
                      </div>

                      {/* Bundle items */}
                      <div style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {items.map((bi: any, idx: number) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <span style={{ color: 'var(--gold)' }}>•</span>
                            <span>{bi.itemName} <strong style={{ color: 'var(--text-primary)' }}>×{bi.quantity}</strong></span>
                          </div>
                        ))}
                      </div>

                      {offer.description_ar && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px', flex: 1 }}>{offer.description_ar}</p>
                      )}

                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                        <div>
                          {p.originalPrice > p.finalPrice && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                              <span style={{ textDecoration: 'line-through' }}>{p.originalPrice} {currency}</span>
                              <span style={{ color: '#10b981', marginRight: '8px', fontWeight: 600 }}>وفر {p.savings} {currency}</span>
                            </div>
                          )}
                          <span className="neon-text" style={{ fontSize: '1.6rem', fontWeight: 900 }}>{p.finalPrice} {currency}</span>
                        </div>
                        {(() => {
                          const offerCartId = `offer_${offer.id}`;
                          const cartOffer = cartItems.find(ci => ci.id === offerCartId);
                          if (cartOffer) {
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  className="btn-secondary"
                                  onClick={() => {
                                    if (cartOffer.quantity <= 1) {
                                      removeFromCart(offerCartId);
                                    } else {
                                      updateQuantity(offerCartId, cartOffer.quantity - 1);
                                    }
                                  }}
                                  style={{ width: '34px', height: '34px', padding: 0, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700 }}
                                >−</button>
                                <span style={{ fontSize: '1rem', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>{cartOffer.quantity}</span>
                                <button
                                  className="btn-primary"
                                  onClick={() => updateQuantity(offerCartId, cartOffer.quantity + 1)}
                                  style={{ width: '34px', height: '34px', padding: 0, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700 }}
                                >+</button>
                              </div>
                            );
                          }
                          return (
                            <button
                              className="btn-primary"
                              style={{ padding: '8px 18px', fontSize: '0.9rem', borderRadius: '10px' }}
                              onClick={() => addToCart({
                                id: `offer_${offer.id}`,
                                name: `باقة: ${offer.title_ar}`,
                                price: p.finalPrice,
                                quantity: 1,
                                image: offer.image || '',
                                isOffer: true,
                                offerId: offer.id,
                                offerType: offer.offer_type || 'percentage_discount',
                                originalPrice: p.originalPrice,
                                discountAmount: p.discountAmount,
                                discountPercent: p.discountPercent,
                                bundleItems: items.map((bi: any) => ({
                                  id: bi.itemId,
                                  name: bi.itemName,
                                  price: bi.unitPrice,
                                  quantity: bi.quantity,
                                  size: bi.variantName || bi.sizeLabel,
                                })),
                              })}
                            >
                              <Plus size={16} /> أضف الباقة
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Search + Categories */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 md:items-center">
          {/* Search */}
          <div className="relative w-full md:w-[320px] shrink-0">
            <Search size={18} className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              className="form-input w-full"
              placeholder="ابحث عن طبق..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingRight: '48px', paddingLeft: '16px' }}
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
                    {item.item_prices && item.item_prices.map((price: any) => {
                      const cartItem = cartItems.find(ci => ci.id === price.id);
                      return (
                      <div key={price.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.95rem' }}>{price.size_label_ar}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="title-gold" style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                            {price.sale_price || price.original_price} {currency}
                          </span>
                          {cartItem ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                className="btn-secondary"
                                disabled={!item.is_available}
                                onClick={() => {
                                  if (cartItem.quantity <= 1) {
                                    removeFromCart(price.id);
                                  } else {
                                    updateQuantity(price.id, cartItem.quantity - 1);
                                  }
                                }}
                                style={{ width: '32px', height: '32px', padding: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}
                              >−</button>
                              <span style={{ fontSize: '1rem', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>{cartItem.quantity}</span>
                              <button
                                className="btn-primary"
                                disabled={!item.is_available}
                                onClick={() => updateQuantity(price.id, cartItem.quantity + 1)}
                                style={{ width: '32px', height: '32px', padding: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}
                              >+</button>
                            </div>
                          ) : (
                            <button
                              className="btn-primary"
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
                              <Plus size={16} /> أضف
                            </button>
                          )}
                        </div>
                      </div>
                    );})}
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
          <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0,
              }}
              title="إلغاء جميع الطلبات"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <Link href="/my-orders">
              <div className="btn-primary" style={{
                padding: '14px 36px', borderRadius: '40px',
                display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1.1rem'
              }}>
                <ShoppingCart size={22} />
                <span>إتمام الطلب</span>
                <span style={{ background: 'var(--maroon)', color: 'white', padding: '3px 12px', borderRadius: '20px', fontSize: '1rem', fontWeight: 800 }}>
                  {cartTotalItems}
                </span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Clear Cart Confirmation Dialog */}
      {showClearConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="glass-panel"
            style={{ maxWidth: '400px', width: '100%', padding: '30px', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🗑️</div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: 'var(--text-primary)' }}>إلغاء جميع الطلبات</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>هل تريد إلغاء جميع الطلبات الحالية؟</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn-secondary"
                onClick={() => setShowClearConfirm(false)}
                style={{ padding: '10px 28px' }}
              >
                إلغاء
              </button>
              <button
                className="btn-danger"
                onClick={() => { clearCart(); setShowClearConfirm(false); }}
                style={{ padding: '10px 28px' }}
              >
                نعم، إلغاء الكل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
