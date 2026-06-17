'use client';
import { useState, useEffect } from 'react';
import { Percent, Tag, Gift, TrendingUp, BadgePercent, ShoppingBag } from 'lucide-react';
import { OfferReportSchema, type OfferReport } from '@/schemas/reports';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatUtils';

export default function OffersTab({ startDate, endDate }: {
  startDate: string; endDate: string; status: string; payment: string; search: string;
}) {
  const [data, setData] = useState<OfferReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const qs = `startDate=${startDate}&endDate=${endDate}`;
        const res = await fetch(`/api/reports/offers?${qs}`);
        if (!res.ok) throw new Error('API error');
        const json = await res.json();
        const parsed = OfferReportSchema.parse(json);
        setData(parsed);
      } catch {
        setData(OfferReportSchema.parse({}));
      } finally {
        setLoading(false);
      }
    })();
  }, [startDate, endDate]);

  if (loading) return <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full mx-auto mb-4" /><p className="text-gray-400">جاري تحميل إحصائيات العروض...</p></div>;
  if (!data || data.totalOrders === 0) return <div className="text-center py-20 text-gray-500">لا توجد بيانات عروض في هذه الفترة</div>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-5 text-center">
          <Percent size={28} className="mx-auto mb-3 text-emerald-500" />
          <p className="text-3xl font-bold text-[var(--gold)]">{formatCurrency(data.totalDiscountAmount)}</p>
          <p className="text-sm text-gray-400 mt-2">إجمالي الخصومات</p>
        </div>
        <div className="glass-panel p-5 text-center">
          <ShoppingBag size={28} className="mx-auto mb-3 text-blue-500" />
          <p className="text-3xl font-bold text-[var(--gold)]">{formatNumber(data.offerOrderCount)}</p>
          <p className="text-sm text-gray-400 mt-2">عدد الطلبات التي استخدمت عروضاً</p>
        </div>
        <div className="glass-panel p-5 text-center">
          <BadgePercent size={28} className="mx-auto mb-3 text-purple-500" />
          <p className="text-3xl font-bold text-[var(--gold)]">{formatPercent(data.discountPercentage)}</p>
          <p className="text-sm text-gray-400 mt-2">نسبة الخصومات من إجمالي المبيعات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-5 text-center">
          <TrendingUp size={28} className="mx-auto mb-3 text-green-500" />
          <p className="text-3xl font-bold text-[var(--gold)]">{formatCurrency(data.revenueBeforeDiscounts)}</p>
          <p className="text-sm text-gray-400 mt-2">الإيرادات قبل الخصومات</p>
        </div>
        <div className="glass-panel p-5 text-center">
          <TrendingUp size={28} className="mx-auto mb-3 text-amber-500" />
          <p className="text-3xl font-bold text-[var(--gold)]">{formatCurrency(data.revenueAfterDiscounts)}</p>
          <p className="text-sm text-gray-400 mt-2">الإيرادات بعد الخصومات</p>
        </div>
        <div className="glass-panel p-5 text-center">
          <Gift size={28} className="mx-auto mb-3 text-red-500" />
          <p className="text-3xl font-bold text-[var(--gold)]">{formatNumber(data.freeItemCount)}</p>
          <p className="text-sm text-gray-400 mt-2">المنتجات المجانية الممنوحة عبر العروض</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-5 text-center">
          <Tag size={28} className="mx-auto mb-3 text-cyan-500" />
          <p className="text-3xl font-bold text-[var(--gold)]">{formatCurrency(data.avgDiscountPerOrder)}</p>
          <p className="text-sm text-gray-400 mt-2">متوسط الخصم لكل طلب</p>
        </div>
        <div className="glass-panel p-5 text-center">
          <Percent size={28} className="mx-auto mb-3 text-indigo-500" />
          <p className="text-3xl font-bold text-[var(--gold)]">{data.totalOrders > 0 ? ((data.offerOrderCount / data.totalOrders) * 100).toFixed(1) : '0'}%</p>
          <p className="text-sm text-gray-400 mt-2">نسبة الطلبات ذات العروض</p>
        </div>
      </div>

      {data.topOffers.length > 0 && (
        <div className="glass-panel p-5">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--gold)]">
            <Tag size={20} /> أفضل 10 عروض مبيعاً
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="p-3 text-gray-400 font-bold">#</th>
                  <th className="p-3 text-gray-400 font-bold">اسم العرض</th>
                  <th className="p-3 text-gray-400 font-bold text-center">عدد الطلبات</th>
                  <th className="p-3 text-gray-400 font-bold text-center">الإيرادات</th>
                  <th className="p-3 text-gray-400 font-bold text-center">إجمالي الخصم</th>
                </tr>
              </thead>
              <tbody>
                {data.topOffers.map((offer, i) => (
                  <tr key={offer.name} className="border-b border-[var(--border)] hover:bg-[var(--glass-bg)]">
                    <td className="p-3 font-bold text-[var(--gold)]">{i + 1}</td>
                    <td className="p-3 font-medium">{offer.name}</td>
                    <td className="p-3 text-center">{formatNumber(offer.count)}</td>
                    <td className="p-3 text-center text-green-500">{formatCurrency(offer.revenue)}</td>
                    <td className="p-3 text-center text-red-500">{formatCurrency(offer.discounts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
