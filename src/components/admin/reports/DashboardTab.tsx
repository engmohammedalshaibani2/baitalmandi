'use client';
import { useState, useEffect } from 'react';

export default function DashboardTab({ startDate, endDate, status, payment, search }: { startDate: string, endDate: string, status: string, payment: string, search: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/dashboard?startDate=${startDate}&endDate=${endDate}&status=${status}&payment=${payment}&search=${encodeURIComponent(search || '')}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [startDate, endDate, status, payment, search]);

  if (loading) return <div className="text-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gold)] mx-auto"></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-[#d4af37]">
          <p className="text-gray-400 text-sm mb-2">مبيعات الفترة</p>
          <h3 className="text-3xl font-bold text-[var(--gold)]">{data.todaySales?.toFixed(2) || '0.00'} ريال</h3>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-blue-500">
          <p className="text-gray-400 text-sm mb-2">عدد الطلبات</p>
          <h3 className="text-3xl font-bold">{data.todayOrders || 0}</h3>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-purple-500">
          <p className="text-gray-400 text-sm mb-2">الطلبات النشطة (قيد التنفيذ)</p>
          <h3 className="text-3xl font-bold">{data.activeOrders || 0}</h3>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-xl font-bold mb-4 text-[var(--gold)]">آخر الطلبات (أحدث 10)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[var(--glass-bg)] border-b border-[var(--border)] text-gray-400">
              <tr>
                <th className="p-4 font-semibold">رقم الطلب</th>
                <th className="p-4 font-semibold">العميل</th>
                <th className="p-4 font-semibold">المبلغ</th>
                <th className="p-4 font-semibold">الحالة</th>
                <th className="p-4 font-semibold">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(data.lastOrders || []).map((o: any) => (
                <tr key={o.id} className="hover:bg-[var(--glass-bg)] transition-colors">
                  <td className="p-4 font-mono">{o.orderNumber}</td>
                  <td className="p-4">{o.customerName}</td>
                  <td className="p-4 font-bold">{Number(o.totalAmount).toFixed(2)} ريال</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs bg-[var(--gold-faint)] text-[var(--gold)]`}>{o.status}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-400">{new Date(o.createdAt).toLocaleTimeString('ar-EG')}</td>
                </tr>
              ))}
              {data.lastOrders?.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-gray-500">لا يوجد طلبات في هذه الفترة</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
