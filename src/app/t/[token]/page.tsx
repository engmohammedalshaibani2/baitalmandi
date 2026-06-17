'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';
import InvoiceModal from '@/components/invoice/InvoiceModal';
import { getOrderOffers, type OrderOfferSnapshot } from '@/actions/orders-offers';
import { extractBundleFromNotes, snapshotToBundleInfo, type OrderBundleInfo } from '@/lib/bundle-utils';
import {
  ShoppingBag, Clock, ChefHat, Truck, CheckCircle, XCircle,
  Phone, MapPin, Printer, MessageCircle, ChevronDown, ChevronUp,
  AlertTriangle, Copy, Percent,
} from 'lucide-react';

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'قيد الانتظار',   color: '#eab308' },
  confirmed:  { label: 'تم التأكيد',     color: '#3b82f6' },
  preparing:  { label: 'جاري التحضير',   color: '#8b5cf6' },
  on_the_way: { label: 'في الطريق',      color: '#06b6d4' },
  delivered:  { label: 'تم التوصيل',     color: '#10b981' },
  cancelled:  { label: 'ملغي',           color: '#ef4444' },
};
const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered'];
const PAYMENT_NAMES: Record<string, string> = {
  cash: 'نقداً', wallet: 'محفظة إلكترونية', transfer: 'تحويل بنكي',
};

export default function TokenTrackingPage() {
  const { token } = useParams<{ token: string }>();
  const { settings } = useSettings();

  const [orders, setOrders] = useState<any[]>([]);
  const [orderOffersMap, setOrderOffersMap] = useState<Record<string, OrderOfferSnapshot[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);

  const restaurantName = settings['restaurant_name'] || 'بيت المندي';
  const whatsappNum = settings['phone_delivery_whatsapp'] || settings['whatsapp_order_number'] || '';

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('orders')
          .select(`*, items:order_items(*)`)
          .eq('tracking_token', token)
          .order('created_at', { ascending: false });

        if (err) throw err;
        if (!data || data.length === 0) {
          setError('لا توجد طلبات مرتبطة بهذا الرابط');
        } else {
          setOrders(data);
          // Fetch order_offers for all orders in batch
          const orderIds = data.map(o => o.id);
          const { data: offersData } = await supabase
            .from('order_offers')
            .select('*, items:order_offer_items(*)')
            .in('order_id', orderIds);
          const map: Record<string, OrderOfferSnapshot[]> = {};
          for (const o of offersData || []) {
            if (!map[o.order_id]) map[o.order_id] = [];
            map[o.order_id].push({
              id: o.id,
              orderId: o.order_id,
              offerId: o.offer_id,
              offerName: o.offer_name,
              offerType: o.offer_type,
              originalPrice: Number(o.original_price),
              discountAmount: Number(o.discount_amount),
              discountPercent: Number(o.discount_percent),
              finalPrice: Number(o.final_price),
              quantity: Number(o.quantity) || 1,
              items: (o.items || []).map((i: any) => ({
                id: i.id,
                orderOfferId: i.order_offer_id,
                itemName: i.item_name,
                sizeLabel: i.size_label,
                quantity: i.quantity,
                unitPrice: Number(i.unit_price),
                totalPrice: Number(i.total_price),
              })),
            });
          }
          setOrderOffersMap(map);
        }
      } catch {
        setError('لا توجد طلبات مرتبطة بهذا الرابط');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const customerName = orders[0]?.customer_name || '';
  const customerPhone = orders[0]?.customer_phone || '';
  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'on_the_way'].includes(o.status));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  const [copied, setCopied] = useState(false);

  const trackUrl = typeof window !== 'undefined' ? `${window.location.origin}/t/${token}` : '';
  const shareText = encodeURIComponent(`مرحباً! يمكنك متابعة طلباتك من ${restaurantName} عبر الرابط: ${trackUrl}`);
  const whatsappShareUrl = `https://wa.me/${whatsappNum.replace(/^\+?0+/, '')}?text=${shareText}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loading) return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 15px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>جاري تحميل الطلبات...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', textAlign: 'center' }}>
      <div className="glass-panel" style={{ padding: '60px 40px', maxWidth: '500px', margin: '0 auto' }}>
        <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: '1.8rem', marginBottom: '15px' }}>الرابط غير صحيح</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>لم يتم العثور على طلبات مرتبطة بهذا الرابط. تأكد من الرابط أو تواصل مع المطعم.</p>
        <Link href="/menu" className="btn-primary">العودة للقائمة</Link>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 className="title-gold" style={{ fontSize: '1.8rem', margin: 0 }}>طلباتي</h1>
          {customerName && (
            <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.95rem' }}>
              مرحباً، <strong style={{ color: 'var(--gold)' }}>{customerName}</strong>
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={copyLink}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
          >
            <Copy size={18} /> {copied ? 'تم النسخ ✓' : 'نسخ رابط التتبع'}
          </button>
          <button
            onClick={() => window.open(whatsappShareUrl, '_blank')}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
          >
            <MessageCircle size={18} color="#25D366" /> إرسال الرابط عبر واتساب
          </button>
        </div>
      </div>

      {/* No active orders message */}
      {activeOrders.length === 0 && pastOrders.length > 0 && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>لا توجد طلبات نشطة حالياً. جميع طلباتك السابقة مكتملة.</p>
        </div>
      )}

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>
            الطلبات النشطة ({activeOrders.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeOrders.map(order => renderOrderCard(order, expandedId, setExpandedId, setInvoiceOrder, settings, trackUrl, customerPhone, orderOffersMap[order.id] || []))}
          </div>
        </div>
      )}

      {/* Past Orders */}
      {pastOrders.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-secondary)' }}>
            الطلبات السابقة ({pastOrders.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pastOrders.map(order => renderOrderCard(order, expandedId, setExpandedId, setInvoiceOrder, settings, trackUrl, customerPhone, orderOffersMap[order.id] || []))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <Link href="/menu" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 36px' }}>
          <ShoppingBag size={18} /> طلب جديد
        </Link>
      </div>

      {/* Invoice Modal */}
      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          settings={settings}
          trackUrl={trackUrl}
          orderOffers={orderOffersMap[invoiceOrder.id] || []}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
}

function renderOrderCard(
  order: any,
  expandedId: string | null,
  setExpandedId: (id: string | null) => void,
  setInvoiceOrder: (order: any) => void,
  settings: Record<string, string>,
  trackUrl: string,
  customerPhone: string,
  orderOffers: OrderOfferSnapshot[] = [],
) {
  const isExpanded = expandedId === order.id;
  const cfg = STATUS_CFG[order.status] || { label: order.status, color: '#888' };
  const statusIdx = STATUS_ORDER.indexOf(order.status);
  const canInvoice = order.status !== 'cancelled' && statusIdx >= STATUS_ORDER.indexOf('confirmed');

  const invoiceDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  const currency = settings['currency'] || 'ريال';
  const bundleInfos: OrderBundleInfo[] =
    orderOffers.length > 0
      ? orderOffers.map(snapshotToBundleInfo)
      : (() => { const n = extractBundleFromNotes(order.notes); return n ? [n] : []; })();

  return (
    <div key={order.id} className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Card Header - always visible */}
      <div
        onClick={() => setExpandedId(isExpanded ? null : order.id)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', cursor: 'pointer', gap: '12px',
          borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: cfg.color, flexShrink: 0,
          }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <strong style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{order.order_number}</strong>
              <span style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
                fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                background: cfg.color,
              }}>
                {cfg.label}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>{invoiceDate}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <strong style={{ color: 'var(--gold)', fontSize: '1rem' }}>{order.total_amount} {currency}</strong>
          {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div style={{ padding: '0 20px 20px' }}>
          {/* Status Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: '20px', paddingTop: '12px' }}>
            {STATUS_ORDER.map((status, idx) => {
              const sc = STATUS_CFG[status];
              const isPast = idx <= statusIdx && order.status !== 'cancelled';
              const isCurrent = status === order.status;

              if (order.status === 'cancelled' && status === 'cancelled') {
                return (
                  <div key={status} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.15)', border: '2px solid #ef4444' }}>
                        <XCircle size={14} color="#ef4444" />
                      </div>
                    </div>
                    <div style={{ paddingBottom: '12px' }}><p style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.85rem' }}>{sc.label}</p></div>
                  </div>
                );
              }

              if (order.status === 'cancelled' && status !== 'cancelled') return null;

              return (
                <div key={status} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', opacity: isPast || isCurrent ? 1 : 0.35 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isPast || isCurrent ? `${sc.color}20` : 'var(--glass-bg)', border: `2px solid ${isPast || isCurrent ? sc.color : 'var(--border)'}` }}>
                      {status === 'confirmed' && <CheckCircle size={14} color={isPast || isCurrent ? sc.color : 'var(--text-muted)'} />}
                      {status === 'preparing' && <ChefHat size={14} color={isPast || isCurrent ? sc.color : 'var(--text-muted)'} />}
                      {status === 'on_the_way' && <Truck size={14} color={isPast || isCurrent ? sc.color : 'var(--text-muted)'} />}
                      {status === 'delivered' && <CheckCircle size={14} color={isPast || isCurrent ? sc.color : 'var(--text-muted)'} />}
                      {(status === 'pending') && <Clock size={14} color={isPast || isCurrent ? sc.color : 'var(--text-muted)'} />}
                    </div>
                    {idx < STATUS_ORDER.length - 1 && (
                      <div style={{ width: '2px', flex: 1, minHeight: '20px', background: isPast && order.status !== 'cancelled' ? sc.color : 'var(--border)', marginTop: '4px' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: idx < STATUS_ORDER.length - 1 ? '12px' : 0 }}>
                    <p style={{ fontWeight: isCurrent ? 800 : 500, color: isCurrent ? sc.color : 'var(--text-primary)', fontSize: '0.85rem' }}>{sc.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customer + Payment info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginBottom: '6px' }}>بيانات العميل</h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>الاسم: </span>{order.customer_name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                  <Phone size={12} color="var(--gold)" /> {order.customer_phone}
                </div>
                {order.delivery_address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginTop: '3px' }}>
                    <MapPin size={12} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }} /> {order.delivery_address}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginBottom: '6px' }}>تفاصيل الطلب</h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>رقم الطلب: </span><strong style={{ fontFamily: 'monospace' }}>{order.order_number}</strong></div>
                <div style={{ marginTop: '3px' }}><span style={{ color: 'var(--text-muted)' }}>وسيلة الدفع: </span>{PAYMENT_NAMES[order.payment_method] || order.payment_method}</div>
                {order.notes && <div style={{ marginTop: '3px' }}><span style={{ color: 'var(--text-muted)' }}>ملاحظات: </span>{order.notes}</div>}
              </div>
            </div>
          </div>

          {/* Items */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginBottom: '8px' }}>الأصناف</h4>
            {(order.items || []).map((item: any, idx: number) => (
              <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < (order.items?.length || 0) - 1 ? '1px solid var(--border)' : 'none', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{item.item_name}</span>
                  {item.size_label && item.size_label !== 'عادي' && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginRight: '6px' }}>({item.size_label})</span>}
                  <span style={{ color: 'var(--text-secondary)', marginRight: '6px' }}>× {item.quantity}</span>
                </div>
                <span style={{ fontWeight: 600 }}>{item.total_price} {currency}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ borderTop: '2px solid var(--gold)', paddingTop: '14px' }}>
            {bundleInfos.length > 0 && bundleInfos.map((b, bi) => {
              const bQty = b.quantity || 1;
              return (
                <div key={bi} style={{ marginBottom: '10px', padding: '8px 10px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <Percent size={13} color="#10b981" />
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#10b981' }}>{b.offerName} × {bQty}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1px' }}>
                    <span>سعر الوحدة</span>
                    <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{b.originalPrice} {currency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#10b981' }}>
                    <span>وفرت للوحدة</span>
                    <span>-{b.discountAmount} {currency} ({b.discountPercent}%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', borderTop: '1px solid rgba(16,185,129,0.15)', paddingTop: '2px' }}>
                    <span>إجمالي الباقة</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{bQty * b.originalPrice - bQty * b.discountAmount} {currency}</span>
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <span>المجموع الفرعي</span><span>{order.subtotal} {currency}</span>
            </div>
            {parseFloat(order.delivery_fee) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>رسوم التوصيل</span><span>{order.delivery_fee} {currency}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, color: 'var(--gold)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '6px' }}>
              <span>الإجمالي</span><span>{order.total_amount} {currency}</span>
            </div>
          </div>

          {/* Invoice button */}
          {canInvoice && (
            <div style={{ marginTop: '16px' }}>
              <button onClick={() => setInvoiceOrder(order)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.85rem' }}>
                <Printer size={16} /> حفظ الفاتورة
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
