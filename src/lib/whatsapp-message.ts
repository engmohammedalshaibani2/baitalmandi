export interface WhatsAppMessageOrder {
  orderNumber: string;
  createdAt: string;
  status: string;
  trackingUrl: string;
}

export interface WhatsAppMessageCustomer {
  name: string;
  phone: string;
  address: string;
}

export interface WhatsAppMessageItem {
  name: string;
  size: string;
  quantity: number;
  totalPrice: number;
}

export interface WhatsAppMessagePayment {
  method: 'cash' | 'wallet' | 'transfer';
  walletName?: string;
  walletNumber?: string;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
}

export interface WhatsAppFinancials {
  subtotal: number;
  deliveryFee: number;
  discounts: number;
  total: number;
  currency: string;
}

export interface WhatsAppMessageInput {
  restaurantName: string;
  whatsappNumber: string;
  order: WhatsAppMessageOrder;
  customer: WhatsAppMessageCustomer;
  items: WhatsAppMessageItem[];
  payment: WhatsAppMessagePayment;
  financials: WhatsAppFinancials;
}

const LINE = '━'.repeat(28);
const SEP = '─'.repeat(28);

/**
 * Build a professional WhatsApp invoice message for paid orders.
 * Returns the wa.me URL.
 */
export function buildWhatsAppOrderMessage(input: WhatsAppMessageInput): string {
  const { restaurantName, order, customer, items, payment, financials } = input;

  const lines: string[] = [];

  // Header
  lines.push(`🏪 *فاتورة طلب - ${restaurantName}*`);
  lines.push('');
  lines.push(LINE);

  // Order info
  lines.push(`📋 *رقم الطلب:* ${order.orderNumber}`);
  lines.push(`📅 *التاريخ:* ${order.createdAt}`);
  lines.push(`🔵 *الحالة:* ${order.status}`);
  lines.push('');
  lines.push(SEP);

  // Customer info
  lines.push('👤 *بيانات العميل*');
  lines.push(`الاسم: ${customer.name}`);
  lines.push(`الهاتف: ${customer.phone}`);
  if (customer.address) {
    lines.push(`📍 العنوان: ${customer.address}`);
  }
  lines.push('');
  lines.push(SEP);

  // Items
  lines.push('🍽️ *المنتجات*');
  items.forEach((item, idx) => {
    const sizeText = item.size !== 'عادي' ? ` (${item.size})` : '';
    lines.push(`${idx + 1}. ${item.name}${sizeText} × ${item.quantity} = ${item.totalPrice} ${financials.currency}`);
  });
  lines.push('');
  lines.push(SEP);

  // Financial details
  lines.push('💰 *البيانات المالية*');
  lines.push(`المجموع الفرعي: ${financials.subtotal} ${financials.currency}`);
  lines.push(`رسوم التوصيل: ${financials.deliveryFee} ${financials.currency}`);
  if (financials.discounts > 0) {
    lines.push(`الخصومات: -${financials.discounts} ${financials.currency}`);
  }
  lines.push('');
  lines.push(`💎 *الإجمالي: ${financials.total} ${financials.currency}*`);
  lines.push('');
  lines.push(SEP);

  // Payment info
  const paymentMethodLabels: Record<string, string> = {
    cash: 'نقداً عند الاستلام',
    wallet: 'محفظة إلكترونية',
    transfer: 'تحويل بنكي',
  };
  lines.push(`💳 *وسيلة الدفع:* ${paymentMethodLabels[payment.method] || payment.method}`);

  if (payment.method === 'wallet' && payment.walletName && payment.walletNumber) {
    lines.push('');
    lines.push('📱 *بيانات المحفظة:*');
    lines.push(`المحفظة: ${payment.walletName}`);
    lines.push(`الرقم: ${payment.walletNumber}`);
  }

  if (payment.method === 'transfer' && payment.bankName && payment.bankAccount) {
    lines.push('');
    lines.push('🏦 *بيانات الحساب البنكي:*');
    lines.push(`البنك: ${payment.bankName}`);
    lines.push(`رقم الحساب: ${payment.bankAccount}`);
    if (payment.bankHolder) {
      lines.push(`صاحب الحساب: ${payment.bankHolder}`);
    }
  }

  lines.push('');
  lines.push(LINE);

  // Tracking link
  lines.push('');
  lines.push(`🔗 *رابط التتبع:* ${order.trackingUrl}`);
  lines.push('');

  // Footer instructions
  lines.push(LINE);
  lines.push('');
  lines.push('عزيزنا الزبون،');
  lines.push('');
  lines.push('يرجى أخذ صورة لإشعار الإيداع أو التحويل وإرسالها مباشرة أسفل هذه الرسالة لإكمال مراجعة الطلب واعتماده.');
  lines.push('');
  lines.push('شكراً لاستخدامكم خدماتنا.');
  lines.push(`🍽️ ${restaurantName}`);

  const message = lines.join('\n');
  const encoded = encodeURIComponent(message);

  return `https://wa.me/${input.whatsappNumber}?text=${encoded}`;
}

/**
 * Format date to Arabic-friendly string.
 */
export function formatOrderDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const time = d.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
  return `${day} - ${time}`;
}

/**
 * Get Arabic status label.
 */
export function getArabicStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'قيد الانتظار',
    confirmed: 'تم التأكيد',
    preparing: 'قيد التحضير',
    on_the_way: 'في الطريق',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي',
  };
  return statusMap[status] || status;
}
