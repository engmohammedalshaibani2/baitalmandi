'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp, DollarSign, Package, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMenuItems, getMenuCategories, getItemPrices, createItem, updateItem, deleteItem, deleteItemPrices, insertItemPrices, getItemSortOrder } from '@/repositories/menuRepository';
import { useSettings } from '@/lib/settings-context';
import { reindexSortOrders, shiftSortOrdersUp } from '@/lib/ordering';
import { useOrderRealtime } from '@/realtime/OrderRealtimeProvider';

export default function MenuPage() {
  const { subscribeToTable } = useOrderRealtime();
  const { settings } = useSettings();
  const currency = settings['currency'] || 'ريال';
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const emptyItem = {
    category_id: '', name_ar: '', name_en: '', description_ar: '', description_en: '', 
    image: '', is_available: true, is_best_seller: false, sort_order: 0
  };
  const [form, setForm] = useState(emptyItem);
  const [prices, setPrices] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchData = async () => {
    const [itemsData, catsData, pricesData] = await Promise.all([
      getMenuItems(),
      getMenuCategories(),
      getItemPrices()
    ]);

    if (catsData) setCategories(catsData);
    
    if (itemsData) {
      const itemsWithPrices = itemsData.map(item => ({
        ...item,
        prices: pricesData ? pricesData.filter((p: any) => p.item_id === item.id) : []
      }));
      setItems(itemsWithPrices);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const unsubs = ['items', 'item_prices'].map(t => subscribeToTable(t, () => { fetchData(); }));
    return () => { unsubs.forEach(u => u()); };
  }, [subscribeToTable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payloadBase = {
        category_id: form.category_id || null,
        name_ar: form.name_ar,
        name_en: form.name_en || form.name_ar,
        description_ar: form.description_ar || null,
        description_en: form.description_en || null,
        image: form.image || null,
        is_available: form.is_available,
        is_best_seller: form.is_best_seller,
      };

      let currentItemId = editingId;

      if (editingId) {
        const oldItem = await getItemSortOrder(editingId);
        const parsedSort = form.sort_order || oldItem?.sort_order || 0;
        await updateItem(editingId, { ...payloadBase, sort_order: parsedSort });

        if (parsedSort > 0 && oldItem && oldItem.category_id !== form.category_id) {
          await reindexSortOrders('items', 'category_id', oldItem.category_id);
        }
      } else {
        await shiftSortOrdersUp('items', 'category_id', form.category_id);
        console.log('[MENU_ORDER_CREATE]', {
          itemName: form.name_ar,
          categoryId: form.category_id,
          action: 'shift_existing_up',
        });

        const newItem = await createItem({ ...payloadBase, sort_order: 1 });
        currentItemId = newItem.id;

        await reindexSortOrders('items', 'category_id', form.category_id);
        console.log('[MENU_ORDER_CREATED]', {
          itemName: form.name_ar,
          categoryId: form.category_id,
          assignedOrder: 1,
        });
      }

      // Handle prices
      if (currentItemId) {
        await deleteItemPrices(currentItemId);
        const validPrices = prices.filter(p => p.size_label_ar && p.original_price).map(p => ({
          item_id: currentItemId,
          size_label_ar: p.size_label_ar,
          size_label_en: p.size_label_en || p.size_label_ar,
          original_price: p.original_price,
          sale_price: p.sale_price || null,
          is_active: p.is_active ?? true
        }));
        if (validPrices.length > 0) {
          await insertItemPrices(validPrices);
        }
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyItem);
      setPrices([]);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ: ' + err.message);
    }
    setSaving(false);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      category_id: item.category_id || '',
      name_ar: item.name_ar,
      name_en: item.name_en || '',
      description_ar: item.description_ar || '',
      description_en: item.description_en || '',
      image: item.image || '',
      is_available: item.is_available,
      is_best_seller: item.is_best_seller,
      sort_order: item.sort_order || 0
    });
    setPrices(item.prices.map((p: any) => ({ 
      size_label_ar: p.size_label_ar, 
      size_label_en: p.size_label_en || '',
      original_price: p.original_price,
      sale_price: p.sale_price || '',
      is_active: p.is_active
    })));
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصنف وجميع أسعاره؟')) return;
    try {
      await deleteItem(id);
      fetchData();
    } catch (err: any) {
      alert('حدث خطأ: ' + err.message);
    }
  };

  const addPriceRow = () => setPrices([...prices, { size_label_ar: '', size_label_en: '', original_price: '', sale_price: '', is_active: true }]);
  const removePriceRow = (idx: number) => setPrices(prices.filter((_, i) => i !== idx));
  const updatePrice = (idx: number, field: string, value: any) => {
    const updated = [...prices];
    updated[idx] = { ...updated[idx], [field]: value };
    setPrices(updated);
  };

  const filteredItems = filterCategory === 'all' ? items : items.filter(i => i.category_id === filterCategory);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>جاري التحميل...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 className="title-gold" style={{ fontSize: '2rem', marginBottom: '5px' }}>إدارة قائمة الطعام</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{items.length} صنف</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select className="form-input" style={{ width: 'auto' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">جميع الأقسام</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
          </select>
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyItem); setPrices([]); }}>
            <Plus size={20} /> إضافة صنف
          </button>
        </div>
      </div>

      {/* Item Form */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ fontSize: '1.3rem', color: 'var(--gold)' }}>{editingId ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h2>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>القسم *</label>
                <select className="form-input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required>
                  <option value="">اختر القسم</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>اسم الصنف (عربي) *</label>
                <input className="form-input" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} required placeholder="مثال: دجاج مندي" />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>الصورة (رابط أو رفع من الجهاز)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="form-input" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." style={{ direction: 'ltr', flex: 1 }} />
                  <label className="btn-secondary" style={{ cursor: 'pointer', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <Upload size={18} /> رفع
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                      if (!e.target.files || e.target.files.length === 0) return;
                      const file = e.target.files[0];
                      const fileExt = file.name.split('.').pop();
                      const fileName = `${Math.random()}.${fileExt}`;
                      const { error } = await supabase.storage.from('menu').upload(fileName, file);
                      if (error) alert('خطأ في الرفع: ' + error.message);
                      else {
                        const { data } = supabase.storage.from('menu').getPublicUrl(fileName);
                        setForm({ ...form, image: data.publicUrl });
                      }
                    }} />
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>الوصف (عربي)</label>
                <textarea className="form-input" value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} rows={2} placeholder="وصف الصنف" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>الترتيب</label>
                <input type="number" className="form-input" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>

              <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-end', gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_best_seller} onChange={e => setForm({ ...form, is_best_seller: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: 'var(--gold)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>الأكثر مبيعاً ⭐</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: 'var(--gold)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>متاح للطلب</span>
                </label>
              </div>
            </div>

            {/* Prices Section */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '25px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={20} /> الأسعار والأحجام *
                </h3>
                <button type="button" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={addPriceRow}>
                  <Plus size={16} /> حجم وسعر جديد
                </button>
              </div>
              {prices.map((price, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_1fr_1fr_40px] gap-4 mb-3 items-end">
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>الحجم (مثال: حبة كاملة) *</label>
                    <input className="form-input" value={price.size_label_ar} onChange={e => updatePrice(idx, 'size_label_ar', e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>السعر الأساسي *</label>
                    <input type="number" className="form-input" value={price.original_price} onChange={e => updatePrice(idx, 'original_price', e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>السعر بعد الخصم (اختياري)</label>
                    <input type="number" className="form-input" value={price.sale_price} onChange={e => updatePrice(idx, 'sale_price', e.target.value)} />
                  </div>
                  <button type="button" onClick={() => removePriceRow(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', paddingBottom: '13px' }}>
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              {prices.length === 0 && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>يجب إضافة حجم وسعر واحد على الأقل.</p>}
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>إلغاء</button>
              <button type="submit" className="btn-primary" disabled={saving || prices.length === 0}>
                <Save size={18} /> {saving ? 'جاري الحفظ...' : (editingId ? 'تحديث' : 'إضافة')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredItems.map(item => (
          <div key={item.id} className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {item.image ? (
                  <img src={item.image} alt={item.name_ar} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'var(--gold-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={24} color="var(--gold)" />
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '3px' }}>{item.name_ar}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {item.category?.name_ar || 'بدون قسم'} · {item.prices?.length} أحجام
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {item.is_best_seller && <span style={{ background: 'rgba(212, 160, 23, 0.15)', color: 'var(--gold)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>⭐ مميز</span>}
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, background: item.is_available ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: item.is_available ? '#10b981' : '#ef4444' }}>
                  {item.is_available ? 'متاح' : 'غير متاح'}
                </span>
                <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', padding: '8px' }}><Edit2 size={18} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}><Trash2 size={18} /></button>
                {expandedItem === item.id ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
              </div>
            </div>
            {/* Expanded Details */}
            {expandedItem === item.id && (
              <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                <div style={{ paddingTop: '15px' }}>
                  {item.description_ar && <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '0.95rem' }}>{item.description_ar}</p>}
                  {item.prices.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {item.prices.map((price: any) => (
                        <div key={price.id} style={{ padding: '10px 15px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>{price.size_label_ar}</span>
                          <strong style={{ color: 'var(--gold)' }}>{price.original_price} {currency}</strong>
                          {price.sale_price && <span style={{ color: '#10b981', display: 'block', fontSize: '0.8rem', marginTop: '4px' }}>عرض: {price.sale_price} {currency}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Package size={48} style={{ opacity: 0.3, marginBottom: '15px', display: 'inline-block' }} />
            <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>لا توجد أطباق</p>
            <p>اضغط على "إضافة صنف" للبدء</p>
          </div>
        )}
      </div>
    </div>
  );
}
