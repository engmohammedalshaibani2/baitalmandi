'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '@/lib/settings-context';

export default function CustomersTab({ startDate, endDate, status, payment, search }: { startDate: string, endDate: string, status: string, payment: string, search: string }) {
  const { settings } = useSettings();
  const currency = settings['currency'] || 'ريال';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/customers?startDate=${startDate}&endDate=${endDate}&status=${status}&payment=${payment}&search=${encodeURIComponent(search || '')}`)
      .then(res => res.json())
      .then(setData)
      .catch(err => { console.error('[CustomersTab] Fetch error:', err); setData([]); })
      .finally(() => setLoading(false));
  }, [startDate, endDate, status, payment, search]);

  if (loading) return <div className="text-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gold)] mx-auto"></div></div>;
  if (!data) return null;

  return (
    <div className="glass-panel p-6 animate-fade-in">
      <h3 className="text-xl font-bold mb-6 text-[var(--gold)]">أكثر العملاء ولاءً (Top Customers)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-[var(--glass-bg)] border-b border-[var(--border)] text-gray-400">
            <tr>
              <th className="p-4 font-semibold">المركز</th>
              <th className="p-4 font-semibold">اسم العميل</th>
              <th className="p-4 font-semibold">رقم الهاتف</th>
              <th className="p-4 font-semibold">عدد الطلبات</th>
              <th className="p-4 font-semibold">إجمالي الإنفاق</th>
              <th className="p-4 font-semibold">متوسط الطلب</th>
              <th className="p-4 font-semibold">تاريخ آخر طلب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {(data || []).map((c: any, i: number) => (
              <tr key={i} className="hover:bg-[var(--glass-bg)] transition-colors">
                <td className="p-4">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </td>
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4 font-mono">{c.phone}</td>
                <td className="p-4 text-center">{c.ordersCount}</td>
                <td className="p-4 font-bold text-[var(--gold)]">{Number(c.spend).toFixed(2)} {currency}</td>
                <td className="p-4 text-sm text-gray-400">{Number(c.avgOrder).toFixed(2)} {currency}</td>
                <td className="p-4 text-sm" dir="ltr">{new Date(c.lastOrder).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
              </tr>
            ))}
            {data?.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">لا توجد بيانات للعملاء</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
