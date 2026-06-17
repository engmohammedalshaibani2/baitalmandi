'use client';

import React, { useEffect, useState } from 'react';
import { getGalleryImages, insertGalleryImage, deleteGalleryImage, updateGalleryImage } from '@/repositories/galleryRepository';
import { supabase } from '@/lib/supabase';
import { Trash2, Plus, Upload, Home } from 'lucide-react';
import { getNextSortOrder, reindexSortOrders } from '@/lib/ordering';
import { useOrderRealtime } from '@/realtime/OrderRealtimeProvider';

export default function AdminGalleryPage() {
  const { subscribeToTable } = useOrderRealtime();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [order, setOrder] = useState('0');

  useEffect(() => { fetchImages(); }, []);

  useEffect(() => {
    const unsub = subscribeToTable('gallery_images', () => { fetchImages(); });
    return unsub;
  }, [subscribeToTable]);

  async function fetchImages() {
    const data = await getGalleryImages();
    if (data) setImages(data);
    setLoading(false);
  }

  const getGallerySortOrder = async (manualOrder: number): Promise<{ sortOrder: number; needsReindex: boolean }> => {
    if (manualOrder > 0) return { sortOrder: manualOrder, needsReindex: true };
    const next = await getNextSortOrder('gallery_images', 'prepend');
    console.log('[GALLERY_ORDER_AUTO_ASSIGNED]', { newOrder: next.sortOrder, needsReindex: next.needsReindex });
    return next;
  };

  const handleInsertGalleryImage = async (url: string) => {
    const parsedOrder = parseInt(order);
    const { sortOrder, needsReindex } = await getGallerySortOrder(parsedOrder);

    if (needsReindex) {
      await reindexSortOrders('gallery_images');
      console.log('[GALLERY_ORDER_REINDEXED]', { reason: parsedOrder > 0 ? 'manual_order' : 'prepend_shift' });
    }

    if (parsedOrder > 0) {
      console.log('[GALLERY_ORDER_MANUAL_OVERRIDE]', { newOrder: parsedOrder });
    }

    await insertGalleryImage({
      image_url: url,
      category: category || 'عام',
      sort_order: sortOrder,
      is_active: true,
      show_on_homepage: false,
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleInsertGalleryImage(imageUrl);
    setImageUrl(''); setCategory(''); setOrder('0');
    await fetchImages();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setLoading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage.from('gellary').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('gellary').getPublicUrl(fileName);

      await insertGalleryImage({
        image_url: urlData.publicUrl,
        category: category || 'عام',
        sort_order: 0,
        is_active: true,
        show_on_homepage: false,
      });
      await fetchImages();
    } catch (err: any) {
      alert('حدث خطأ: ' + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
      await deleteGalleryImage(id);
      await fetchImages();
    }
  };

  const handleToggleHomepage = async (id: string, current: boolean) => {
    const next = !current;
    try {
      await updateGalleryImage(id, { show_on_homepage: next });
    } catch (err: any) {
      alert('حدث خطأ: ' + (err?.message || 'unknown'));
      return;
    }
    setImages(prev => prev.map(img => img.id === id ? { ...img, show_on_homepage: next } : img));
    console.log('[HOMEPAGE_GALLERY_UPDATED]', {
      selectedImagesCount: images.filter(i => i.id === id ? next : i.show_on_homepage).length,
      updatedBy: 'admin',
    });
  };

  return (
    <div>
      <h1 className="title-gold" style={{ fontSize: '2rem', marginBottom: '30px' }}>معرض الصور</h1>

      {/* Add Form */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>إضافة صورة جديدة</h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>صورة (رابط أو رفع من الجهاز) *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="url" className="form-input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} required={!imageUrl} placeholder="https://..." style={{ flex: 1 }} />
              <label className="btn-secondary" style={{ cursor: 'pointer', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <Upload size={18} /> رفع
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  if (!e.target.files || e.target.files.length === 0) return;
                  const file = e.target.files[0];
                  const fileExt = file.name.split('.').pop();
                  const fileName = `${Math.random()}.${fileExt}`;
                  const { error } = await supabase.storage.from('gellary').upload(fileName, file);
                  if (error) alert('خطأ في الرفع: ' + error.message);
                  else {
                    const { data } = supabase.storage.from('gellary').getPublicUrl(fileName);
                    setImageUrl(data.publicUrl);
                  }
                }} />
              </label>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>التصنيف (القسم)</label>
            <input 
              type="text" 
              className="form-input" 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              placeholder="مثال: المطعم، الطعام..." 
              list="gallery-cats"
            />
            <datalist id="gallery-cats">
              {Array.from(new Set(images.map(img => img.category).filter(Boolean))).map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          <div style={{ minWidth: '100px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>الترتيب</label>
            <input type="number" className="form-input" value={order} onChange={e => setOrder(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '13px 24px' }}>
            <Plus size={18} /> إضافة
          </button>
        </form>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
        {loading ? <p>جاري التحميل...</p> : images.map(img => (
          <div key={img.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1', border: '1px solid var(--border)' }}>
            <img src={img.image_url} alt={img.category || 'صورة المطعم'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}
            >
              <button onClick={() => handleDelete(img.id)} style={{ background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={18} />
              </button>
            </div>
            {img.category && (
              <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--maroon)', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>{img.category}</span>
            )}
            <label style={{ position: 'absolute', bottom: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={img.show_on_homepage || false}
                onChange={() => handleToggleHomepage(img.id, img.show_on_homepage || false)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <Home size={12} />
              الرئيسية
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
