import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('startDate') || new Date(new Date().setHours(0,0,0,0)).toISOString();
  const end = searchParams.get('endDate') || new Date(new Date().setHours(23,59,59,999)).toISOString();

  try {
    const supabase = await createClient();

    const { data: orders } = await supabase
      .from('orders')
      .select('customer_name, customer_phone, total_amount, created_at')
      .gte('created_at', start)
      .lte('created_at', end)
      .eq('is_deleted', false)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    const customerMap = new Map<string, { name: string; phone: string; ordersCount: number; spend: number; lastOrder: string }>();

    for (const o of orders || []) {
      const phone = o.customer_phone;
      if (!customerMap.has(phone)) {
        customerMap.set(phone, { name: o.customer_name, phone, ordersCount: 0, spend: 0, lastOrder: o.created_at });
      }
      const c = customerMap.get(phone)!;
      c.ordersCount++;
      c.spend += parseFloat(o.total_amount || '0');
      if (new Date(o.created_at) > new Date(c.lastOrder)) c.lastOrder = o.created_at;
    }

    const result = Array.from(customerMap.values())
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 50)
      .map(c => ({
        name: c.name,
        phone: c.phone,
        ordersCount: c.ordersCount,
        spend: c.spend,
        avgOrder: c.ordersCount > 0 ? c.spend / c.ordersCount : 0,
        lastOrder: c.lastOrder,
      }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('Customers report error:', err);
    return NextResponse.json([]);
  }
}
