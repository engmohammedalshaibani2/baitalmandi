import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار', confirmed: 'تم التأكيد', preparing: 'جاري التحضير',
  on_the_way: 'في الطريق', delivered: 'تم التوصيل', cancelled: 'ملغي',
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

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

    const rows = (data || []).map((log: any) => ({
      id: log.id,
      created_at: log.created_at,
      order_number: log.orders?.order_number || '-',
      customer_name: log.orders?.customer_name || '-',
      old_status: log.old_status ? (STATUS_LABELS[log.old_status] || log.old_status) : '-',
      new_status: log.new_status ? (STATUS_LABELS[log.new_status] || log.new_status) : '-',
      changed_by: log.changed_by?.full_name || 'مستخدم محذوف',
    }));

    return NextResponse.json({ data: rows, total: rows.length });
  } catch (error) {
    console.error('[AUDIT_REPORT] Error:', error);
    return NextResponse.json({ error: 'فشل تحميل سجلات التدقيق' }, { status: 500 });
  }
}
