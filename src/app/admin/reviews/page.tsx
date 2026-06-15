'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Trash2, Star } from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  // Add form
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [source, setSource] = useState('Website');

  useEffect(() => { fetchReviews(); }, []);

  async function fetchReviews() {
    const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (data) setReviews(data);
    setLoading(false);
  }

  const handleApprove = async (id: string) => {
    await supabase.from('reviews').update({ is_featured: true }).eq('id', id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_featured: true } : r));
  };

  const handleDelete = async (id: string) => {
    if (confirm('حذف هذا التقييم؟')) {
      await supabase.from('reviews').delete().eq('id', id);
      setReviews(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('reviews').insert([{ reviewer_name: name.trim(), rating, comment_ar: comment.trim(), source, is_featured: true }]);
    if (!error) {
      setName('');
      setRating(5);
      setComment('');
      setSource('Website');
      await fetchReviews();
    }
  };

  const filteredReviews = reviews.filter(r => {
    const isFeatured = r.is_featured ?? r.isFeatured ?? false;
    return activeTab === 'approved' ? isFeatured : !isFeatured;
  });

  return (
    <div>
      <h1 className="title-gold" style={{ fontSize: '2rem', marginBottom: '30px' }}>إدارة التقييمات</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

        {/* Reviews List */}
        <div>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            {(['pending', 'approved'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeTab === tab ? '2px solid var(--gold)' : '2px solid transparent', paddingBottom: '8px' }}
              >
                {tab === 'pending' ? `قيد المراجعة (${reviews.filter(r => !r.is_featured).length})` : `معتمدة (${reviews.filter(r => r.is_featured).length})`}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredReviews.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: '30px', textAlign: 'center' }}>لا توجد تقييمات في هذه الحالة.</p>
            ) : filteredReviews.map(review => {
              const reviewerName = review.reviewer_name || review.reviewerName || review.customer_name || 'مستخدم';
              const commentText = review.comment_ar || review.commentAr || review.comment || 'لا يوجد تعليق.';
              const isFeatured = review.is_featured ?? review.isFeatured ?? false;

              return (
                <div key={review.id} className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>{reviewerName}</h3>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                        {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= review.rating ? 'var(--gold)' : 'none'} color="var(--gold)" />)}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '8px' }}>{review.source || 'الموقع'}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{commentText}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginRight: '15px' }}>
                      {!isFeatured && (
                        <button onClick={() => handleApprove(review.id)} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <Check size={15} /> قبول
                        </button>
                      )}
                      <button onClick={() => handleDelete(review.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Add Review Form */}
        <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>إضافة تقييم</h2>
          <form onSubmit={handleAddReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>الاسم *</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>التقييم</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1,2,3,4,5].map(s => (
                  <button type="button" key={s} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <Star size={24} fill={s <= rating ? 'var(--gold)' : 'none'} color="var(--gold)" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>التعليق</label>
              <textarea className="form-input" rows={3} value={comment} onChange={e => setComment(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>المصدر</label>
              <select className="form-input" value={source} onChange={e => setSource(e.target.value)}>
                <option value="Website">الموقع</option>
                <option value="Google">Google</option>
                <option value="Facebook">Facebook</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '5px' }}>إضافة التقييم</button>
          </form>
        </div>

      </div>
    </div>
  );
}
