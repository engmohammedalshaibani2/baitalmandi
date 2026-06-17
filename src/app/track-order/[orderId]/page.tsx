'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';
import InvoiceModal from '@/components/invoice/InvoiceModal';
import { getOrderOffers, type OrderOfferSnapshot } from '@/actions/orders-offers';
import { extractBundleFromNotes, snapshotToBundleInfo, type OrderBundleInfo } from '@/lib/bundle-utils';
import { useOrderRealtime } from '@/realtime/OrderRealtimeProvider';
import { ShoppingBag, CheckCircle, Clock, ChefHat, Truck, XCircle, MapPin, Phone, Printer, AlertTriangle, Percent } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending:    { label: 'قيد الانتظار',   icon: Clock,     color: '#eab308' },
  confirmed:  { label: 'تم التأكيد',     icon: CheckCircle, color: '#3b82f6' },
  preparing:  { label: 'جاري التحضير',   icon: ChefHat,   color: '#8b5cf6' },
  on_the_way: { label: 'في الطريق',      icon: Truck,     color: '#06b6d4' },
  delivered:  { label: 'تم التوصيل',     icon: CheckCircle, color: '#10b981' },
  cancelled:  { label: 'ملغي',           icon: XCircle,   color: '#ef4444' },
};

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered'];

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'نقداً عند الاستلام',
  wallet: 'محفظة إلكترونية',
  transfer: 'تحويل بنكي',
};

export default function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { settings } = useSettings();
  const currency = settings['currency'] || 'ريال';
  const [order, setOrder] = useState<any>(null);
  const [orderOffers, setOrderOffers] = useState<OrderOfferSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const token = order?.tracking_token || orderId;
  const trackUrl = typeof window !== 'undefined' ? `${window.location.origin}/t/${token}` : '';

  const fetchOrder = useCallback(async () => {
    try {
      const [orderRes, offers] = await Promise.all([
        supabase
          .from('orders')
          .select(`*, items:order_items(*)`)
          .eq('id', orderId)
          .maybeSingle(),
        getOrderOffers(orderId),
      ]);

      const { data, error: err } = orderRes;

      if (err) throw err;
      if (data) {
        setOrder(data);
        setOrderOffers(offers);
        setError(null);
      } else {
        setError('الطلب غير موجود');
      }
    } catch {
      setError('الطلب غير موجود');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const { subscribeToOrder } = useOrderRealtime();

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Realtime: update order state immediately on changes (no polling needed)
  useEffect(() => {
    const unsub = subscribeToOrder(orderId, (payload) => {
      if (payload.new) {
        setOrder((prev: any) => prev ? { ...prev, ...payload.new } : prev);
      }
    });
    return unsub;
  }, [orderId, subscribeToOrder]);

  if (loading) return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 15px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>جاري تحميل بيانات الطلب...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', textAlign: 'center' }}>
      <div className="glass-panel" style={{ padding: '60px 40px', maxWidth: '500px', margin: '0 auto' }}>
        <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: '1.8rem', marginBottom: '15px' }}>الطلب غير موجود</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>لم نتمكن من العثور على الطلب. قد يكون الرابط غير صحيح.</p>
        <Link href="/" className="btn-primary">العودة للرئيسية</Link>
      </div>
    </div>
  );

  const currentStatus = order.status;
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const isCancelled = currentStatus === 'cancelled';
  const canInvoice = !isCancelled && (currentIdx >= STATUS_ORDER.indexOf('confirmed'));

  const invoiceDate = order.created_at ? new Date(order.created_at).toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const paymentLabel = PAYMENT_LABELS[order.payment_method] || order.payment_method;
  const bundleInfos: OrderBundleInfo[] =
    orderOffers.length > 0
      ? orderOffers.map(snapshotToBundleInfo)
      : (() => { const n = extractBundleFromNotes(order.notes); return n ? [n] : []; })();

  return (
    <>
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '800px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="title-gold" style={{ fontSize: '1.8rem', margin: 0 }}>تتبع الطلب</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.95rem' }}>
              رقم الطلب: <strong style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>{order.order_number}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {canInvoice && (
              <button onClick={() => setShowInvoice(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                <Printer size={18} /> حفظ الفاتورة
              </button>
            )}
          </div>
        </div>

        {/* Warning */}
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', border: '1px solid rgba(234,179,8,0.3)', background: 'rgba(234,179,8,0.05)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertTriangle size={20} color="#eab308" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                يرجى عدم حذف بيانات المتصفح أو استخدام وضع التصفح الخاص حتى اكتمال الطلب.
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                يمكنك إغلاق الصفحة والعودة لاحقاً لمتابعة حالة الطلب.
              </p>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '24px', color: 'var(--text-primary)' }}>حالة الطلب</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STATUS_ORDER.map((status, idx) => {
              const cfg = STATUS_CONFIG[status];
              const StatusIcon = cfg.icon;
              const isPast = idx <= currentIdx && !isCancelled;
              const isCurrent = status === currentStatus;

              if (isCancelled && status === 'cancelled') {
                return (
                  <div key={status} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', opacity: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.15)', border: '2px solid #ef4444' }}>
                        <XCircle size={18} color="#ef4444" />
                      </div>
                    </div>
                    <div style={{ paddingBottom: '16px' }}>
                      <p style={{ fontWeight: 700, color: '#ef4444', fontSize: '1rem' }}>{cfg.label}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={status} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', opacity: isPast || isCurrent ? 1 : 0.35 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isPast || isCurrent ? `${cfg.color}20` : 'var(--glass-bg)', border: `2px solid ${isPast || isCurrent ? cfg.color : 'var(--border)'}` }}>
                      <StatusIcon size={18} color={isPast || isCurrent ? cfg.color : 'var(--text-muted)'} />
                    </div>
                    {idx < STATUS_ORDER.length - 1 && (
                      <div style={{ width: '2px', flex: 1, minHeight: '24px', background: isPast && !isCancelled ? cfg.color : 'var(--border)', marginTop: '4px' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: idx < STATUS_ORDER.length - 1 ? '16px' : 0 }}>
                    <p style={{ fontWeight: isCurrent ? 800 : 600, color: isCurrent ? cfg.color : 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {cfg.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--gold)', fontWeight: 700 }}>بيانات العميل</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>الاسم: </span>{order.customer_name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} color="var(--gold)" />
                <span>{order.customer_phone}</span>
              </div>
              {order.delivery_address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <MapPin size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{order.delivery_address}</span>
                </div>
              )}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--gold)', fontWeight: 700 }}>تفاصيل الطلب</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>رقم الطلب: </span><strong style={{ fontFamily: 'monospace' }}>{order.order_number}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>تاريخ الطلب: </span>{invoiceDate}</div>
              <div><span style={{ color: 'var(--text-secondary)' }}>وسيلة الدفع: </span>{paymentLabel}</div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '16px', color: 'var(--gold)', fontWeight: 700 }}>الأصناف</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(order.items || []).map((item: any, idx: number) => (
              <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: idx < (order.items?.length || 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.item_name}</span>
                  {item.size_label && item.size_label !== 'عادي' && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginRight: '8px' }}>({item.size_label})</span>
                  )}
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginRight: '8px' }}>× {item.quantity}</span>
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.total_price} {currency}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '2px solid var(--gold)', paddingTop: '14px', marginTop: '10px' }}>
            {bundleInfos.length > 0 && bundleInfos.map((b, bi) => {
              const bQty = b.quantity || 1;
              return (
                <div key={bi} style={{ marginBottom: '10px', padding: '10px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Percent size={14} color="#10b981" />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#10b981' }}>{b.offerName} × {bQty}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    <span>سعر الوحدة</span>
                    <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{b.originalPrice} {currency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#10b981' }}>
                    <span>وفرت للوحدة</span>
                    <span>-{b.discountAmount} {currency} ({b.discountPercent}%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px', borderTop: '1px solid rgba(16,185,129,0.15)', paddingTop: '2px' }}>
                    <span>إجمالي الباقة</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{bQty * b.originalPrice - bQty * b.discountAmount} {currency}</span>
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <span>المجموع الفرعي</span>
              <span>{order.subtotal} {currency}</span>
            </div>
            {parseFloat(order.delivery_fee) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <span>رسوم التوصيل</span>
                <span>{order.delivery_fee} {currency}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold)', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              <span>الإجمالي</span>
              <span>{order.total_amount} {currency}</span>
            </div>
          </div>
        </div>

        {/* Footer action */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link href="/menu" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 36px' }}>
            <ShoppingBag size={18} /> طلب جديد
          </Link>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && order && (
        <InvoiceModal
          order={order}
          settings={settings}
          trackUrl={trackUrl}
          orderOffers={orderOffers}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </>
  );
}
