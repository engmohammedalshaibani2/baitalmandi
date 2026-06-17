import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    // 1. Total discounts given within period
    const { data: orderOffers } = await supabase
      .from('order_offers')
      .select(`
        *,
        order:order_id!inner(created_at, status, total_amount)
      `)
      .gte('order.created_at', startDate)
      .lte('order.created_at', endDate)
      .not('order.status', 'eq', 'cancelled');

    const totalDiscountAmount = (orderOffers || []).reduce((sum, o) => sum + Number(o.discount_amount) * (Number(o.quantity) || 1), 0);
    const totalOriginalPrice = (orderOffers || []).reduce((sum, o) => sum + Number(o.original_price) * (Number(o.quantity) || 1), 0);
    const totalFinalPrice = (orderOffers || []).reduce((sum, o) => sum + Number(o.final_price) * (Number(o.quantity) || 1), 0);
    const offerOrderCount = (orderOffers || []).reduce((sum, o) => sum + (Number(o.quantity) || 1), 0);

    // 2. Top 10 best selling offers
    const offerCounts: Record<string, { name: string; count: number; revenue: number; discounts: number }> = {};
    for (const o of orderOffers || []) {
      const qty = Number(o.quantity) || 1;
      if (!offerCounts[o.offer_name]) {
        offerCounts[o.offer_name] = { name: o.offer_name, count: 0, revenue: 0, discounts: 0 };
      }
      offerCounts[o.offer_name].count += qty;
      offerCounts[o.offer_name].revenue += Number(o.final_price) * qty;
      offerCounts[o.offer_name].discounts += Number(o.discount_amount) * qty;
    }
    const topOffers = Object.values(offerCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 3. Total orders (for percentage calculation)
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('status', 'eq', 'cancelled');

    // 4. Free items count (from order_offer_items where item was free)
    const { data: freeItems } = await supabase
      .from('order_offer_items')
      .select(`
        *,
        order_offer:order_offer_id!inner(
          order_id!inner(created_at, status)
        )
      `)
      .gte('order_offer.order.created_at', startDate)
      .lte('order_offer.order.created_at', endDate)
      .not('order_offer.order.status', 'eq', 'cancelled');

    const freeItemCount = (freeItems || []).filter(i => Number(i.total_price) === 0).length;

    // 5. Total revenue (all orders)
    const { data: allOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('status', 'eq', 'cancelled');

    const totalRevenue = (allOrders || []).reduce((sum, o) => sum + Number(o.total_amount), 0);

    return NextResponse.json({
      totalDiscountAmount,
      totalOriginalPrice,
      totalFinalPrice,
      offerOrderCount,
      totalOrders: totalOrders || 0,
      totalRevenue,
      avgDiscountPerOrder: offerOrderCount > 0 ? Math.round(totalDiscountAmount / offerOrderCount) : 0,
      discountPercentage: totalRevenue > 0 ? Math.round((totalDiscountAmount / totalRevenue) * 100) : 0,
      revenueBeforeDiscounts: totalOriginalPrice,
      revenueAfterDiscounts: totalFinalPrice,
      freeItemCount,
      topOffers,
    });
  } catch (error) {
    console.error('[OFFERS_REPORT] Error:', error);
    return NextResponse.json({ error: 'فشل تحميل إحصائيات العروض' }, { status: 500 });
  }
}
