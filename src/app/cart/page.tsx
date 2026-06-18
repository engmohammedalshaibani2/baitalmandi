'use client';

import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useSettings } from '@/lib/settings-context';
import { createOrder } from '@/actions/orders';
import { Plus, Minus, Trash2, ArrowRight, ShoppingBasket, Copy, Wallet } from 'lucide-react';
import { validateYemeniPhone, validateFullName, validateDeliveryAddress } from '@/lib/validation';

function generateIdempotencyKey(): string {
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface WalletItem { name: string; number: string; active: boolean; }
interface BankItem { name: string; account_number: string; account_holder: string; active: boolean; }

export default function CartPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const whatsappNumber = settings['whatsapp_order_number'] || settings['phone_delivery_whatsapp'] || '967779898617';
  const deliveryFee = parseInt(settings['delivery_fee']) || 0;
  const minOrderAmount = parseInt(settings['min_order_amount']) || 0;
  const currency = settings['currency'] || 'ريال';

  let wallets: WalletItem[] = [];
  try { const w = JSON.parse(settings['payment_wallets'] || '[]'); wallets = Array.isArray(w) ? w.filter((x: any) => x.active) : []; } catch {}
  let banks: BankItem[] = [];
  try { const b = JSON.parse(settings['payment_banks'] || '[]'); banks = Array.isArray(b) ? b.filter((x: any) => x.active) : []; } catch {}

  const { items: cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCartStore();
  const cartTotal = getCartTotal();
  const totalWithDelivery = cartTotal + deliveryFee;
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);
  const [idempotencyKey] = useState(() => generateIdempotencyKey());

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet' | 'transfer'>('cash');
  const [selectedWalletIdx, setSelectedWalletIdx] = useState<number | null>(null);
  const [selectedBankIdx, setSelectedBankIdx] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (wallets.length > 0 && selectedWalletIdx === null) setSelectedWalletIdx(0);
  }, [wallets]);

  useEffect(() => {
    if (banks.length > 0 && selectedBankIdx === null) setSelectedBankIdx(0);
  }, [banks]);

  if (!mounted) return null;

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(key);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {}
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setFieldErrors({});

    const nameValid = validateFullName(customerInfo.name);
    const phoneValid = validateYemeniPhone(customerInfo.phone);
    const addrValid = validateDeliveryAddress(customerInfo.address);

    const errors: Record<string, string> = {};
    if (!nameValid.valid) errors.name = nameValid.error!;
    if (!phoneValid.valid) errors.phone = phoneValid.error!;
    if (!addrValid.valid) errors.address = addrValid.error!;

    if (minOrderAmount > 0 && cartTotal < minOrderAmount) {
      errors.minAmount = `الحد الأدنى للطلب هو ${minOrderAmount} ${currency}`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = errors.address ? addressRef : errors.phone ? phoneRef : nameRef;
      firstError.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError.current?.focus();
      submittingRef.current = false;
      return;
    }

    setLoading(true);

    try {
      const orderItems = cart.flatMap<{
        price_id: string | null;
        category_name: string;
        item_name: string;
        size_label: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>(item => {
        const isOffer = item.isOffer && item.bundleItems && item.bundleItems.length > 0;
        return [{
          price_id: isOffer ? null : item.id,
          category_name: isOffer ? 'عروض' : item.category || 'General',
          item_name: isOffer ? item.name : item.name.split(' (')[0],
          size_label: isOffer ? 'عادي' : item.size || 'عادي',
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }];
      });

      // === MULTI-OFFER EXTRACTION ===
      // Extract ALL offers from cart (not just the first one)
      const offerCartItems = cart.filter(ci => ci.isOffer && ci.offerId);
      const offers = offerCartItems.length > 0
        ? offerCartItems.map(ci => ({
            offer_id: ci.offerId!,
            quantity: ci.quantity,
            bundle_items: (ci.bundleItems || []).map(bi => ({
              category_name: 'عروض',
              item_name: bi.name,
              size_label: bi.size || 'عادي',
              quantity: bi.quantity,
              unit_price: bi.price,
              total_price: bi.price * bi.quantity,
            })),
          }))
        : undefined;

      let notes = '';
      if (paymentMethod === 'wallet' && selectedWalletIdx !== null && wallets[selectedWalletIdx]) {
        notes = `[وسيلة الدفع: محفظة ${wallets[selectedWalletIdx].name} - ${wallets[selectedWalletIdx].number}]`;
      } else if (paymentMethod === 'transfer' && selectedBankIdx !== null && banks[selectedBankIdx]) {
        notes = `[وسيلة الدفع: تحويل ${banks[selectedBankIdx].name} - ${banks[selectedBankIdx].account_number}]`;
      } else {
        notes = '[وسيلة الدفع: نقداً عند الاستلام]';
      }

      const newOrder = await createOrder({
        customer_name: customerInfo.name.trim(),
        customer_phone: customerInfo.phone.trim(),
        delivery_address: customerInfo.address.trim(),
        notes: notes,
        items: orderItems,
        offers: offers,
        order_method: 'whatsapp',
        payment_method: paymentMethod,
        idempotency_key: idempotencyKey,
      });

      let message = `مرحباً ${settings['restaurant_name'] || 'بيت المندي'}، أود طلب الآتي:\n\n`;
      message += `رقم الطلب: *${newOrder.order_number}*\n\n`;
      cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} - العدد: ${item.quantity} (السعر: ${item.price * item.quantity} ${currency})\n`;
      });
      message += `\nالإجمالي: *${cartTotal} ${currency}*`;
      message += `\n\nالاسم: ${customerInfo.name}`;
      message += `\nالهاتف: ${customerInfo.phone}`;
      if (customerInfo.address) message += `\nالعنوان: ${customerInfo.address}`;

      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');

      clearCart();
      router.push(`/t/${newOrder.tracking_token}`);
    } catch (err: any) {
      console.error('[Cart] Order creation failed:', {
        customer: customerInfo.name,
        phone: customerInfo.phone,
        itemsCount: cart.length,
        error: err,
      });
      alert(err?.message || 'تعذّر إنشاء الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

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
          <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {cart.map((item) => (
                <div key={item.id} className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{item.name}</h3>
                      {item.isOffer && item.originalPrice && item.originalPrice > item.price && (
                        <div style={{ fontSize: '0.82rem', marginBottom: '4px' }}>
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{item.originalPrice} {currency}</span>
                          <span style={{ color: '#10b981', marginRight: '8px' }}>وفر {item.discountAmount} {currency}</span>
                        </div>
                      )}
                      <p className="title-gold" style={{ fontWeight: 700 }}>{item.price} {currency}</p>
                      {item.isOffer && item.bundleItems && item.bundleItems.length > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '8px 10px', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                          {item.bundleItems.map((bi, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <span>• {bi.name} × {bi.quantity}</span>
                              <span>{bi.price * bi.quantity} {currency}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '10px', cursor: 'pointer' }}>
                          <Minus size={16} />
                        </button>
                        <span style={{ padding: '0 10px', fontWeight: 'bold', width: '30px', textAlign: 'center' }}>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '10px', cursor: 'pointer' }}>
                          <Plus size={16} />
                        </button>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.id)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '10px', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleCheckout} className="glass-panel" style={{ padding: '30px', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px', color: 'var(--gold)' }}>
                بيانات التوصيل
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>الاسم الكامل *</label>
                  <input ref={nameRef} required type="text" className={`form-input ${fieldErrors.name ? 'input-error' : ''}`} placeholder="محمد أحمد" value={customerInfo.name} onChange={e => { setCustomerInfo({ ...customerInfo, name: e.target.value }); setFieldErrors(prev => ({ ...prev, name: '' })); }} />
                  {fieldErrors.name && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px' }}>{fieldErrors.name}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>رقم الهاتف *</label>
                  <input ref={phoneRef} required type="tel" className={`form-input ${fieldErrors.phone ? 'input-error' : ''}`} placeholder="77XXXXXXX" value={customerInfo.phone} onChange={e => { setCustomerInfo({ ...customerInfo, phone: e.target.value }); setFieldErrors(prev => ({ ...prev, phone: '' })); }} style={{ direction: 'ltr', textAlign: 'right' }} />
                  {fieldErrors.phone && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px' }}>{fieldErrors.phone}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>عنوان التوصيل *</label>
                  <textarea ref={addressRef} className={`form-input ${fieldErrors.address ? 'input-error' : ''}`} placeholder="المنطقة، الشارع، أقرب معلم..." value={customerInfo.address} onChange={e => { setCustomerInfo({ ...customerInfo, address: e.target.value }); setFieldErrors(prev => ({ ...prev, address: '' })); }} rows={2} />
                  {fieldErrors.address && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px' }}>{fieldErrors.address}</p>}
                </div>
                {fieldErrors.minAmount && (
                  <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '4px', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px' }}>{fieldErrors.minAmount}</p>
                )}
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Wallet size={16} style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
                  وسيلة الدفع
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: paymentMethod === 'cash' ? '2px solid var(--gold)' : '1px solid var(--border)', cursor: 'pointer', background: paymentMethod === 'cash' ? 'rgba(197,155,95,0.05)' : 'transparent', transition: 'all 0.2s' }}>
                    <input type="radio" name="payment-cart" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} style={{ accentColor: 'var(--gold)' }} />
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>نقداً عند الاستلام</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ادفع نقداً عند استلام الطلب</p>
                    </div>
                  </label>

                  {wallets.length > 0 && (
                    <div style={{ padding: '12px', borderRadius: '10px', border: paymentMethod === 'wallet' ? '2px solid var(--gold)' : '1px solid var(--border)', background: paymentMethod === 'wallet' ? 'rgba(197,155,95,0.05)' : 'transparent', transition: 'all 0.2s' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: paymentMethod === 'wallet' ? '10px' : 0 }}>
                        <input type="radio" name="payment-cart" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} style={{ accentColor: 'var(--gold)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>محفظة إلكترونية</span>
                      </label>
                      {paymentMethod === 'wallet' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {wallets.map((w, i) => (
                            <div key={i} onClick={() => setSelectedWalletIdx(i)}
                              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: selectedWalletIdx === i ? 'rgba(197,155,95,0.1)' : 'var(--glass-bg)', border: selectedWalletIdx === i ? '1px solid var(--gold)' : '1px solid var(--border)' }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{w.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>{w.number}</div>
                              </div>
                              <button type="button" onClick={(e) => { e.stopPropagation(); copyToClipboard(w.number, `w-${i}`); }}
                                style={{ background: 'rgba(197,155,95,0.12)', border: 'none', color: 'var(--gold)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                <Copy size={12} /> {copiedIndex === `w-${i}` ? 'تم' : 'نسخ'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {banks.length > 0 && (
                    <div style={{ padding: '12px', borderRadius: '10px', border: paymentMethod === 'transfer' ? '2px solid var(--gold)' : '1px solid var(--border)', background: paymentMethod === 'transfer' ? 'rgba(197,155,95,0.05)' : 'transparent', transition: 'all 0.2s' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: paymentMethod === 'transfer' ? '10px' : 0 }}>
                        <input type="radio" name="payment-cart" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} style={{ accentColor: 'var(--gold)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>تحويل بنكي</span>
                      </label>
                      {paymentMethod === 'transfer' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {banks.map((b, i) => (
                            <div key={i} onClick={() => setSelectedBankIdx(i)}
                              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: selectedBankIdx === i ? 'rgba(197,155,95,0.1)' : 'var(--glass-bg)', border: selectedBankIdx === i ? '1px solid var(--gold)' : '1px solid var(--border)' }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>{b.account_number}</div>
                              </div>
                              <button type="button" onClick={(e) => { e.stopPropagation(); copyToClipboard(b.account_number, `b-${i}`); }}
                                style={{ background: 'rgba(197,155,95,0.12)', border: 'none', color: 'var(--gold)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                <Copy size={12} /> {copiedIndex === `b-${i}` ? 'تم' : 'نسخ'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
                ملخص الطلب
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '1.1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>المجموع الفرعي:</span>
                <span>{cartTotal} {currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>رسوم التوصيل:</span>
                <span style={{ color: 'var(--gold)' }}>{deliveryFee > 0 ? `${deliveryFee} ${currency}` : 'تحدد لاحقاً'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '1.4rem', fontWeight: 'bold', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                <span>الإجمالي:</span>
                <span className="neon-text">{deliveryFee > 0 ? totalWithDelivery : cartTotal} {currency}</span>
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', fontSize: '1.1rem', padding: '15px', justifyContent: 'center' }}>
                {loading ? 'جاري المعالجة...' : 'تأكيد الطلب'}
              </button>
            </form>
          </div>
        </>)}
      </div>
    </main>
  );
}
