'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getGalleryImages } from '@/repositories/galleryRepository';
import { useOrderRealtime } from '@/realtime/OrderRealtimeProvider';

export default function GalleryPage() {
  const { subscribeToTable } = useOrderRealtime();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightbox, setLightbox] = useState<any | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    const unsub = subscribeToTable('gallery_images', () => { fetchImages(); });
    return unsub;
  }, [subscribeToTable]);

  async function fetchImages() {
    const data = await getGalleryImages();
    if (data && data.length > 0) {
      setImages(data);
    } else {
      // Fallback demo images
      setImages([
        { id: 1, image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=600', category: 'Food' },
        { id: 2, image_url: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&q=80&w=600', category: 'Food' },
        { id: 3, image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600', category: 'Food' },
        { id: 4, image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=600', category: 'Restaurant' },
        { id: 5, image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600', category: 'Restaurant' },
        { id: 6, image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600', category: 'Food' },
      ]);
    }
    setLoading(false);
  }

  const filtered = activeCategory === 'all' ? images : images.filter(img => img.category === activeCategory);

  // Close lightbox on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--maroon-dark) 0%, var(--maroon) 100%)',
        padding: '60px 20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(var(--gold) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="title-gold" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: 0, fontFamily: 'var(--font-tajawal)' }}>معرض الصور</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '1.1rem' }}>لحظات من عالم بيت المندي</p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '40px' }}>
        {/* Category Filter */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '35px', flexWrap: 'wrap' }}>
          {['all', ...Array.from(new Set(images.map(img => img.category).filter(Boolean)))].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 22px', borderRadius: '30px', fontSize: '0.95rem' }}
            >
              {cat === 'all' ? 'الكل' : cat}
              {cat !== 'all' && (
                <span style={{ marginRight: '6px', opacity: 0.7, fontSize: '0.8rem' }}>
                  ({images.filter(i => i.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="shimmer" style={{ aspectRatio: '1', borderRadius: '14px', background: 'var(--glass-bg)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.3rem' }}>لا توجد صور في هذه الفئة</p>
          </div>
        ) : (
          <div style={{
            columns: '4 220px',
            columnGap: '16px',
          }}>
            {filtered.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => setLightbox(img)}
                style={{
                  marginBottom: '16px',
                  breakInside: 'avoid',
                  position: 'relative',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  cursor: 'zoom-in',
                  border: '1px solid var(--border)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <img
                  src={img.image_url}
                  alt={img.category || 'صورة المطعم'}
                  style={{ width: '100%', display: 'block', borderRadius: '14px' }}
                  loading="lazy"
                />
                {img.category && (
                  <span style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'var(--maroon)', color: '#fff', padding: '3px 10px',
                    borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700
                  }}>
                    {img.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', cursor: 'zoom-out',
          }}
        >
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: '20px', left: '20px',
              background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
              width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={22} />
          </button>
          <img
            src={lightbox.image_url}
            alt={lightbox.category || 'صورة'}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain',
              borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          />
        </div>
      )}
    </div>
  );
}
