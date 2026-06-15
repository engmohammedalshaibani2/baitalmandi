'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار', confirmed: 'تم التأكيد', preparing: 'جاري التحضير',
  on_the_way: 'في الطريق', delivered: 'تم التوصيل', cancelled: 'ملغي',
};

export default function AuditLogsTab({ startDate, endDate, status, search }: { startDate: string, endDate: string, status: string, payment: string, search: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        let q = supabase
          .from('order_status_history')
          .select('*, orders!inner(order_number, customer_name, customer_phone, status), changed_by:changed_by_admin_id(full_name)')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: false })
          .limit(200);

        if (search) {
          q = q.or(`orders.order_number.ilike.%${search}%,orders.customer_name.ilike.%${search}%,orders.customer_phone.ilike.%${search}%`);
        }

        const { data } = await q;
        setLogs(data || []);
      } catch {} finally { setLoading(false); }
    })();
  }, [startDate, endDate, status, search]);

  if (loading) return <div className="text-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gold)] mx-auto"></div></div>;

  return (
    <div className="glass-panel overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-[var(--border)]">
        <h3 className="text-lg font-bold text-[var(--gold)]">سجلات التدقيق ({logs.length} سجل)</h3>
      </div>
      <div className="overflow-x-auto relative">
        <table className="w-full text-right">
          <thead className="bg-[var(--glass-bg)] border-b border-[var(--border)] text-gray-400">
            <tr>
              <th className="p-4 font-semibold">التاريخ والوقت</th>
              <th className="p-4 font-semibold">رقم الطلب</th>
              <th className="p-4 font-semibold">العميل</th>
              <th className="p-4 font-semibold">الحالة القديمة</th>
              <th className="p-4 font-semibold">الحالة الجديدة</th>
              <th className="p-4 font-semibold">بواسطة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-[var(--glass-bg)] transition-colors">
                <td className="p-4 text-sm" dir="ltr">{new Date(log.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td className="p-4 font-mono text-sm">{log.orders?.order_number || '-'}</td>
                <td className="p-4 text-sm">{log.orders?.customer_name || '-'}</td>
                <td className="p-4">
                  {log.old_status ? (
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-500/20 text-gray-400">
                      {STATUS_LABELS[log.old_status] || log.old_status}
                    </span>
                  ) : <span className="text-gray-500 text-xs">-</span>}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    log.new_status === 'delivered' ? 'bg-emerald-500/20 text-emerald-500' :
                    log.new_status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                    log.new_status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {STATUS_LABELS[log.new_status] || log.new_status}
                  </span>
                </td>
                <td className="p-4 text-xs text-gray-400">{log.changed_by?.full_name || 'مستخدم محذوف'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">لا توجد سجلات تدقيق</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
