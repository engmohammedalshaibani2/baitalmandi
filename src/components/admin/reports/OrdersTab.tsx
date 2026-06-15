'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '@/lib/settings-context';

export default function OrdersTab({ startDate, endDate, status, payment, search }: { startDate: string, endDate: string, status: string, payment: string, search: string }) {
  const { settings } = useSettings();
  const currency = settings['currency'] || 'ريال';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/orders?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=50&status=${status}&payment=${payment}&search=${encodeURIComponent(search || '')}`)
      .then(res => res.json())
      .then(setData)
      .catch(err => { console.error('[OrdersTab] Fetch error:', err); setData({ data: [], total: 0, page: 1, totalPages: 0 }); })
      .finally(() => setLoading(false));
  }, [startDate, endDate, page, status, payment, search]);

  if (loading && !data) return <div className="text-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gold)] mx-auto"></div></div>;
  if (!data) return null;

  return (
    <div className="glass-panel overflow-hidden animate-fade-in">
      <div className="p-4 flex justify-between items-center border-b border-[var(--border)]">
        <h3 className="text-lg font-bold text-[var(--gold)]">سجل الطلبات المفصل ({data.total} طلب)</h3>
        <div className="flex gap-2 items-center">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm py-1 px-3 disabled:opacity-50">السابق</button>
          <span className="text-gray-400">صفحة {data.page} من {data.totalPages || 1}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm py-1 px-3 disabled:opacity-50">التالي</button>
        </div>
      </div>
      <div className="overflow-x-auto relative">
        {loading && <div className="absolute inset-0 bg-black/20 flex justify-center items-center backdrop-blur-sm z-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--gold)]"></div></div>}
        <table className="w-full text-right">
          <thead className="bg-[var(--glass-bg)] border-b border-[var(--border)] text-gray-400">
            <tr>
              <th className="p-4 font-semibold">رقم الطلب</th>
              <th className="p-4 font-semibold">تاريخ ووقت الطلب</th>
              <th className="p-4 font-semibold">اسم العميل</th>
              <th className="p-4 font-semibold">حالة الطلب</th>
              <th className="p-4 font-semibold">طريقة الدفع</th>
              <th className="p-4 font-semibold">الأصناف المطلوبة</th>
              <th className="p-4 font-semibold">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {(data.data || []).map((order: any) => (
              <tr key={order.id} className="hover:bg-[var(--glass-bg)] transition-colors">
                <td className="p-4 font-mono text-sm">{order.orderNumber}</td>
                <td className="p-4 text-sm" dir="ltr">{new Date(order.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td className="p-4">{order.customerName}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-500' :
                    order.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                    'bg-amber-500/20 text-amber-500'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4">{order.paymentMethod === 'cash' ? 'نقداً' : order.paymentMethod === 'transfer' ? 'تحويل' : 'محفظة'}</td>
                <td className="p-4 text-xs text-gray-400 min-w-[250px]">
                  <ul className="space-y-2">
                    {order.items?.map((item: any) => (
                      <li key={item.id} className="flex justify-between items-center border-b border-[var(--border)] last:border-0 pb-2 last:pb-0">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-200 text-sm">{item.itemName}</span>
                          <span className="text-[10px] text-gray-500">{item.categoryName}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="bg-[var(--glass-bg)] px-2 py-0.5 rounded text-[10px]">الكمية: {item.quantity}</span>
                          <span className="text-[var(--gold)] font-medium">{Number(item.totalPrice).toFixed(2)} {currency}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="p-4 font-bold text-[var(--gold)]">{Number(order.totalAmount).toFixed(2)} {currency}</td>
              </tr>
            ))}
            {data.data?.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">لا توجد طلبات</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
