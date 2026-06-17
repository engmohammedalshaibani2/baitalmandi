import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('startDate') || new Date(new Date().setHours(0,0,0,0)).toISOString();
  const end = searchParams.get('endDate') || new Date(new Date().setHours(23,59,59,999)).toISOString();

  try {
    const supabase = await createClient();

    // Try materialized view first
    let mvProducts: any[] | null = null;
    try { const { data } = await supabase.from('mv_product_metrics').select('*').limit(200); mvProducts = data; } catch {}

    if (mvProducts && mvProducts.length > 0) {
      const sorted = mvProducts.sort((a: any, b: any) => Number(b.total_quantity_sold) - Number(a.total_quantity_sold));
      const top10Qty = sorted.slice(0, 10).map((i: any) => ({ name: i.item_name, quantity: Number(i.total_quantity_sold) }));
      const top10Rev = [...sorted].sort((a: any, b: any) => Number(b.total_revenue) - Number(a.total_revenue)).slice(0, 10).map((i: any) => ({ name: i.item_name, revenue: Number(i.total_revenue) }));
      const bottom10Qty = sorted.slice(-10).reverse().map((i: any) => ({ name: i.item_name, quantity: Number(i.total_quantity_sold) }));

      const catMap = new Map<string, any>();
      for (const i of mvProducts) {
        const cat = i.category_name || 'عام';
        if (!catMap.has(cat)) catMap.set(cat, { name: cat, ordersCount: 0, quantity: 0, revenue: 0 });
        const c = catMap.get(cat)!;
        c.quantity += Number(i.total_quantity_sold || 0);
        c.revenue += Number(i.total_revenue || 0);
        c.ordersCount += Number(i.times_ordered || 0);
      }

      const { data: allMenuItems } = await supabase.from('items').select('name_ar').eq('is_active', true);
      const orderedNames = new Set(mvProducts.map((i: any) => i.item_name));
      const unsold = (allMenuItems || []).filter(i => !orderedNames.has(i.name_ar)).map(i => ({ name: i.name_ar }));

      return NextResponse.json({
        top10Qty, top10Rev, bottom10Qty, unsold,
        categoriesSales: Array.from(catMap.values()),
      });
    }

    // Fallback: live aggregation
    const { data: items } = await supabase
      .from('order_items')
      .select('item_name, category_name, quantity, total_price, order_id, orders!inner(created_at, is_deleted)')
      .gte('orders.created_at', start)
      .lte('orders.created_at', end)
      .eq('orders.is_deleted', false);

    const validItems = items || [];
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    const catMap = new Map<string, { name: string; ordersCount: Set<string>; quantity: number; revenue: number }>();

    for (const i of validItems) {
      const name = i.item_name;
      if (!itemMap.has(name)) itemMap.set(name, { name, quantity: 0, revenue: 0 });
      const entry = itemMap.get(name)!;
      entry.quantity += i.quantity;
      entry.revenue += parseFloat(i.total_price || '0');

      const cat = i.category_name || 'عام';
      if (!catMap.has(cat)) catMap.set(cat, { name: cat, ordersCount: new Set(), quantity: 0, revenue: 0 });
      const catEntry = catMap.get(cat)!;
      catEntry.ordersCount.add(i.order_id);
      catEntry.quantity += i.quantity;
      catEntry.revenue += parseFloat(i.total_price || '0');
    }

    const sorted = Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);
    const top10Qty = sorted.slice(0, 10).map(i => ({ name: i.name, quantity: i.quantity }));
    const top10Rev = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10).map(i => ({ name: i.name, revenue: i.revenue }));
    const bottom10Qty = sorted.slice(-10).reverse().map(i => ({ name: i.name, quantity: i.quantity }));

    const { data: allMenuItems } = await supabase.from('items').select('name_ar').eq('is_active', true);
    const orderedNames = new Set(validItems.map(i => i.item_name));
    const unsold = (allMenuItems || []).filter(i => !orderedNames.has(i.name_ar)).map(i => ({ name: i.name_ar }));

    const categoriesSales = Array.from(catMap.values()).map(c => ({
      name: c.name, ordersCount: c.ordersCount.size, quantity: c.quantity, revenue: c.revenue,
    }));

    return NextResponse.json({ top10Qty, top10Rev, bottom10Qty, unsold, categoriesSales });
  } catch (err) {
    console.error('Products report error:', err);
    return NextResponse.json({ top10Qty: [], top10Rev: [], bottom10Qty: [], unsold: [], categoriesSales: [] });
  }
}
