'use client';
import { useState, useEffect } from 'react';
import { Truck, TrendingUp, CloudSun, Clock, DollarSign, MapPin, BarChart3 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatUtils';

interface FeeByDay {
  day: string; orders: number; totalFee: number; avgFee: number;
}
interface FeeByDistanceRange {
  range: string; orders: number; totalFee: number;
}
interface DeliveryData {
  totalOrders: number;
  ordersWithDelivery: number;
  totalDeliveryFee: number;
  avgDeliveryFee: number;
  avgDistanceKm: number;
  totalBaseFee: number;
  totalExtraFee: number;
  totalWeatherFee: number;
  totalPeakFee: number;
  ordersWithWeatherFee: number;
  ordersWithPeakFee: number;
  avgPeakPercentage: number;
  feeByDay: FeeByDay[];
  feeByDistanceRange: FeeByDistanceRange[];
}

export default function DeliveryAnalyticsTab({ startDate, endDate, status, payment, search }: {
  startDate: string; endDate: string; status: string; payment: string; search: string;
}) {
  const [data, setData] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const qs = `startDate=${startDate}&endDate=${endDate}&status=${status}&payment=${payment}&search=${encodeURIComponent(search)}`;
        const res = await fetch(`/api/reports/delivery-analytics?${qs}`);
        if (res.ok) setData(await res.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [startDate, endDate, status, payment, search]);

  if (loading) return <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full mx-auto mb-4" /><p className="text-gray-400">جاري تحميل تحليلات التوصيل...</p></div>;
  if (!data || data.totalOrders === 0) return <div className="text-center py-20 text-gray-500">لا توجد بيانات توصيل في هذه الفترة</div>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-panel p-5 text-center">
          <DollarSign size={28} className="mx-auto mb-3 text-emerald-500" />
          <p className="text-3xl font-bold text-[var(--gold)]">{formatCurrency(data.totalDeliveryFee)}</p>
          <p className="text-sm text-gray-400 mt-2">إجمالي رسوم التوصيل</p>
        </div>
        <div className="glass-panel p-5 text-center">
          <TrendingUp size={28} className="mx-auto mb-3 text-blue-500" />
          <p className="text-3xl font-bold text-[var(--gold)]">{formatCurrency(data.avgDeliveryFee)}</p>
          <p className="text-sm text-gray-400 mt-2">متوسط رسوم التوصيل</p>
        </div>
        <div className="glass-panel p-5 text-center">
          <MapPin size={28} className="mx-auto mb-3 text-amber-500" />
          <p className="text-3xl font-bold text-[var(--gold)]">{formatNumber(data.avgDistanceKm)} كم</p>
          <p className="text-sm text-gray-400 mt-2">متوسط مسافة التوصيل</p>
        </div>
        <div className="glass-panel p-5 text-center">
          <Truck size={28} className="mx-auto mb-3 text-purple-500" />
          <p className="text-3xl font-bold text-[var(--gold)]">{formatNumber(data.totalOrders)}</p>
          <p className="text-sm text-gray-400 mt-2">عدد الطلبات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-bold text-[var(--gold)]">{formatCurrency(data.totalBaseFee)}</p>
          <p className="text-xs text-gray-400 mt-1">الرسوم الأساسية</p>
        </div>
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-bold text-[var(--gold)]">{formatCurrency(data.totalExtraFee)}</p>
          <p className="text-xs text-gray-400 mt-1">رسوم المسافة الإضافية</p>
        </div>
        <div className="glass-panel p-4 text-center" style={{ borderColor: data.totalWeatherFee > 0 ? 'rgba(59,130,246,0.3)' : undefined }}>
          <CloudSun size={18} className="mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold text-[var(--gold)]">{formatCurrency(data.totalWeatherFee)}</p>
          <p className="text-xs text-gray-400 mt-1">رسوم الطقس ({data.ordersWithWeatherFee} طلب)</p>
        </div>
        <div className="glass-panel p-4 text-center" style={{ borderColor: data.totalPeakFee > 0 ? 'rgba(245,158,11,0.3)' : undefined }}>
          <Clock size={18} className="mx-auto mb-1 text-amber-500" />
          <p className="text-2xl font-bold text-[var(--gold)]">{formatCurrency(data.totalPeakFee)}</p>
          <p className="text-xs text-gray-400 mt-1">رسوم الذروة ({data.ordersWithPeakFee} طلب، {data.avgPeakPercentage}%)</p>
        </div>
      </div>

      <div className="glass-panel p-5 mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-[var(--gold)]" /> رسوم التوصيل حسب اليوم
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-right py-3 px-3 text-gray-400 font-medium">اليوم</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium">عدد الطلبات</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium">إجمالي الرسوم</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium">متوسط الرسوم</th>
              </tr>
            </thead>
            <tbody>
              {data.feeByDay.map(row => (
                <tr key={row.day} className="border-b border-[var(--border)] hover:bg-[var(--glass-bg)]">
                  <td className="py-2.5 px-3 font-medium">{row.day}</td>
                  <td className="py-2.5 px-3">{formatNumber(row.orders)}</td>
                  <td className="py-2.5 px-3 font-bold text-[var(--gold)]">{formatCurrency(row.totalFee)}</td>
                  <td className="py-2.5 px-3">{formatCurrency(row.avgFee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel p-5">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-[var(--gold)]" /> رسوم التوصيل حسب نطاق المسافة
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-right py-3 px-3 text-gray-400 font-medium">نطاق المسافة</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium">عدد الطلبات</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium">إجمالي الرسوم</th>
              </tr>
            </thead>
            <tbody>
              {data.feeByDistanceRange.map(row => (
                <tr key={row.range} className="border-b border-[var(--border)] hover:bg-[var(--glass-bg)]">
                  <td className="py-2.5 px-3 font-medium">{row.range}</td>
                  <td className="py-2.5 px-3">{formatNumber(row.orders)}</td>
                  <td className="py-2.5 px-3 font-bold text-[var(--gold)]">{formatCurrency(row.totalFee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
