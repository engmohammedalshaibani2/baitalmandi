'use client';

import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createOrder } from '@/actions/orders';
import { Plus, Minus, Trash2, ArrowRight, ShoppingBasket, CheckCircle } from 'lucide-react';

export default function CartPage() {
  const { items: cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCartStore();
  const cartTotal = getCartTotal();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Customer Form State
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);

    try {
      // 1. Create Order in Database
      const orderItems = cart.map(item => ({
        category_name: item.category || 'General',
        item_name: item.name.split(' (')[0], // Extract base name
        size_label: item.size || 'عادي',
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const orderData = {
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        delivery_address: customerInfo.address,
        items: orderItems,
        subtotal: cartTotal,
        total_amount: cartTotal,
        order_method: 'whatsapp' as const
      };

      const newOrder = await createOrder(orderData);

      // 2. Open WhatsApp Message
      let message = `مرحباً بيت المندي، أود طلب الآتي:\n\n`;
      message += `رقم الطلب: *${newOrder.order_number}*\n\n`;
      cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} - العدد: ${item.quantity} (السعر: ${item.price * item.quantity} ريال)\n`;
      });
      message += `\nالإجمالي: *${cartTotal} ريال*`;
      message += `\n\nالاسم: ${customerInfo.name}`;
      message += `\nالهاتف: ${customerInfo.phone}`;
      if (customerInfo.address) message += `\nالعنوان: ${customerInfo.address}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappNumber = '967779898617'; // Default Yemen number
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
      
      // 3. Clear Cart & Show Success
      clearCart();
      setOrderSuccess(true);

    } catch (error) {
      console.error('Error creating order:', error);
      alert('حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <main style={{ paddingTop: '120px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
          <CheckCircle size={80} color="#10b981" style={{ margin: '0 auto 20px' }} />
          <h2 className="title-gold" style={{ fontSize: '2rem', marginBottom: '15px' }}>تم تسجيل طلبك بنجاح!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
            لقد تم تحويلك للواتساب لإرسال الطلب لفريقنا. سنتواصل معك قريباً لتأكيد التوصيل.
          </p>
          <Link href="/menu" className="btn-primary">
            العودة لقائمة الطعام
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh' }}>
      <div className="container">
        <Link href="/menu" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          <ArrowRight size={20} /> عودة للقائمة
        </Link>
        
        <h1 className="title-gold" style={{ fontSize: '2.5rem', marginBottom: '30px', textAlign: 'center' }}>
          سلة المشتريات
        </h1>

        {cart.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <ShoppingBasket size={64} style={{ color: 'var(--text-muted)', margin: '0 auto 20px', opacity: 0.5 }} />
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>السلة فارغة</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>لم تقم بإضافة أي أطباق بعد.</p>
            <Link href="/menu" className="btn-primary">
              تصفح قائمة الطعام
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', alignItems: 'start' }}>
            {/* Cart Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {cart.map((item) => (
                <div key={item.id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{item.name}</h3>
                    <p className="title-gold" style={{ fontWeight: 700 }}>{item.price} ريال</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '10px', cursor: 'pointer' }}
                      >
                        <Minus size={16} />
                      </button>
                      <span style={{ padding: '0 10px', fontWeight: 'bold', width: '30px', textAlign: 'center' }}>{item.quantity}</span>
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '10px', cursor: 'pointer' }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '10px', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Form & Summary */}
            <form onSubmit={handleCheckout} className="glass-panel" style={{ padding: '30px', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px', color: 'var(--gold)' }}>
                بيانات التوصيل
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>الاسم الكامل *</label>
                  <input required type="text" className="form-input" placeholder="محمد أحمد" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>رقم الهاتف *</label>
                  <input required type="tel" className="form-input" placeholder="77XXXXXXX" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} style={{ direction: 'ltr', textAlign: 'right' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>عنوان التوصيل التفصيلي</label>
                  <textarea className="form-input" placeholder="المنطقة، الشارع، أقرب معلم..." value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} rows={2} />
                </div>
              </div>

              <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
                ملخص الطلب
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '1.1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>المجموع الفرعي:</span>
                <span>{cartTotal} ريال</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>رسوم التوصيل:</span>
                <span style={{ color: 'var(--gold)' }}>تحدد لاحقاً</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '1.4rem', fontWeight: 'bold', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                <span>الإجمالي:</span>
                <span className="neon-text">{cartTotal} ريال</span>
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', fontSize: '1.1rem', padding: '15px', justifyContent: 'center' }}>
                {loading ? 'جاري المعالجة...' : 'تأكيد وإرسال عبر الواتساب'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
