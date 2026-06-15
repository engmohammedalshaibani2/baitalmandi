'use client';
import { useState, useEffect } from 'react';

export default function ProductsTab({ startDate, endDate, status, payment, search }: { startDate: string, endDate: string, status: string, payment: string, search: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/products?startDate=${startDate}&endDate=${endDate}&status=${status}&payment=${payment}&search=${encodeURIComponent(search || '')}`)
      .then(res => res.json())
      .then(setData)
      .catch(err => { console.error('[ProductsTab] Fetch error:', err); setData({ top10Qty: [], top10Rev: [], bottom10Qty: [], unsold: [], categoriesSales: [] }); })
      .finally(() => setLoading(false));
  }, [startDate, endDate, status, payment, search]);

  if (loading) return <div className="text-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gold)] mx-auto"></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold mb-4 text-emerald-400">Top 10 الأكثر مبيعاً (كمية)</h3>
          <div className="space-y-3">
            {(data.top10Qty || []).map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-[var(--glass-bg)] rounded-lg transition-colors">
                <span className="font-medium">{i+1}. {item.name}</span>
                <span className="font-bold text-emerald-400">{item.quantity} طلب</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold mb-4 text-[var(--gold)]">الأطباق الأعلى إيراداً</h3>
          <div className="space-y-3">
            {(data.top10Rev || []).map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-[var(--glass-bg)] rounded-lg transition-colors">
                <span className="font-medium">{i+1}. {item.name}</span>
                <span className="font-bold text-[var(--gold)]">{Number(item.revenue).toFixed(2)} ريال</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold mb-4 text-red-400">الأقل مبيعاً (Bottom 10)</h3>
          <div className="space-y-3">
            {(data.bottom10Qty || []).map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-[var(--glass-bg)] rounded-lg transition-colors">
                <span className="font-medium">{i+1}. {item.name}</span>
                <span className="font-bold text-red-400">{item.quantity} طلب</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-400">أصناف لم تُطلب إطلاقاً</h3>
          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {(data.unsold || []).map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <span className="font-medium text-gray-300">{item.name}</span>
                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">0 طلبات</span>
              </div>
            ))}
            {data.unsold?.length === 0 && (
              <div className="text-center text-gray-500 p-4">جميع الأصناف تم طلبها بنجاح</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Categories Sales Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]"><h3 className="text-xl font-bold text-[var(--gold)]">مبيعات التصنيفات</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[var(--glass-bg)] text-gray-400 border-b border-[var(--border)]">
              <tr>
                <th className="p-4">التصنيف</th>
                <th className="p-4">الطلبات</th>
                <th className="p-4">الكمية المباعة</th>
                <th className="p-4">الإيرادات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(data.categoriesSales || []).map((cat: any, i: number) => (
                <tr key={i} className="hover:bg-[var(--glass-bg)]">
                  <td className="p-4 font-medium">{cat.name}</td>
                  <td className="p-4">{cat.ordersCount}</td>
                  <td className="p-4">{cat.quantity}</td>
                  <td className="p-4 font-bold text-[var(--gold)]">{Number(cat.revenue).toFixed(2)} ريال</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
