'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '@/lib/settings-context';
import { supabase } from '@/lib/supabase';
import { Printer } from 'lucide-react';
import { generateReceiptHtml } from '@/components/invoice/receipt-html';

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار', confirmed: 'تم التأكيد', preparing: 'جاري التحضير',
  on_the_way: 'في الطريق', delivered: 'تم التوصيل', cancelled: 'ملغي',
};

export default function InvoicesTab({ startDate, endDate, status, payment, search }: { startDate: string, endDate: string, status: string, payment: string, search: string }) {
  const { settings } = useSettings();
  const currency = settings['currency'] || 'ريال';
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        let q = supabase
          .from('orders')
          .select(`*, items:order_items(*)`)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: false });

        if (status !== 'all') q = q.eq('status', status);
        if (payment !== 'all') q = q.eq('payment_method', payment);
        if (search) {
          q = q.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,order_number.ilike.%${search}%`);
        }

        const { data } = await q;
        setOrders(data || []);
      } catch {} finally { setLoading(false); }
    })();
  }, [startDate, endDate, status, payment, search]);

  const printInvoice = async (order: any) => {
    const [settingsRes, offersRes] = await Promise.all([
      supabase.from('site_settings').select('setting_key, value'),
      supabase.from('order_offers').select('*').eq('order_id', order.id),
    ]);

    const { data: settings } = settingsRes;
    const sMap: Record<string, string> = {};
    (settings || []).forEach((s: any) => { sMap[s.setting_key] = typeof s.value === 'string' ? s.value : JSON.stringify(s.value); });

    let bundleInfo = null;
    const offers = offersRes.data;
    if (offers && offers.length > 0) {
      bundleInfo = (offers || []).map((o: any) => ({
        offerName: o.offer_name,
        originalPrice: Number(o.original_price),
        discountAmount: Number(o.discount_amount),
        discountPercent: Number(o.discount_percent),
        finalPrice: Number(o.final_price),
        quantity: Number(o.quantity) || 1,
      }));
    }

    const token = order.tracking_token || order.id;
    const trackUrl = `${window.location.origin}/t/${token}`;
    const html = generateReceiptHtml(order, sMap, trackUrl, bundleInfo);

    const win = window.open('', '_blank');
    if (!win) { alert('يرجى السماح بالنوافذ المنبثقة'); return; }
    win.document.write(html);
    win.document.close();
  };

  if (loading) return <div className="text-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gold)] mx-auto"></div></div>;

  return (
    <div className="glass-panel overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-[var(--border)]">
        <h3 className="text-lg font-bold text-[var(--gold)]">فواتير الزبائن ({orders.length} فاتورة)</h3>
      </div>
      <div className="overflow-x-auto relative">
        <table className="w-full text-right">
          <thead className="bg-[var(--glass-bg)] border-b border-[var(--border)] text-gray-400">
            <tr>
              <th className="p-4 font-semibold">رقم الفاتورة</th>
              <th className="p-4 font-semibold">التاريخ</th>
              <th className="p-4 font-semibold">العميل</th>
              <th className="p-4 font-semibold">الحالة</th>
              <th className="p-4 font-semibold">وسيلة الدفع</th>
              <th className="p-4 font-semibold">الإجمالي</th>
              <th className="p-4 font-semibold">الفاتورة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {orders.map((order: any) => (
              <tr key={order.id} className="hover:bg-[var(--glass-bg)] transition-colors">
                <td className="p-4 font-mono text-sm">{order.order_number}</td>
                <td className="p-4 text-sm" dir="ltr">{new Date(order.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td className="p-4">{order.customer_name}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-500' :
                    order.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                    order.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </td>
                <td className="p-4">{order.payment_method === 'cash' ? 'نقداً' : order.payment_method === 'wallet' ? 'محفظة' : 'تحويل بنكي'}</td>
                <td className="p-4 font-bold text-[var(--gold)]">{order.total_amount} {currency}</td>
                <td className="p-4">
                  <button onClick={() => printInvoice(order)} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5">
                    <Printer size={14} /> طباعة
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">لا توجد فواتير</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
