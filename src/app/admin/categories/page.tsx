'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [order, setOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setCategories(data);
    setLoading(false);
  }

  const resetForm = () => {
    setNameAr('');
    setNameEn('');
    setOrder('0');
    setIsActive(true);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (category: any) => {
    setNameAr(category.name_ar || '');
    setNameEn(category.name_en || '');
    setOrder(String(category.sort_order ?? 0));
    setIsActive(category.is_active ?? true);
    setEditingId(category.id);
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name_ar: nameAr,
      name_en: nameEn || nameAr,
      slug: (nameEn || nameAr).toLowerCase().replace(/[^a-z0-9]+/gi, '-') + '-' + Date.now(),
      sort_order: parseInt(order),
      is_active: isActive,
    };

    try {
      if (isEditing && editingId) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([payload]);
        if (error) throw error;
      }
      resetForm();
      await fetchCategories();
    } catch (err: any) {
      alert('حدث خطأ أثناء الحفظ: ' + err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التصنيف؟ تحذير: قد يؤثر هذا على الأطباق المرتبطة به.')) {
      setLoading(true);
      await supabase.from('categories').delete().eq('id', id);
      await fetchCategories();
    }
  };

  if (loading && categories.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 15px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>جاري التحميل...</p>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="title-gold" style={{ fontSize: '2rem', marginBottom: '30px' }}>إدارة التصنيفات</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', alignItems: 'start' }}>

        {/* List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            التصنيفات الحالية ({categories.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>لا توجد تصنيفات</p>
                <p style={{ fontSize: '0.9rem' }}>أضف تصنيفاً جديداً من النموذج على اليسار</p>
              </div>
            ) : (
              categories.map(cat => (
                <div key={cat.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px',
                  border: '1px solid var(--border)', opacity: cat.is_active ? 1 : 0.6,
                  transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{
                      width: '36px', height: '36px', background: 'var(--gold-faint)',
                      borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.9rem', color: 'var(--gold)',
                      fontWeight: 800, border: '1px solid rgba(212,160,23,0.2)'
                    }}>
                      {cat.sort_order ?? 0}
                    </span>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: cat.is_active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {cat.name_ar}
                      </h3>
                      {!cat.is_active && (
                        <span style={{
                          display: 'inline-block', marginTop: '4px',
                          background: 'rgba(239,68,68,0.12)', color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.25)',
                          padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600
                        }}>
                          غير مفعل
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(cat)}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      style={{
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                    >
                      <Trash2 size={15} />
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
            {isEditing ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                اسم التصنيف (عربي) *
              </label>
              <input
                type="text"
                className="form-input"
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                required
                placeholder="مثال: الدجاج"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                اسم التصنيف (إنجليزي)
              </label>
              <input
                type="text"
                className="form-input"
                value={nameEn}
                onChange={e => setNameEn(e.target.value)}
                placeholder="Example: Chicken"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                الترتيب
              </label>
              <input
                type="number"
                className="form-input"
                value={order}
                onChange={e => setOrder(e.target.value)}
                min="0"
                required
              />
              <small style={{ color: 'var(--text-muted)', marginTop: '5px', display: 'block' }}>
                الأرقام الأقل تظهر أولاً في القائمة
              </small>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <input
                type="checkbox"
                id="cat-isActive"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--gold)' }}
              />
              <div>
                <span style={{ fontWeight: 600, display: 'block' }}>مفعّل</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>يظهر للعملاء في القائمة</span>
              </div>
            </label>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                {isEditing ? <><Save size={18} /> حفظ</> : <><Plus size={18} /> إضافة</>}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} className="btn-secondary" style={{ padding: '12px 16px' }}>
                  <X size={18} />
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
