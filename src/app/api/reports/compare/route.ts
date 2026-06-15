import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currStart = searchParams.get('currStart') || new Date(new Date().setHours(0,0,0,0)).toISOString();
  const currEnd = searchParams.get('currEnd') || new Date(new Date().setHours(23,59,59,999)).toISOString();
  const prevStart = searchParams.get('prevStart') || '';
  const prevEnd = searchParams.get('prevEnd') || '';

  try {
    const supabase = await createClient();

    async function getSummary(start: string, end: string) {
      if (!start || !end) return { sales: 0, count: 0, avgOrder: 0 };
      const { data } = await supabase
        .from('orders')
        .select('total_amount, payment_method, created_at, status')
        .gte('created_at', start)
        .lte('created_at', end)
        .eq('is_deleted', false)
        .neq('status', 'cancelled');

      const orders = data || [];
      const count = orders.length;
      const sales = orders.reduce((s, o) => s + parseFloat(o.total_amount || '0'), 0);
      return { sales, count, avgOrder: count > 0 ? sales / count : 0 };
    }

    const currentSummary = await getSummary(currStart, currEnd);
    const previousSummary = prevStart ? await getSummary(prevStart, prevEnd) : { sales: 0, count: 0, avgOrder: 0 };

    const salesGrowth = previousSummary.sales > 0 ? ((currentSummary.sales - previousSummary.sales) / previousSummary.sales) * 100 : 0;
    const ordersGrowth = previousSummary.count > 0 ? ((currentSummary.count - previousSummary.count) / previousSummary.count) * 100 : 0;
    const avgOrderGrowth = previousSummary.avgOrder > 0 ? ((currentSummary.avgOrder - previousSummary.avgOrder) / previousSummary.avgOrder) * 100 : 0;

    // Payment methods
    const { data: currOrders } = await supabase
      .from('orders')
      .select('payment_method, total_amount')
      .gte('created_at', currStart)
      .lte('created_at', currEnd)
      .eq('is_deleted', false)
      .neq('status', 'cancelled');

    const payMap = new Map<string, number>();
    for (const o of currOrders || []) {
      const method = o.payment_method || 'cash';
      payMap.set(method, (payMap.get(method) || 0) + parseFloat(o.total_amount || '0'));
    }
    const payments = Array.from(payMap.entries()).map(([method, sales]) => ({ method, sales }));

    // Hourly distribution
    const { data: hourlyData } = await supabase
      .from('orders')
      .select('created_at')
      .gte('created_at', currStart)
      .lte('created_at', currEnd)
      .eq('is_deleted', false)
      .neq('status', 'cancelled');

    const hourMap = new Map<string, number>();
    for (const o of hourlyData || []) {
      const hour = new Date(o.created_at).getHours().toString();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    }
    const hourly = Array.from(hourMap.entries()).map(([hour, count]) => ({ hour, count }));

    // Daily distribution (day of week)
    const dayMap = new Map<number, number>();
    for (const o of hourlyData || []) {
      const day = new Date(o.created_at).getDay();
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    }
    const daily = Array.from(dayMap.entries()).map(([day, count]) => ({ day, count }));

    return NextResponse.json({
      currentSummary,
      previousSummary,
      salesGrowth,
      ordersGrowth,
      avgOrderGrowth,
      payments,
      hourly,
      daily,
    });
  } catch (err) {
    console.error('Compare report error:', err);
    return NextResponse.json({
      currentSummary: { sales: 0, count: 0, avgOrder: 0 },
      previousSummary: { sales: 0, count: 0, avgOrder: 0 },
      salesGrowth: 0, ordersGrowth: 0, avgOrderGrowth: 0,
      payments: [], hourly: [], daily: [],
    });
  }
}
