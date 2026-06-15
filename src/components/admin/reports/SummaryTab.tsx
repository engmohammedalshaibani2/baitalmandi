'use client';
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#d4af37', '#8b5cf6', '#3b82f6'];
const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function SummaryTab({ currentStart, currentEnd, prevStart, prevEnd, status, payment, search }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/compare?currStart=${currentStart}&currEnd=${currentEnd}&prevStart=${prevStart}&prevEnd=${prevEnd}&status=${status}&payment=${payment}&search=${encodeURIComponent(search || '')}`)
      .then(res => res.json())
      .then(setData)
      .catch(err => { console.error('[SummaryTab] Fetch error:', err); setData({ currentSummary: { sales: 0, count: 0, avgOrder: 0 }, previousSummary: { sales: 0, count: 0, avgOrder: 0 }, salesGrowth: 0, ordersGrowth: 0, avgOrderGrowth: 0, payments: [], hourly: [], daily: [] }); })
      .finally(() => setLoading(false));
  }, [currentStart, currentEnd, prevStart, prevEnd, status, payment, search]);

  if (loading) return <div className="text-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gold)] mx-auto"></div></div>;
  if (!data) return null;

  const paymentsData = (data.payments || []).map((p: any) => ({
    name: p.method === 'cash' ? 'نقداً' : p.method === 'transfer' ? 'تحويل' : 'محفظة',
    value: Number(p.sales)
  }));

  const hoursData = (data.hourly || []).map((h: any) => {
    const hourInt = parseInt(h.hour);
    const suffix = hourInt >= 12 ? 'م' : 'ص';
    const hour12 = hourInt % 12 || 12;
    return {
      name: `${hour12.toString().padStart(2, '0')}:00 ${suffix}`,
      value: Number(h.count)
    };
  });

  const daysData = (data.daily || []).map((d: any) => ({
    name: dayNames[d.day] || d.day,
    value: Number(d.count)
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-panel p-6">
        <h3 className="text-xl font-bold mb-6 text-[var(--gold)]">مقارنة الفترات (نظام النمو)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[var(--glass-bg)] border-b border-[var(--border)] text-gray-400">
              <tr>
                <th className="p-4 font-semibold">المؤشر</th>
                <th className="p-4 font-semibold">الفترة المحددة</th>
                <th className="p-4 font-semibold">الفترة السابقة الموازية</th>
                <th className="p-4 font-semibold">النمو (Growth)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr className="hover:bg-[var(--glass-bg)]">
                <td className="p-4 font-medium">إجمالي المبيعات</td>
                <td className="p-4 font-bold">{Number(data.currentSummary?.sales || 0).toFixed(2)} ريال</td>
                <td className="p-4">{Number(data.previousSummary?.sales || 0).toFixed(2)} ريال</td>
                <td className="p-4 font-bold" dir="ltr">
                  <span className={Number(data.salesGrowth ?? 0) > 0 ? 'text-emerald-500' : Number(data.salesGrowth ?? 0) < 0 ? 'text-red-500' : 'text-gray-400'}>
                    {Number(data.salesGrowth ?? 0) > 0 ? '+' : ''}{Number(data.salesGrowth ?? 0).toFixed(1)}%
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-[var(--glass-bg)]">
                <td className="p-4 font-medium">عدد الطلبات</td>
                <td className="p-4 font-bold">{Number(data.currentSummary?.count || 0)}</td>
                <td className="p-4">{Number(data.previousSummary?.count || 0)}</td>
                <td className="p-4 font-bold" dir="ltr">
                  <span className={Number(data.ordersGrowth ?? 0) > 0 ? 'text-emerald-500' : Number(data.ordersGrowth ?? 0) < 0 ? 'text-red-500' : 'text-gray-400'}>
                    {Number(data.ordersGrowth ?? 0) > 0 ? '+' : ''}{Number(data.ordersGrowth ?? 0).toFixed(1)}%
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-[var(--glass-bg)]">
                <td className="p-4 font-medium">متوسط قيمة الطلب (AOV)</td>
                <td className="p-4 font-bold">{Number(data.currentSummary?.avgOrder || 0).toFixed(2)} ريال</td>
                <td className="p-4">{Number(data.previousSummary?.avgOrder || 0).toFixed(2)} ريال</td>
                <td className="p-4 font-bold" dir="ltr">
                  <span className={Number(data.avgOrderGrowth ?? 0) > 0 ? 'text-emerald-500' : Number(data.avgOrderGrowth ?? 0) < 0 ? 'text-red-500' : 'text-gray-400'}>
                    {Number(data.avgOrderGrowth ?? 0) > 0 ? '+' : ''}{Number(data.avgOrderGrowth ?? 0).toFixed(1)}%
                  </span>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold mb-6 text-[var(--gold)]">تحليل طرق الدفع</h3>
          <div className="h-[300px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {paymentsData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold mb-6 text-[var(--gold)]">أوقات الذروة (خلال اليوم)</h3>
          <div className="h-[300px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: 'rgba(212, 175, 55, 0.5)', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(4px)' }} 
                  itemStyle={{ color: '#d4af37', fontWeight: 'bold', fontSize: '16px' }} 
                  cursor={{ stroke: 'rgba(212, 175, 55, 0.3)', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area type="monotone" dataKey="value" name="الطلبات" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
