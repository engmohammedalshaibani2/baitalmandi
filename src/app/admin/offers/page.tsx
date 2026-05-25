'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react';

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemId, setItemId] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [{ data: offersData }, { data: itemsData }] = await Promise.all([
      supabase.from('offers').select('*, items(name_ar, item_prices(*))').order('created_at', { ascending: false }),
      supabase.from('items').select('id, name_ar').eq('is_active', true),
    ]);
    if (offersData) setOffers(offersData);
    if (itemsData) setMenuItems(itemsData);
    setLoading(false);
  }

  const resetForm = () => {
    setTitle(''); setDescription(''); setItemId(''); setDiscountPercent('');
    setImageUrl(''); setEndDate(''); setStatus('active');
    setIsEditing(false); setEditingId(null);
  };

  const handleEdit = (offer: any) => {
    setTitle(offer.title_ar); 
    setDescription(offer.description_ar || '');
    setItemId(offer.item_id || ''); 
    setDiscountPercent(offer.discount_percent?.toString() || '');
    setImageUrl(offer.image || ''); 
    setStatus(offer.status || 'active');
    if (offer.end_date) setEndDate(offer.end_date.split('T')[0]);
    setEditingId(offer.id); setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        title_ar: title, 
        title_en: title, // Required
        description_ar: description || null,
        item_id: itemId || null,
        discount_percent: discountPercent ? parseInt(discountPercent) : null,
        image: imageUrl || null,
        start_date: new Date().toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: status,
      };
      
      if (isEditing && editingId) {
        await supabase.from('offers').update(payload).eq('id', editingId);
      } else {
        await supabase.from('offers').insert([payload]);
      }
      resetForm(); await fetchData();
    } catch (err: any) {
      alert('حدث خطأ: ' + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العرض؟')) {
      await supabase.from('offers').delete().eq('id', id);
      await fetchData();
    }
  };

  const handleToggleActive = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    await supabase.from('offers').update({ status: newStatus }).eq('id', id);
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const getDiscountedPrice = (originalPrice: number, discount: number) =>
    (originalPrice * (1 - discount / 100)).toFixed(2);

  return (
    <div>
      <h1 className="title-gold" style={{ fontSize: '2rem', marginBottom: '30px' }}>إدارة العروض</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px', alignItems: 'start' }}>

        {/* Offers List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>العروض الحالية ({offers.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {offers.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>لا توجد عروض. أضف عرضاً جديداً.</p>
            ) : (
              offers.map(offer => (
                <div key={offer.id} style={{
                  background: 'var(--bg-card)', borderRadius: '14px', overflow: 'hidden',
                  border: '1px solid var(--border)', opacity: offer.status === 'active' ? 1 : 0.6,
                }}>
                  <div style={{ display: 'flex', gap: '15px', padding: '15px' }}>
                    {(offer.image || (offer.items && offer.items.image)) && (
                      <img src={offer.image || offer.items.image} alt={offer.title_ar} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ fontSize: '1.1rem' }}>{offer.title_ar}</h3>
                        {offer.discount_percent && <span className="badge-discount">خصم {offer.discount_percent}%</span>}
                      </div>
                      {offer.items && (
                        <div style={{ marginTop: '6px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>— {offer.items.name_ar}</span>
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
                    <button
                      onClick={() => handleToggleActive(offer.id, offer.status)}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                        background: offer.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: offer.status === 'active' ? '#10b981' : '#ef4444',
                      }}
                    >
                      {offer.status === 'active' ? '✓ مفعل' : '✕ معطل'}
                    </button>
                    <button onClick={() => handleEdit(offer)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', marginRight: 'auto' }}>
                      <Edit2 size={15} /> تعديل
                    </button>
                    <button onClick={() => handleDelete(offer.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <Trash2 size={15} /> حذف
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Form */}
        <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <Tag size={18} style={{ display: 'inline', marginLeft: '8px', color: 'var(--gold)' }} />
            {isEditing ? 'تعديل العرض' : 'إضافة عرض'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>عنوان العرض *</label>
              <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} required placeholder="مثال: عرض الجمعة" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>الصنف المرتبط</label>
              <select className="form-input" value={itemId} onChange={e => setItemId(e.target.value)}>
                <option value="">بدون ربط بصنف</option>
                {menuItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name_ar}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>الوصف</label>
              <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>نسبة الخصم (%)</label>
              <input type="number" min="1" max="99" className="form-input" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} placeholder="مثال: 20" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>صورة العرض</label>
              
              {imageUrl && (
                <div style={{ marginBottom: '10px', position: 'relative', display: 'inline-block' }}>
                  <img src={imageUrl} alt="معاينة" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                  <button type="button" onClick={() => setImageUrl('')} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>×</button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                <label className="btn-secondary" style={{ display: 'block', textAlign: 'center', cursor: 'pointer', padding: '10px' }}>
                  {loading && !imageUrl ? 'جاري الرفع...' : 'رفع صورة من الجهاز'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                    if (!e.target.files || e.target.files.length === 0) return;
                    setLoading(true);
                    const file = e.target.files[0];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const { error } = await supabase.storage.from('offers').upload(fileName, file);
                    if (error) {
                      alert('حدث خطأ أثناء رفع الصورة: ' + error.message);
                    } else {
                      const { data } = supabase.storage.from('offers').getPublicUrl(fileName);
                      setImageUrl(data.publicUrl);
                    }
                    setLoading(false);
                  }} />
                </label>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>أو أدخل رابط الصورة مباشرة:</div>
                <input type="url" className="form-input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>تاريخ انتهاء العرض</label>
              <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
              <input type="checkbox" checked={status === 'active'} onChange={e => setStatus(e.target.checked ? 'active' : 'disabled')} style={{ accentColor: 'var(--gold)', width: '16px', height: '16px' }} />
              تفعيل العرض الآن
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
