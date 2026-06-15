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
    const payment = searchParams.get('payment') || 'all';
    const search = searchParams.get('search') || '';

    let q = supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (status !== 'all') q = q.eq('status', status);
    if (payment !== 'all') q = q.eq('payment_method', payment);
    if (search) {
      q = q.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,order_number.ilike.%${search}%`);
    }

    const { data } = await q;

    const rows = (data || []).map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      created_at: order.created_at,
      customer_name: order.customer_name,
      status: STATUS_LABELS[order.status] || order.status,
      payment_method: order.payment_method === 'cash' ? 'نقداً' : order.payment_method === 'wallet' ? 'محفظة' : 'تحويل بنكي',
      total_amount: Number(order.total_amount).toLocaleString('ar-EG'),
      items_count: (order.items || []).length,
    }));

    return NextResponse.json({ data: rows, total: rows.length });
  } catch (error) {
    console.error('[INVOICES_REPORT] Error:', error);
    return NextResponse.json({ error: 'فشل تحميل الفواتير' }, { status: 500 });
  }
}
