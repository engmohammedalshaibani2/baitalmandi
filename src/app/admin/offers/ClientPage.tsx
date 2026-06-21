'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { getOffers, getAllActiveItems, updateOffer, deleteOfferItems, insertOfferItems, createOffer, deleteOffer, toggleOfferActive } from '@/repositories/offerRepository';
import { calculateOfferPrice, resolveItemPrice, offerTypeLabel } from '@/lib/offer-pricing';
import { Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react';
import { useSettings } from '@/lib/settings-context';
import { useOrderRealtime } from '@/realtime/OrderRealtimeProvider';

const OFFER_TYPES = ['fixed_price', 'percentage_discount', 'amount_discount', 'free_item'] as const;

interface BundleRow {
  itemId: string;
  priceId: string;
  quantity: number;
}

export default function AdminOffersPage() {
  const { settings } = useSettings();
  const currency = settings['currency'] || 'ريال';
  const [offers, setOffers] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [offerType, setOfferType] = useState<string>('fixed_price');
  const [salePrice, setSalePrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const { subscribeToTable } = useOrderRealtime();
  const [bundleItems, setBundleItems] = useState<BundleRow[]>([{ itemId: '', priceId: '', quantity: 1 }]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const unsubs = ['offers', 'items', 'item_prices'].map(t => subscribeToTable(t, () => { fetchData(); }));
    return () => { unsubs.forEach(u => u()); };
  }, [subscribeToTable]);

  async function fetchData() {
    const [offersData, itemsData] = await Promise.all([
      getOffers(),
      getAllActiveItems(),
    ]);
    if (offersData) setOffers(offersData);
    if (itemsData) setMenuItems(itemsData);
    setLoading(false);
  }

  const resetForm = () => {
    setTitle(''); setDescription(''); setOfferType('fixed_price');
    setSalePrice(''); setDiscountPercent(''); setDiscountAmount('');
    setImageUrl(''); setEndDate(''); setIsActive(true);
    setBundleItems([{ itemId: '', priceId: '', quantity: 1 }]);
    setIsEditing(false); setEditingId(null);
  };

  const handleEdit = (offer: any) => {
    setTitle(offer.title_ar);
    setDescription(offer.description_ar || '');
    setOfferType(offer.offer_type || 'percentage_discount');
    setSalePrice(offer.sale_price?.toString() || '');
    setDiscountPercent(offer.discount_percent?.toString() || '');
    setDiscountAmount(offer.discount_amount?.toString() || '');
    setImageUrl(offer.image || '');
    setIsActive(offer.is_active !== false);
    if (offer.end_date) setEndDate(offer.end_date.split('T')[0]);

    if (offer.offer_items && offer.offer_items.length > 0) {
      setBundleItems(offer.offer_items.map((oi: any) => ({
        itemId: oi.menu_item_id,
        priceId: oi.price_id || '',
        quantity: oi.quantity,
      })));
    } else if (offer.item_id) {
      setBundleItems([{ itemId: offer.item_id, priceId: '', quantity: 1 }]);
    } else {
      setBundleItems([{ itemId: '', priceId: '', quantity: 1 }]);
    }

    setEditingId(offer.id);
    setIsEditing(true);
  };

  /** Compute the effective unit price for a bundle row */
  const getRowPrice = (row: BundleRow): number => {
    const item = menuItems.find((i: any) => i.id === row.itemId);
    if (!item) return 0;
    const prices = item.item_prices || [];
    const { effectivePrice } = resolveItemPrice(prices, row.priceId || undefined);
    return effectivePrice;
  };

  const bundlePricing = useMemo(() => {
    const items = bundleItems
      .map(b => {
        if (!b.itemId) return null;
        const item = menuItems.find((i: any) => i.id === b.itemId);
        if (!item) return null;
        const prices = item.item_prices || [];
        const { effectivePrice, priceId, variantName } = resolveItemPrice(prices, b.priceId || undefined);
        return {
          itemId: b.itemId,
          itemName: item.name_ar,
          quantity: b.quantity,
          unitPrice: effectivePrice,
          priceId,
          variantName,
        };
      })
      .filter(Boolean) as any[];

    return calculateOfferPrice({
      offerType: offerType as any,
      salePrice: salePrice ? parseFloat(salePrice) : undefined,
      discountPercent: discountPercent ? parseInt(discountPercent) : undefined,
      discountAmount: discountAmount ? parseFloat(discountAmount) : undefined,
      items,
    });
  }, [bundleItems, menuItems, offerType, salePrice, discountPercent, discountAmount]);

  /** Resolve unit_price for a single bundle row from menuItems state */
  const resolveRowPricing = (row: BundleRow) => {
    const item = menuItems.find((i: any) => i.id === row.itemId);
    if (!item) {
      console.warn(`[OFFER_ITEMS] Item ${row.itemId} not found in menuItems — using price 0`);
      return { effectivePrice: 0, priceId: null, variantName: null };
    }
    const prices = item.item_prices || [];
    const resolved = resolveItemPrice(prices, row.priceId || undefined);
    console.log(`[OFFER_ITEMS] Resolved price for ${item.name_ar}: unitPrice=${resolved.effectivePrice}, priceId=${resolved.priceId}, variant=${resolved.variantName}`);
    return {
      effectivePrice: resolved.effectivePrice,
      priceId: resolved.priceId || null,
      variantName: resolved.variantName || null,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const activeBundleItems = bundleItems.filter(b => b.itemId);

      // REQUIREMENT 4: Validate at least one item is selected
      if (activeBundleItems.length === 0) {
        throw new Error('Offer must contain at least one item');
      }

      // REQUIREMENT 5a: Log selected items before insert
      console.log('[OFFER_ITEMS] activeBundleItems:', JSON.parse(JSON.stringify(activeBundleItems)));

      const payload: any = {
        title_ar: title,
        title_en: title,
        description_ar: description || null,
        offer_type: offerType,
        sale_price: offerType === 'fixed_price' && salePrice ? salePrice : null,
        discount_percent: offerType === 'percentage_discount' && discountPercent ? parseInt(discountPercent) : null,
        discount_amount: offerType === 'amount_discount' && discountAmount ? discountAmount : null,
        image: imageUrl || null,
        start_date: new Date().toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: isActive,
        status: isActive ? 'active' : 'disabled',
        item_id: activeBundleItems.length === 1 ? activeBundleItems[0].itemId : null,
      };

      if (isEditing && editingId) {
        // ── UPDATE FLOW ──
        console.log('[OFFER_ITEMS] Editing offer:', editingId);
        await updateOffer(editingId, payload);

        await deleteOfferItems(editingId);

        // Resolve prices for each selected item
        const rowsToInsert = activeBundleItems.map(b => {
          const pricing = resolveRowPricing(b);
          return {
            offer_id: editingId,
            menu_item_id: b.itemId,
            quantity: b.quantity,
            price_id: pricing.priceId,
            variant_name: pricing.variantName,
            unit_price: String(pricing.effectivePrice),
          };
        });

        // REQUIREMENT 5b: Log final insert payload
        console.log('[OFFER_ITEMS] Insert payload (edit):', JSON.parse(JSON.stringify(rowsToInsert)));

        const inserted = await insertOfferItems(rowsToInsert);

        // REQUIREMENT 5c: Log number of inserted rows
        console.log(`[OFFER_ITEMS] Inserted ${inserted?.length || 0} offer_items rows (edit)`);
      } else {
        // ── CREATE FLOW ──
        console.log('[OFFER_ITEMS] Creating new offer');
        const data = await createOffer(payload);

        // Resolve prices for each selected item
        const rowsToInsert = activeBundleItems.map(b => {
          const pricing = resolveRowPricing(b);
          return {
            offer_id: data.id,
            menu_item_id: b.itemId,
            quantity: b.quantity,
            price_id: pricing.priceId,
            variant_name: pricing.variantName,
            unit_price: String(pricing.effectivePrice),
          };
        });

        // REQUIREMENT 5b: Log final insert payload
        console.log('[OFFER_ITEMS] Insert payload (create):', JSON.parse(JSON.stringify(rowsToInsert)));

        const inserted = await insertOfferItems(rowsToInsert);

        // REQUIREMENT 5c: Log number of inserted rows
        console.log(`[OFFER_ITEMS] Inserted ${inserted?.length || 0} offer_items rows (create)`);
      }

      resetForm();
      await fetchData();
    } catch (err: any) {
      console.error('[OFFER_ITEMS] Error in handleSubmit:', err);
      alert('حدث خطأ: ' + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العرض؟')) {
      await deleteOffer(id);
      await fetchData();
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const next = !current;
    await toggleOfferActive(id, next);
    setOffers(prev => prev.map(o => o.id === id ? { ...o, is_active: next, status: next ? 'active' : 'disabled' } : o));
  };

  const addBundleRow = () => setBundleItems(prev => [...prev, { itemId: '', priceId: '', quantity: 1 }]);
  const removeBundleRow = (idx: number) => {
    if (bundleItems.length <= 1) return;
    setBundleItems(prev => prev.filter((_, i) => i !== idx));
  };
  const updateBundleRow = (idx: number, field: 'itemId' | 'priceId' | 'quantity', value: any) => {
    setBundleItems(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      const updated = { ...row, [field]: field === 'quantity' ? Math.max(1, parseInt(value) || 1) : value };
      // Reset priceId when item changes
      if (field === 'itemId') updated.priceId = '';
      return updated;
    }));
  };

  return (
    <div>
      <h1 className="title-gold" style={{ fontSize: '2rem', marginBottom: '30px' }}>إدارة الباقات والعروض</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-8 items-start">

        {/* List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>الباقات الحالية ({offers.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {offers.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>لا توجد باقات. أضف باقة جديدة.</p>
            ) : (
              offers.map(offer => {
                const items = offer.offer_items || [];
                return (
                  <div key={offer.id} style={{
                    background: 'var(--bg-card)', borderRadius: '14px', overflow: 'hidden',
                    border: '1px solid var(--border)', opacity: offer.is_active !== false ? 1 : 0.6,
                  }}>
                    <div style={{ display: 'flex', gap: '15px', padding: '15px' }}>
                      {offer.image && (
                        <img src={offer.image} alt={offer.title_ar} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                          <h3 style={{ fontSize: '1.1rem' }}>{offer.title_ar}</h3>
                          <span style={{ fontSize: '0.78rem', padding: '2px 10px', borderRadius: '20px', background: 'rgba(197,155,95,0.15)', color: 'var(--gold)' }}>
                            {offerTypeLabel(offer.offer_type || 'percentage_discount')}
                          </span>
                        </div>
                        {items.length > 0 && (
                          <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {items.map((oi: any, idx: number) => (
                              <div key={idx} style={{ marginBottom: '2px' }}>
                                • {oi.menu_item?.name_ar || '—'} 
                                {oi.variant_name ? ` (${oi.variant_name})` : ''} 
                                × {oi.quantity}
                                {oi.unit_price ? ` = ${Number(oi.unit_price) * oi.quantity} ${currency}` : ''}
                              </div>
                            ))}
                          </div>
                        )}
                        {offer.end_date && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                            ينتهي: {new Date(offer.end_date).toLocaleDateString('ar-SA')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', padding: '10px 15px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.05)' }}>
                      <button onClick={() => handleToggleActive(offer.id, offer.is_active !== false)} style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                        background: offer.is_active !== false ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: offer.is_active !== false ? '#10b981' : '#ef4444',
                      }}>
                        {offer.is_active !== false ? '✓ مفعل' : '✕ معطل'}
                      </button>
                      <button onClick={() => handleEdit(offer)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', marginRight: 'auto' }}>
                        <Edit2 size={15} /> تعديل
                      </button>
                      <button onClick={() => handleDelete(offer.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <Trash2 size={15} /> حذف
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Form */}
        <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <Tag size={18} style={{ display: 'inline', marginLeft: '8px', color: 'var(--gold)' }} />
            {isEditing ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>اسم الباقة *</label>
              <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} required placeholder="مثال: باقة الحنيذ" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>نوع العرض</label>
              <select className="form-input" value={offerType} onChange={e => setOfferType(e.target.value)}>
                {OFFER_TYPES.map(t => (
                  <option key={t} value={t}>{offerTypeLabel(t)}</option>
                ))}
              </select>
            </div>

            {/* Bundle items with variant selection */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>منتجات الباقة</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bundleItems.map((row, idx) => {
                  const selectedItem = menuItems.find((i: any) => i.id === row.itemId);
                  const prices = selectedItem?.item_prices?.filter((p: any) => p.is_active !== false) || [];
                  const rowPrice = getRowPrice(row);
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select className="form-input" value={row.itemId} onChange={e => updateBundleRow(idx, 'itemId', e.target.value)} style={{ flex: 1 }}>
                          <option value="">اختر منتجاً</option>
                          {menuItems.map(item => (
                            <option key={item.id} value={item.id}>{item.name_ar}</option>
                          ))}
                        </select>
                        <input type="number" min="1" className="form-input" value={row.quantity} onChange={e => updateBundleRow(idx, 'quantity', e.target.value)} style={{ width: '60px', textAlign: 'center' }} />
                        <button type="button" onClick={() => removeBundleRow(idx)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', display: 'flex' }}>
                          <X size={14} />
                        </button>
                      </div>
                      {/* Variant selector — show only if item has multiple sizes */}
                      {prices.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginRight: '0' }}>
                          <select
                            className="form-input"
                            value={row.priceId}
                            onChange={e => updateBundleRow(idx, 'priceId', e.target.value)}
                            style={{ flex: 1, fontSize: '0.85rem' }}
                          >
                            <option value="">أفضل سعر تلقائي ({rowPrice} {currency})</option>
                            {prices.map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {p.size_label_ar} — {Number(p.sale_price || p.original_price)} {currency}
                                {p.sale_price ? ` (كان ${p.original_price})` : ''}
                              </option>
                            ))}
                          </select>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{rowPrice} {currency}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button type="button" onClick={addBundleRow} className="btn-secondary" style={{ padding: '8px', fontSize: '0.85rem' }}>
                  <Plus size={14} /> إضافة منتج
                </button>
              </div>
            </div>

            {offerType === 'fixed_price' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>سعر الباقة الثابت</label>
                <input type="number" min="1" className="form-input" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="مثال: 1500" />
              </div>
            )}

            {offerType === 'percentage_discount' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>نسبة الخصم (%)</label>
                <input type="number" min="1" max="99" className="form-input" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} placeholder="مثال: 20" />
              </div>
            )}

            {offerType === 'amount_discount' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>مبلغ الخصم</label>
                <input type="number" min="1" className="form-input" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} placeholder="مثال: 500" />
              </div>
            )}

            {offerType === 'free_item' && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>أرخص منتج في الباقة سيكون مجاناً.</p>
            )}

            {/* Live Pricing */}
            {bundleItems.some(b => b.itemId) && (
              <div style={{ background: 'var(--glass-bg)', borderRadius: '10px', padding: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <span>السعر الأصلي</span>
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{bundlePricing.originalPrice} {currency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#10b981' }}>
                  <span>الخصم</span>
                  <span>-{bundlePricing.discountAmount} {currency} ({bundlePricing.discountPercent}%)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: 'var(--gold)', fontSize: '1rem', borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '4px' }}>
                  <span>السعر النهائي</span>
                  <span>{bundlePricing.finalPrice} {currency}</span>
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>الوصف</label>
              <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>صورة الباقة</label>
              {imageUrl && (
                <div style={{ marginBottom: '10px', position: 'relative', display: 'inline-block' }}>
                  <img src={imageUrl} alt="" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                  <button type="button" onClick={() => setImageUrl('')} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>×</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                <label className="btn-secondary" style={{ display: 'block', textAlign: 'center', cursor: 'pointer', padding: '10px' }}>
                  {loading && !imageUrl ? 'جاري الرفع...' : 'رفع صورة'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                    if (!e.target.files || e.target.files.length === 0) return;
                    setLoading(true);
                    const file = e.target.files[0];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const { error } = await supabase.storage.from('offers').upload(fileName, file);
                    if (error) alert('خطأ: ' + error.message);
                    else {
                      const { data } = supabase.storage.from('offers').getPublicUrl(fileName);
                      setImageUrl(data.publicUrl);
                    }
                    setLoading(false);
                  }} />
                </label>
                <input type="url" className="form-input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="أو أدخل رابط الصورة..." />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>تاريخ انتهاء العرض</label>
              <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ accentColor: 'var(--gold)', width: '16px', height: '16px' }} />
              الباقة مفعلة
            </label>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                {isEditing ? <><Save size={18} /> حفظ</> : <><Plus size={18} /> إضافة</>}
              </button>
              {isEditing && <button type="button" onClick={resetForm} className="btn-secondary" style={{ padding: '12px' }}><X size={18} /></button>}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
