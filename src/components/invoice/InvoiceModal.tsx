'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { X, Download, ImageIcon, FileText } from 'lucide-react';

interface OrderItem {
  id: string;
  item_name: string;
  size_label: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

interface OrderOfferItem {
  id: string;
  orderOfferId: string;
  itemName: string;
  sizeLabel: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderOffer {
  id: string;
  orderId: string;
  offerId: string | null;
  offerName: string;
  offerType: string;
  originalPrice: number;
  discountAmount: number;
  discountPercent: number;
  finalPrice: number;
  items: OrderOfferItem[];
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  subtotal: string;
  delivery_fee: string;
  tax_amount: string;
  total_amount: string;
  status: string;
  payment_method: string;
  notes?: string;
  created_at: string;
  items: OrderItem[];
}

const PAYMENT_NAMES: Record<string, string> = {
  cash: 'نقداً', wallet: 'محفظة إلكترونية', transfer: 'تحويل بنكي',
};

/** Clones receipt DOM into a detached element for clean html2canvas capture */
async function captureElement(el: HTMLElement, scale = 3): Promise<HTMLCanvasElement | null> {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.position = 'fixed';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.width = '320px';
  clone.style.height = 'auto';
  clone.style.overflow = 'visible';
  clone.style.zIndex = '-1';
  document.body.appendChild(clone);
  try {
    return await html2canvas(clone, { scale, backgroundColor: '#ffffff', useCORS: true, allowTaint: true });
  } finally {
    document.body.removeChild(clone);
  }
}

export default function InvoiceModal({
  order, settings, trackUrl, orderOffers, onClose,
}: {
  order: Order; settings: Record<string, string>; trackUrl: string; orderOffers?: OrderOffer[]; onClose: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null);

  const restaurantName = settings['restaurant_name'] || 'بيت المندي';
  const currency = settings['currency'] || 'ريال';
  const addressMain = settings['address_main'] || '';
  const phoneReservations = settings['phone_reservations'] || '';
  const whatsapp = settings['phone_delivery_whatsapp'] || settings['whatsapp_order_number'] || '';
  const restaurantImage = settings['restaurant_image'] || '';
  const invoiceDate = useMemo(() => {
    if (!order.created_at) return '';
    const d = new Date(order.created_at);
    return d.toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' });
  }, [order.created_at]);
  const invoiceTime = useMemo(() => {
    if (!order.created_at) return '';
    return new Date(order.created_at).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
  }, [order.created_at]);

  const qrValue = trackUrl;

  const bundleOffer = (orderOffers || []).length > 0 ? orderOffers![0] : null;
  const discountAmount = bundleOffer ? bundleOffer.discountAmount : 0;
  const displaySubtotal = (parseFloat(order.subtotal) || 0) + discountAmount;

  const handleExport = useCallback(async (format: 'png' | 'pdf') => {
    const el = receiptRef.current;
    if (!el) return;
    setExporting(format);
    try {
      const canvas = await captureElement(el, 3);
      if (!canvas) return;

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `فاتورة-${order.order_number}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        // 80mm thermal receipt width (standard), height proportional to canvas
        const RECEIPT_WIDTH_MM = 80;
        const pdfHeightMm = (canvas.height * RECEIPT_WIDTH_MM) / canvas.width;
        const pdf = new jsPDF({ unit: 'mm', format: [RECEIPT_WIDTH_MM, pdfHeightMm], compress: true });
        pdf.addImage(imgData, 'PNG', 0, 0, RECEIPT_WIDTH_MM, pdfHeightMm);
        pdf.save(`فاتورة-${order.order_number}.pdf`);
      }
    } catch (err) { console.error(`[Invoice] ${format} export failed:`, err); }
    finally { setExporting(null); }
  }, [order.order_number]);

  const deliveryFeeNum = parseFloat(order.delivery_fee) || 0;
  const subtotalNum = parseFloat(order.subtotal) || 0;
  const totalNum = parseFloat(order.total_amount) || 0;

  const STYLES = {
    receipt: {
      width: '320px', maxWidth: '100%',
      background: '#ffffff', color: '#1a1a1a',
      borderRadius: '4px', padding: '24px 16px',
      fontFamily: "'Tajawal', 'Cairo', sans-serif",
      direction: 'rtl' as const, fontSize: '13px',
      lineHeight: 1.7,
    },
    titleLine: { textAlign: 'center' as const, fontSize: '12px', color: '#c59b5f', fontWeight: 800, marginBottom: '10px' },
    dashedGold: { borderTop: '1px dashed #c59b5f', marginBottom: '14px' },
    dashed: { borderTop: '1px dashed #ddd', margin: '10px 0' },
    solid: { borderTop: '1px solid #ddd', marginBottom: '12px' },
    restHeader: { textAlign: 'center' as const, marginBottom: '14px' },
    restName: { fontSize: '18px', fontWeight: 900, margin: 0, color: '#3D0820' },
    restAddr: { fontSize: '11px', color: '#666', margin: '4px 0 0' },
    restContact: { fontSize: '11px', color: '#666', marginTop: '4px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' as const },
    infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' },
    infoLabel: { color: '#666' },
    valueMono: { fontFamily: 'monospace', color: '#3D0820' },
    sectionLabel: { fontSize: '12px', fontWeight: 800, color: '#3D0820', margin: '0 0 6px' },
    customerDetails: { fontSize: '12px', color: '#444', display: 'flex', flexDirection: 'column' as const, gap: '3px' },
    muted: { color: '#888' },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '11px', marginBottom: '10px' },
    th: { padding: '5px 4px', color: '#888', fontWeight: 600, borderBottom: '1px solid #ddd' },
    td: { padding: '6px 4px', borderBottom: '1px solid #f0f0f0' },
    bundleBox: { marginBottom: '10px', padding: '10px 12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', fontSize: '11px' },
    bundleTitle: { fontWeight: 800, color: '#10b981', fontSize: '12px', marginBottom: '6px', textAlign: 'center' as const },
    bundleRow: { display: 'flex', justifyContent: 'space-between', color: '#555', marginBottom: '3px' },
    bundleFinal: { display: 'flex', justifyContent: 'space-between', color: '#1a1a1a', fontWeight: 800, fontSize: '12px', borderTop: '1px solid rgba(16,185,129,0.2)', paddingTop: '4px', marginTop: '4px' },
    lineThrough: { textDecoration: 'line-through', color: '#999' },
    totalsSection: { borderTop: '2px solid #3D0820', paddingTop: '10px', fontSize: '12px', marginBottom: '10px' },
    totalRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#555' },
    totalFinal: { display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, color: '#3D0820', borderTop: '1px solid #c59b5f', paddingTop: '6px', marginTop: '6px' },
    qrSection: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', marginBottom: '8px' },
    qrLabel: { fontSize: '9px', color: '#999', margin: '6px 0 0', direction: 'ltr' as const },
    footer: { textAlign: 'center' as const, borderTop: '1px dashed #c59b5f', paddingTop: '10px', marginTop: '10px' },
    footerThanks: { fontSize: '12px', color: '#c59b5f', fontWeight: 700, margin: 0 },
    footerBrand: { fontSize: '11px', color: '#3D0820', fontWeight: 800, margin: '2px 0' },
    footerContact: { fontSize: '10px', color: '#888', margin: '2px 0' },
    footerYear: { fontSize: '9px', color: '#aaa', margin: '2px 0 0' },
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      padding: '16px', direction: 'rtl',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card, #1a1a2e)',
        borderRadius: '16px', maxWidth: '420px', width: '100%',
        maxHeight: '95vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid var(--border, #333)',
          flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold, #C59B5F)' }}>
            فاتورة الطلب
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleExport('png')} disabled={!!exporting}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border, #333)', background: 'var(--glass-bg, rgba(255,255,255,0.05))', color: 'var(--text-primary, #fff)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s', opacity: exporting ? 0.5 : 1 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border, #333)' }}>
              <ImageIcon size={16} /> {exporting === 'png' ? '...' : 'PNG'}
            </button>
            <button onClick={() => handleExport('pdf')} disabled={!!exporting}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border, #333)', background: 'var(--glass-bg, rgba(255,255,255,0.05))', color: 'var(--text-primary, #fff)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s', opacity: exporting ? 0.5 : 1 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border, #333)' }}>
              <FileText size={16} /> {exporting === 'pdf' ? '...' : 'PDF'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #888)', cursor: 'pointer', padding: '8px', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable receipt area */}
        <div style={{ overflow: 'auto', padding: '20px', flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div ref={receiptRef} style={STYLES.receipt}>
            {/* Title */}
            <div style={STYLES.titleLine}>── فاتورة خاصة بالزبون ──</div>

            <div style={STYLES.dashedGold} />

            {/* Restaurant header */}
            <div style={STYLES.restHeader}>
              {restaurantImage && (
                <img src={restaurantImage} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px', display: 'block' }} />
              )}
              <h1 style={STYLES.restName}>{restaurantName}</h1>
              {addressMain && <p style={STYLES.restAddr}>{addressMain}</p>}
              <div style={STYLES.restContact}>
                {phoneReservations && <span>هاتف: {phoneReservations}</span>}
                {whatsapp && <span>واتساب: {whatsapp}</span>}
              </div>
            </div>

            <div style={STYLES.solid} />

            {/* Order info */}
            <div style={STYLES.infoRow}><span style={STYLES.infoLabel}>رقم الفاتورة</span><strong style={STYLES.valueMono}>{order.order_number}</strong></div>
            <div style={STYLES.infoRow}><span style={STYLES.infoLabel}>التاريخ</span><span>{invoiceDate}</span></div>
            <div style={STYLES.infoRow}><span style={STYLES.infoLabel}>الوقت</span><span>{invoiceTime}</span></div>
            <div style={STYLES.infoRow}><span style={STYLES.infoLabel}>وسيلة الدفع</span><span>{PAYMENT_NAMES[order.payment_method] || order.payment_method}</span></div>
            {order.notes && (
              <div style={STYLES.infoRow}>
                <span style={STYLES.infoLabel}>ملاحظات</span>
                <span style={{ maxWidth: '180px', textAlign: 'left', color: '#888' }}>{order.notes}</span>
              </div>
            )}

            <div style={STYLES.dashed} />

            {/* Customer data */}
            <div style={{ marginBottom: '10px' }}>
              <h3 style={STYLES.sectionLabel}>بيانات العميل</h3>
              <div style={STYLES.customerDetails}>
                <div><span style={STYLES.muted}>الاسم: </span>{order.customer_name}</div>
                <div><span style={STYLES.muted}>الهاتف: </span>{order.customer_phone}</div>
                {order.delivery_address && <div><span style={STYLES.muted}>العنوان: </span>{order.delivery_address}</div>}
              </div>
            </div>

            <div style={STYLES.solid} />

            {/* Items table */}
            <h3 style={{ ...STYLES.sectionLabel, textAlign: 'center' }}>تفاصيل الطلب</h3>
            <table style={STYLES.table}>
              <thead>
                <tr>
                  <th style={{ ...STYLES.th, textAlign: 'right' }}>الصنف</th>
                  <th style={{ ...STYLES.th, textAlign: 'center' }}>الحجم</th>
                  <th style={{ ...STYLES.th, textAlign: 'center' }}>الكمية</th>
                  <th style={{ ...STYLES.th, textAlign: 'center' }}>السعر</th>
                  <th style={{ ...STYLES.th, textAlign: 'left' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td style={{ ...STYLES.td, fontWeight: 600, color: '#1a1a1a' }}>{item.item_name}</td>
                    <td style={{ ...STYLES.td, textAlign: 'center', color: '#666', fontSize: '10px' }}>{item.size_label || 'عادي'}</td>
                    <td style={{ ...STYLES.td, textAlign: 'center', color: '#444' }}>{item.quantity}</td>
                    <td style={{ ...STYLES.td, textAlign: 'center', color: '#444' }}>{item.unit_price}</td>
                    <td style={{ ...STYLES.td, textAlign: 'left', fontWeight: 700, color: '#1a1a1a' }}>{item.total_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bundle / Offer */}
            {bundleOffer && (
              <div style={STYLES.bundleBox}>
                <div style={STYLES.bundleTitle}>{bundleOffer.offerName}</div>
                <div style={STYLES.bundleRow}>
                  <span>السعر الأصلي</span>
                  <span style={STYLES.lineThrough}>{bundleOffer.originalPrice.toLocaleString('ar-YE')} {currency}</span>
                </div>
                <div style={{ ...STYLES.bundleRow, color: '#10b981', fontWeight: 700 }}>
                  <span>الخصم</span>
                  <span>-{bundleOffer.discountAmount.toLocaleString('ar-YE')} {currency} ({bundleOffer.discountPercent}%)</span>
                </div>
                <div style={STYLES.bundleFinal}>
                  <span>السعر النهائي</span>
                  <span>{bundleOffer.finalPrice.toLocaleString('ar-YE')} {currency}</span>
                </div>
              </div>
            )}

            {/* Totals */}
            <div style={STYLES.totalsSection}>
              <div style={STYLES.totalRow}>
                <span>المجموع الفرعي</span>
                <span>{displaySubtotal.toLocaleString('ar-YE')} {currency}</span>
              </div>
              {deliveryFeeNum > 0 && (
                <div style={STYLES.totalRow}>
                  <span>رسوم التوصيل</span>
                  <span>{deliveryFeeNum.toLocaleString('ar-YE')} {currency}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div style={{ ...STYLES.totalRow, color: '#10b981', fontWeight: 600 }}>
                  <span>الخصم</span>
                  <span>-{discountAmount.toLocaleString('ar-YE')} {currency}</span>
                </div>
              )}
              <div style={STYLES.totalFinal}>
                <span>الإجمالي النهائي</span>
                <span>{totalNum.toLocaleString('ar-YE')} {currency}</span>
              </div>
            </div>

            <div style={STYLES.dashed} />

            {/* QR Code */}
            <div style={STYLES.qrSection}>
              <QRCodeSVG value={qrValue} size={100} level="M" />
              <p style={STYLES.qrLabel}>مسح QR لمتابعة الطلب</p>
            </div>

            {/* Footer */}
            <div style={STYLES.footer}>
              <p style={STYLES.footerThanks}>شكراً لثقتكم بنا</p>
              <p style={STYLES.footerBrand}>{restaurantName}</p>
              <p style={STYLES.footerContact}>
                {phoneReservations ? `هاتف: ${phoneReservations}` : ''}
                {phoneReservations && whatsapp ? ' — ' : ''}
                {whatsapp ? `واتساب: ${whatsapp}` : ''}
              </p>
              <p style={STYLES.footerYear}>© {new Date().getFullYear()} {restaurantName}</p>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div style={{
          display: 'flex', gap: '10px', padding: '14px 20px',
          borderTop: '1px solid var(--border, #333)', flexShrink: 0,
        }}>
          <button onClick={() => handleExport('png')} disabled={!!exporting} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '0.9rem' }}>
            <Download size={18} /> {exporting === 'png' ? 'جاري التصدير...' : 'حفظ كصورة PNG'}
          </button>
          <button onClick={() => handleExport('pdf')} disabled={!!exporting} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '0.9rem' }}>
            <FileText size={18} /> {exporting === 'pdf' ? 'جاري التصدير...' : 'حفظ كـ PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
