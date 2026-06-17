import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('startDate') || new Date(new Date().setHours(0,0,0,0)).toISOString();
  const end = searchParams.get('endDate') || new Date(new Date().setHours(23,59,59,999)).toISOString();

  try {
    const supabase = await createClient();

    // Try materialized view first
    const { data: mv } = await supabase.from('mv_dashboard_metrics').select('*').maybeSingle();

    if (mv) {
      const todaySales = Number(mv.today_revenue || 0);
      const todayOrders = Number(mv.total_orders || 0);
      const activeOrders = Number(mv.pending_orders || 0);

      // Last 10 orders still needs live query (not in MV)
      const { data: lastOrdersRaw } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, total_amount, status, created_at')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10);

      return NextResponse.json({
        todaySales,
        todayOrders,
        activeOrders,
        lastOrders: (lastOrdersRaw || []).map((o: any) => ({
          id: o.id, orderNumber: o.order_number, customerName: o.customer_name,
          totalAmount: o.total_amount, status: o.status, createdAt: o.created_at,
        })),
      });
    }

    // Fallback: live aggregation
    const { data: periodOrders } = await supabase
      .from('orders')
      .select('total_amount, status')
      .gte('created_at', start)
      .lte('created_at', end)
      .eq('is_deleted', false);

    const todaySales = (periodOrders || [])
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0);
    const todayOrders = (periodOrders || []).length;

    const { count: activeOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed', 'preparing', 'on_the_way'])
      .eq('is_deleted', false);

    const { data: lastOrdersRaw } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total_amount, status, created_at')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      todaySales,
      todayOrders,
      activeOrders: activeOrders || 0,
      lastOrders: (lastOrdersRaw || []).map((o: any) => ({
        id: o.id, orderNumber: o.order_number, customerName: o.customer_name,
        totalAmount: o.total_amount, status: o.status, createdAt: o.created_at,
      })),
    });
  } catch (err) {
    console.error('Dashboard report error:', err);
    return NextResponse.json({ todaySales: 0, todayOrders: 0, activeOrders: 0, lastOrders: [] });
  }
}
