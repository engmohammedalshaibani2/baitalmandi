'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase';
import { Trash2, Plus, Minus, ArrowRight, MessageCircle, Globe, CheckCircle, ShoppingBag } from 'lucide-react';

function generateOrderNumber() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'BAM-';
  for (let i = 0; i < 4; i++) result += chars[Math.floor(Math.random() * chars.length)];
  result += '-';
  for (let i = 0; i < 4; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export default function MyOrdersPage() {
  const { items, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCartStore();
  const [isClient, setIsClient] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderMethod, setOrderMethod] = useState<'whatsapp' | 'website' | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success state
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => { setIsClient(true); }, []);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`هل تريد إزالة "${name}"؟`)) {
      removeFromCart(id);
    }
  };

  const handleWhatsAppOrder = () => {
    let message = '🍽️ *طلب جديد من بيت المندي*\n\n';
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.name} × ${item.quantity} = *${item.price * item.quantity} ريال*\n`;
    });
    message += `\n━━━━━━━━━━━━━━\n`;
    message += `💰 *الإجمالي: ${getCartTotal()} ريال*\n\n`;
    message += `📝 ملاحظات: ${notes || 'لا توجد'}`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/967779898617?text=${encoded}`, '_blank');
    clearCart();
    setShowOrderModal(false);
  };

  const handleWebsiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name (3 words minimum)
    const words = fullName.trim().split(/\s+/);
    if (words.length < 2) {
      setNameError('يرجى إدخال الاسم الثنائي على الأقل');
      return;
    }
    if (!phone.trim()) return;
    if (!address.trim()) return;

    setNameError('');
    setSubmitting(true);

    const orderNumber = generateOrderNumber();
    const totalAmount = getCartTotal();

    try {
      // Insert order into Supabase
      const { data: orderData, error: orderError } = await supabase
  .from('orders')
.insert([{
  order_number: orderNumber,

  customer_name: fullName.trim(),
  customer_phone: phone.trim(),
  delivery_address: address.trim(),

  notes: notes.trim() || null,

  subtotal: totalAmount,
  delivery_fee: 0,
  tax_amount: 0,
  total_amount: totalAmount,

  order_method: 'website',

  status: 'pending',
  version: 1,
}])
  .select()
  .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = items.map(item => ({
  order_id: orderData.id,

  category_name: item.category || 'المندي',

  item_name: item.name,

  size_label: item.size || 'عادي',

  quantity: item.quantity,

  unit_price: item.price,

  total_price: item.price * item.quantity,
}));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Send WhatsApp notification (send alongside DB order)
      let waMessage = `🔔 *طلب جديد #${orderNumber}*\n\n`;
      waMessage += `👤 *الاسم:* ${fullName}\n`;
      waMessage += `📞 *الهاتف:* ${phone}\n`;
      waMessage += `📍 *العنوان:* ${address}\n\n`;
      waMessage += `🍽️ *الطلبات:*\n`;
      items.forEach((item, i) => {
        waMessage += `${i + 1}. ${item.name} × ${item.quantity} = ${item.price * item.quantity} ريال\n`;
      });
      waMessage += `\n━━━━━━━━━━━━━━\n💰 *الإجمالي: ${totalAmount} ريال*`;
      if (notes) waMessage += `\n📝 ملاحظات: ${notes}`;

      const encoded = encodeURIComponent(waMessage);
      window.open(`https://wa.me/967779898617?text=${encoded}`, '_blank');

      clearCart();
      setOrderSuccess(orderNumber);
      setShowOrderModal(false);

    } catch (err: any) {
      console.error('Order error:', err);
      alert(`حدث خطأ أثناء إرسال الطلب: ${err.message || 'تعذّر الاتصال بالخادم'}. يمكنك الطلب عبر واتساب مباشرة.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isClient) return null;

  // ─────────────────────────────────────
  // SUCCESS SCREEN
  // ─────────────────────────────────────
  if (orderSuccess) {
    return (
      <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '60px 40px', maxWidth: '560px', width: '100%', textAlign: 'center' }}>
          <div style={{
            width: '90px', height: '90px', background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 30px', color: 'var(--maroon-dark)',
            boxShadow: '0 0 30px rgba(212,160,23,0.5)'
          }}>
            <CheckCircle size={48} />
          </div>
          <h2 className="title-gold" style={{ fontSize: '2rem', marginBottom: '15px' }}>تم استلام طلبك!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', lineHeight: 1.7 }}>
            شكراً لطلبك من بيت المندي. سيتواصل معك فريقنا في أقرب وقت لتأكيد الطلب.
          </p>
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--gold)', borderRadius: '12px', padding: '20px', marginBottom: '35px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>رقم طلبك</p>
            <div className="neon-text" style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '4px' }}>
              {orderSuccess}
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '30px' }}>
            احتفظ بهذا الرقم لمتابعة حالة طلبك
          </p>
          <Link href="/" className="btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────
  // EMPTY CART
  // ─────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '60px 40px', maxWidth: '500px' }}>
          <ShoppingBag size={64} style={{ color: 'var(--text-muted)', marginBottom: '20px' }} />
          <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>سلتك فارغة</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>لم تضف أي أطباق بعد. تفضّل بتصفح القائمة!</p>
          <Link href="/menu" className="btn-primary" style={{ fontSize: '1.1rem', padding: '14px 36px' }}>
            تصفح القائمة
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────
  // CART CONTENTS
  // ─────────────────────────────────────
  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '100px' }}>
      <h1 className="title-gold" style={{ fontSize: '2.5rem', marginBottom: '35px', textAlign: 'center' }}>سلة الطلبات</h1>

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-8 items-start w-full">

        {/* Items List */}
        <div className="w-full flex flex-col gap-4">
          {items.map(item => (
            <div key={item.id} className="glass-card" style={{ display: 'flex', padding: '16px', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ width: '75px', height: '75px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '75px', height: '75px', background: 'var(--glass-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '1.8rem' }}>🍽️</span>
                </div>
              )}

              <div style={{ flex: '1 1 150px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '5px' }}>{item.name}</h3>
                <div className="title-gold" style={{ fontWeight: 800, fontSize: '1.1rem' }}>{item.price} ريال</div>
              </div>

              {/* Quantity Controls */}
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: '30px', overflow: 'hidden', flexShrink: 0 }}>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  style={{ background: 'none', border: 'none', color: item.quantity <= 1 ? 'var(--text-muted)' : 'var(--text-primary)', padding: '10px 16px', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', transition: 'color 0.2s' }}
                >
                  <Minus size={16} />
                </button>
                <span style={{ fontWeight: 800, minWidth: '28px', textAlign: 'center', fontSize: '1.1rem' }}>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  style={{ background: 'var(--gold)', border: 'none', color: 'var(--maroon-dark)', padding: '10px 16px', cursor: 'pointer' }}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Subtotal */}
              <div style={{ fontWeight: 800, fontSize: '1.15rem', minWidth: '80px', textAlign: 'center', color: 'var(--text-primary)' }}>
                {item.price * item.quantity} ريال
              </div>

              {/* Remove */}
              <button
                onClick={() => handleDelete(item.id, item.name)}
                style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', width: '40px', height: '40px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <Link href="/menu" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', marginTop: '8px' }}>
            <ArrowRight size={18} /> إضافة صنف آخر
          </Link>
        </div>

        {/* Order Summary */}
        <div className="glass-panel w-full p-6 md:p-8 sticky top-24">
          <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>ملخص الطلب</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{item.name} × {item.quantity}</span>
                <span>{item.price * item.quantity} ريال</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text-secondary)' }}>
              <span>المجموع الفرعي</span>
              <span>{getCartTotal()} ريال</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <span>التوصيل</span>
              <span style={{ color: '#10b981' }}>يحدد لاحقاً</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '1.3rem', fontWeight: 900 }}>
              <span>الإجمالي</span>
              <span className="title-gold">{getCartTotal()} ريال</span>
            </div>
            <button onClick={() => setShowOrderModal(true)} className="btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '15px', justifyContent: 'center' }}>
              المتابعة للطلب
            </button>
          </div>
        </div>
      </div>

      {/* ─── ORDER METHOD MODAL ─── */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-[520px] max-h-[90vh] overflow-y-auto p-6 md:p-9 bg-[var(--bg-panel)]">

            {!orderMethod ? (
              <>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '8px', textAlign: 'center' }}>اختر طريقة الطلب</h3>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '28px', fontSize: '0.95rem' }}>
                  يمكنك الطلب عبر واتساب أو ملء بياناتك للتوصيل
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <button
                    onClick={handleWhatsAppOrder}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    <MessageCircle size={24} /> الطلب عبر واتساب
                  </button>
                  <button
                    onClick={() => setOrderMethod('website')}
                    className="btn-secondary"
                    style={{ padding: '16px', justifyContent: 'center', fontSize: '1.05rem' }}
                  >
                    <Globe size={20} /> إدخال بيانات التوصيل
                  </button>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '10px', cursor: 'pointer', fontSize: '0.95rem' }}
                  >
                    إلغاء
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleWebsiteSubmit}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', textAlign: 'center' }}>بيانات التوصيل</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>الاسم الكامل *</label>
                    <input type="text" className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="الاسم الثنائي على الأقل" required />
                    {nameError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '5px' }}>{nameError}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>رقم الهاتف *</label>
                    <input type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="77XXXXXXX" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>عنوان التوصيل *</label>
                    <textarea className="form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="الحي، الشارع، المبنى، أقرب معلم" rows={3} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>ملاحظات إضافية</label>
                    <input type="text" className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثال: لا أريد بصلاً، طرق الباب مرتين..." />
                  </div>
                </div>

                {/* Order Summary inside modal */}
                <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', marginBottom: '20px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--gold)' }}>
                    <span>الإجمالي</span>
                    <span>{getCartTotal()} ريال</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '1.05rem' }} disabled={submitting}>
                    {submitting ? 'جاري الإرسال...' : '✓ تأكيد الطلب'}
                  </button>
                  <button type="button" onClick={() => setOrderMethod(null)} className="btn-secondary" style={{ padding: '12px 20px' }}>
                    رجوع
                  </button>
                </div>

                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '14px' }}>
                  سيتم إرسال إشعار واتساب تلقائياً بعد تأكيد الطلب
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
