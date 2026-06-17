interface OrderItem {
  id: string;
  item_name: string;
  size_label: string;
  quantity: number;
  unit_price: string;
  total_price: string;
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

export interface ReceiptBundleInfo {
  offerName: string;
  originalPrice: number;
  discountAmount: number;
  discountPercent: number;
  finalPrice: number;
  quantity?: number;
}

/** Generate the receipt body HTML (shared by both customer modal and admin print). */
export function generateReceiptBody(
  order: Order,
  settings: Record<string, string>,
  trackUrl: string,
  bundleInfo?: ReceiptBundleInfo[] | ReceiptBundleInfo | null,
): string {
  const restaurantName = settings['restaurant_name'] || 'بيت المندي';
  const currency = settings['currency'] || 'ريال';
  const addressMain = settings['address_main'] || '';
  const phoneReservations = settings['phone_reservations'] || '';
  const whatsapp = settings['phone_delivery_whatsapp'] || settings['whatsapp_order_number'] || '';
  const restaurantImage = settings['restaurant_image'] || '';

  const invoiceDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const invoiceTime = order.created_at
    ? new Date(order.created_at).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
    : '';

  const deliveryFeeNum = parseFloat(order.delivery_fee) || 0;
  const taxNum = parseFloat(order.tax_amount) || 0;
  const subtotalNum = parseFloat(order.subtotal) || 0;
  const totalNum = parseFloat(order.total_amount) || 0;
  const paymentLabel = PAYMENT_NAMES[order.payment_method] || order.payment_method;

  // Normalize to array for multi-offer support
  const bundleList: ReceiptBundleInfo[] = bundleInfo
    ? Array.isArray(bundleInfo) ? bundleInfo : [bundleInfo]
    : [];
  const totalDiscountAmount = bundleList.reduce(
    (sum, b) => sum + (b.discountAmount || 0) * (b.quantity || 1),
    0,
  );
  const displaySubtotal = subtotalNum;

  const itemsRows = (order.items || []).map((item) => `
    <tr>
      <td style="padding:6px 4px;font-weight:600;color:#1a1a1a">${escHtml(item.item_name)}</td>
      <td style="padding:6px 4px;text-align:center;color:#666;font-size:10px">${escHtml(item.size_label || 'عادي')}</td>
      <td style="padding:6px 4px;text-align:center;color:#444">${item.quantity}</td>
      <td style="padding:6px 4px;text-align:center;color:#444">${escHtml(item.unit_price)}</td>
      <td style="padding:6px 4px;text-align:left;font-weight:700;color:#1a1a1a">${escHtml(item.total_price)}</td>
    </tr>
  `).join('');

  const bundleHtml = bundleList.length > 0 ? bundleList.map((b) => {
    const bQty = b.quantity || 1;
    const bFinalTotal = (b.finalPrice || 0) * bQty;
    return `
    <div class="bundle-box">
      <div class="bundle-title">${escHtml(b.offerName)} × ${bQty}</div>
      <div class="bundle-row">
        <span>السعر الأصلي للوحدة</span>
        <span class="line-through">${(b.originalPrice || 0).toLocaleString('ar-YE')} ${escHtml(currency)}</span>
      </div>
      <div class="bundle-row discount">
        <span>الخصم للوحدة</span>
        <span>-${(b.discountAmount || 0).toLocaleString('ar-YE')} ${escHtml(currency)} (${b.discountPercent || 0}%)</span>
      </div>
      <div class="bundle-row">
        <span>الكمية</span>
        <span>× ${bQty}</span>
      </div>
      <div class="bundle-row final">
        <span>إجمالي الباقة</span>
        <span>${bFinalTotal.toLocaleString('ar-YE')} ${escHtml(currency)}</span>
      </div>
    </div>
  `;
  }).join('') : '';

  return `
    <div class="receipt-inner">
      <div class="title-line">── فاتورة خاصة بالزبون ──</div>

      <div class="divider-dash-gold"></div>

      <div class="restaurant-header">
        ${restaurantImage ? `<img src="${escHtml(restaurantImage)}" alt="" class="restaurant-logo" />` : ''}
        <h1 class="restaurant-name">${escHtml(restaurantName)}</h1>
        ${addressMain ? `<p class="restaurant-address">${escHtml(addressMain)}</p>` : ''}
        <div class="restaurant-contact">
          ${phoneReservations ? `<span>هاتف: ${escHtml(phoneReservations)}</span>` : ''}
          ${whatsapp ? `<span>واتساب: ${escHtml(whatsapp)}</span>` : ''}
        </div>
      </div>

      <div class="divider-solid"></div>

      <div class="order-info-row"><span class="label">رقم الفاتورة</span><strong class="value-mono">${escHtml(order.order_number)}</strong></div>
      <div class="order-info-row"><span class="label">التاريخ</span><span>${invoiceDate}</span></div>
      <div class="order-info-row"><span class="label">الوقت</span><span>${invoiceTime}</span></div>
      <div class="order-info-row"><span class="label">وسيلة الدفع</span><span>${paymentLabel}</span></div>
      ${order.notes ? `<div class="order-info-row"><span class="label">ملاحظات</span><span style="max-width:180px;text-align:left;color:#888">${escHtml(order.notes)}</span></div>` : ''}

      <div class="divider-dash"></div>

      <div class="customer-section">
        <h3 class="section-label">بيانات العميل</h3>
        <div class="customer-details">
          <div><span class="muted">الاسم: </span>${escHtml(order.customer_name)}</div>
          <div><span class="muted">الهاتف: </span>${escHtml(order.customer_phone)}</div>
          ${order.delivery_address ? `<div><span class="muted">العنوان: </span>${escHtml(order.delivery_address)}</div>` : ''}
        </div>
      </div>

      <div class="divider-solid"></div>

      <h3 class="section-label" style="text-align:center">تفاصيل الطلب</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align:right">الصنف</th>
            <th style="text-align:center">الحجم</th>
            <th style="text-align:center">الكمية</th>
            <th style="text-align:center">السعر</th>
            <th style="text-align:left">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      ${bundleHtml}

      <div class="totals-section">
        <div class="total-row"><span>المجموع الفرعي</span><span>${displaySubtotal.toLocaleString('ar-YE')} ${escHtml(currency)}</span></div>
        ${deliveryFeeNum > 0 ? `<div class="total-row"><span>رسوم التوصيل</span><span>${deliveryFeeNum.toLocaleString('ar-YE')} ${escHtml(currency)}</span></div>` : ''}
        ${totalDiscountAmount > 0 ? `<div class="total-row discount"><span>الخصم</span><span>-${totalDiscountAmount.toLocaleString('ar-YE')} ${escHtml(currency)}</span></div>` : ''}
        <div class="total-row final">
          <span>الإجمالي النهائي</span>
          <span>${totalNum.toLocaleString('ar-YE')} ${escHtml(currency)}</span>
        </div>
      </div>

      <div class="divider-dash"></div>

      <div class="qr-section">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackUrl)}" alt="QR" class="qr-image" />
        <p class="qr-label">مسح QR لمتابعة الطلب</p>
      </div>

      <div class="footer">
        <p class="footer-thanks">شكراً لثقتكم بنا</p>
        <p class="footer-brand">${escHtml(restaurantName)}</p>
        <p class="footer-contact">${phoneReservations ? `هاتف: ${escHtml(phoneReservations)}` : ''}${phoneReservations && whatsapp ? ' — ' : ''}${whatsapp ? `واتساب: ${escHtml(whatsapp)}` : ''}</p>
        <p class="footer-year">© ${new Date().getFullYear()} ${escHtml(restaurantName)}</p>
      </div>
    </div>
  `;
}

/** Generate a complete HTML document for printing (used by admin InvoicesTab). */
export function generateReceiptHtml(
  order: Order,
  settings: Record<string, string>,
  trackUrl: string,
  bundleInfo?: ReceiptBundleInfo[] | ReceiptBundleInfo | null,
): string {
  const body = generateReceiptBody(order, settings, trackUrl, bundleInfo);

  return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    ${RECEIPT_CSS}
  </style>
</head>
<body>
  <div class="receipt">
    ${body}
  </div>
  <script>
    // Wait for all images (QR, logo) to load before printing
    var images = document.images;
    var loaded = 0;
    var total = images.length;
    function tryPrint() {
      loaded++;
      if (loaded >= total) window.print();
    }
    if (total === 0) {
      window.print();
    } else {
      for (var i = 0; i < total; i++) {
        if (images[i].complete) {
          tryPrint();
        } else {
          images[i].onload = tryPrint;
          images[i].onerror = tryPrint;
        }
      }
    }
  </script>
</body>
</html>`;
}

const RECEIPT_CSS = `
  @page { margin: 0; size: 320mm auto; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Tajawal', 'Cairo', sans-serif;
    background: #f5f5f5;
    display: flex;
    justify-content: center;
    padding: 20px;
  }
  .receipt {
    width: 320px;
    max-width: 100%;
    background: #ffffff;
    color: #1a1a1a;
    direction: rtl;
    font-size: 13px;
    line-height: 1.7;
    box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  }
  .receipt-inner {
    padding: 24px 16px;
  }
  .title-line {
    text-align: center;
    font-size: 12px;
    color: #c59b5f;
    font-weight: 800;
    margin-bottom: 10px;
  }
  .divider-dash-gold {
    border-top: 1px dashed #c59b5f;
    margin-bottom: 14px;
  }
  .divider-dash {
    border-top: 1px dashed #ddd;
    margin: 10px 0;
  }
  .divider-solid {
    border-top: 1px solid #ddd;
    margin-bottom: 12px;
    margin-top: 0;
  }
  .restaurant-header {
    text-align: center;
    margin-bottom: 14px;
  }
  .restaurant-logo {
    width: 64px; height: 64px;
    border-radius: 50%;
    object-fit: cover;
    margin: 0 auto 8px;
    display: block;
  }
  .restaurant-name {
    font-size: 18px;
    font-weight: 900;
    margin: 0;
    color: #3D0820;
  }
  .restaurant-address {
    font-size: 11px;
    color: #666;
    margin: 4px 0 0;
  }
  .restaurant-contact {
    font-size: 11px;
    color: #666;
    margin-top: 4px;
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .order-info-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 6px;
  }
  .order-info-row .label {
    color: #666;
  }
  .value-mono {
    font-family: monospace;
    color: #3D0820;
  }
  .customer-section {
    margin-bottom: 10px;
  }
  .section-label {
    font-size: 12px;
    font-weight: 800;
    color: #3D0820;
    margin: 0 0 6px;
  }
  .customer-details {
    font-size: 12px;
    color: #444;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .muted {
    color: #888;
  }
  .items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    margin-bottom: 10px;
  }
  .items-table th {
    padding: 5px 4px;
    color: #888;
    font-weight: 600;
    border-bottom: 1px solid #ddd;
  }
  .items-table td {
    padding: 6px 4px;
    border-bottom: 1px solid #f0f0f0;
  }
  .bundle-box {
    margin-bottom: 10px;
    padding: 10px 12px;
    background: rgba(16,185,129,0.05);
    border: 1px solid rgba(16,185,129,0.25);
    border-radius: 8px;
    font-size: 11px;
  }
  .bundle-title {
    font-weight: 800;
    color: #10b981;
    font-size: 12px;
    margin-bottom: 6px;
    text-align: center;
  }
  .bundle-row {
    display: flex;
    justify-content: space-between;
    color: #555;
    margin-bottom: 3px;
  }
  .bundle-row.discount {
    color: #10b981;
    font-weight: 700;
  }
  .bundle-row.final {
    color: #1a1a1a;
    font-weight: 800;
    font-size: 12px;
    border-top: 1px solid rgba(16,185,129,0.2);
    padding-top: 4px;
    margin-top: 4px;
  }
  .line-through {
    text-decoration: line-through;
    color: #999;
  }
  .totals-section {
    border-top: 2px solid #3D0820;
    padding-top: 10px;
    font-size: 12px;
    margin-bottom: 10px;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    color: #555;
  }
  .total-row.discount {
    color: #10b981;
    font-weight: 600;
  }
  .total-row.final {
    font-size: 16px;
    font-weight: 900;
    color: #3D0820;
    border-top: 1px solid #c59b5f;
    padding-top: 6px;
    margin-top: 6px;
  }
  .qr-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
  }
  .qr-image {
    width: 100px;
    height: 100px;
  }
  .qr-label {
    font-size: 9px;
    color: #999;
    margin: 6px 0 0;
    direction: ltr;
  }
  .footer {
    text-align: center;
    border-top: 1px dashed #c59b5f;
    padding-top: 10px;
    margin-top: 10px;
  }
  .footer-thanks {
    font-size: 12px;
    color: #c59b5f;
    font-weight: 700;
    margin: 0;
  }
  .footer-brand {
    font-size: 11px;
    color: #3D0820;
    font-weight: 800;
    margin: 2px 0;
  }
  .footer-contact {
    font-size: 10px;
    color: #888;
    margin: 2px 0;
  }
  .footer-year {
    font-size: 9px;
    color: #aaa;
    margin: 2px 0 0;
  }
  @media print {
    @page {
      margin: 0;
      size: auto;
    }
    body {
      background: #fff;
      padding: 0;
      margin: 0;
    }
    .receipt {
      box-shadow: none;
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-after: avoid;
    }
    .receipt-inner {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .title-line,
    .divider-dash-gold,
    .divider-dash,
    .divider-solid,
    .restaurant-header,
    .order-info-row,
    .customer-section,
    .items-table,
    .bundle-box,
    .totals-section,
    .qr-section,
    .footer {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }
`;

function escHtml(s: unknown): string {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
