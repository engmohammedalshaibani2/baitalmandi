import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { OfferReportSchema } from '@/schemas/reports';
import { toNumber } from '@/lib/formatUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    // Try materialized view first
    const { data: mvRaw } = await supabase.from('mv_offer_metrics').select('*').limit(100);
    const mvOffers: any[] = mvRaw || [];

    if (mvOffers.length > 0) {
      const totalDiscountAmount = mvOffers.reduce((s, o) => s + toNumber(o.total_discount_given), 0);
      const totalOriginalPrice = mvOffers.reduce((s, o) => s + toNumber(o.gross_revenue), 0);
      const totalFinalPrice = mvOffers.reduce((s, o) => s + toNumber(o.net_revenue), 0);
      const offerOrderCount = mvOffers.reduce((s, o) => s + toNumber(o.total_units_sold), 0);

      const topOffers = mvOffers
        .sort((a: any, b: any) => toNumber(b.times_ordered) - toNumber(a.times_ordered))
        .slice(0, 10)
        .map((o: any) => ({
          name: o.offer_name || '',
          count: toNumber(o.times_ordered),
          revenue: toNumber(o.net_revenue),
          discounts: toNumber(o.total_discount_given),
        }));

      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .not('status', 'eq', 'cancelled');

      const { data: allOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .not('status', 'eq', 'cancelled');

      const totalRevenue = (allOrders || []).reduce((sum, o) => sum + toNumber(o.total_amount), 0);

      const result = OfferReportSchema.parse({
        totalDiscountAmount,
        totalOriginalPrice,
        totalFinalPrice,
        offerOrderCount,
        totalOrders: totalOrders || 0,
        totalRevenue,
        revenueBeforeDiscounts: totalOriginalPrice,
        revenueAfterDiscounts: totalFinalPrice,
        avgDiscountPerOrder: offerOrderCount > 0 ? totalDiscountAmount / offerOrderCount : 0,
        discountPercentage: totalRevenue > 0 ? (totalDiscountAmount / totalRevenue) * 100 : 0,
        freeItemCount: 0,
        topOffers,
        offerPercentage: totalOrders ? ((offerOrderCount / totalOrders) * 100).toFixed(1) : '0',
      });

      return NextResponse.json(result);
    }

    // Fallback: live aggregation
    const { data: orderOffers } = await supabase
      .from('order_offers')
      .select('*, order:order_id!inner(created_at, status, total_amount)')
      .gte('order.created_at', startDate)
      .lte('order.created_at', endDate)
      .not('order.status', 'eq', 'cancelled');

    const totalDiscountAmount = (orderOffers || []).reduce((sum, o) => sum + toNumber(o.discount_amount) * (toNumber(o.quantity) || 1), 0);
    const totalOriginalPrice = (orderOffers || []).reduce((sum, o) => sum + toNumber(o.original_price) * (toNumber(o.quantity) || 1), 0);
    const totalFinalPrice = (orderOffers || []).reduce((sum, o) => sum + toNumber(o.final_price) * (toNumber(o.quantity) || 1), 0);
    const offerOrderCount = (orderOffers || []).reduce((sum, o) => sum + (toNumber(o.quantity) || 1), 0);

    const offerCountMap: Record<string, any> = {};
    for (const o of orderOffers || []) {
      const qty = toNumber(o.quantity) || 1;
      const name = o.offer_name || '';
      if (!offerCountMap[name]) {
        offerCountMap[name] = { name, count: 0, revenue: 0, discounts: 0 };
      }
      offerCountMap[name].count += qty;
      offerCountMap[name].revenue += toNumber(o.final_price) * qty;
      offerCountMap[name].discounts += toNumber(o.discount_amount) * qty;
    }
    const topOffers = Object.values(offerCountMap)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('status', 'eq', 'cancelled');

    const { data: freeItems } = await supabase
      .from('order_offer_items')
      .select('*, order_offer:order_offer_id!inner(order_id!inner(created_at, status))')
      .gte('order_offer.order.created_at', startDate)
      .lte('order_offer.order.created_at', endDate)
      .not('order_offer.order.status', 'eq', 'cancelled');

    const freeItemCount = (freeItems || []).filter(i => toNumber(i.total_price) === 0).length;

    const { data: allOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('status', 'eq', 'cancelled');
    const totalRevenue = (allOrders || []).reduce((sum, o) => sum + toNumber(o.total_amount), 0);

    const result = OfferReportSchema.parse({
      totalDiscountAmount,
      totalOriginalPrice,
      totalFinalPrice,
      offerOrderCount,
      totalOrders: totalOrders || 0,
      totalRevenue,
      revenueBeforeDiscounts: totalOriginalPrice,
      revenueAfterDiscounts: totalFinalPrice,
      avgDiscountPerOrder: offerOrderCount > 0 ? totalDiscountAmount / offerOrderCount : 0,
      discountPercentage: totalRevenue > 0 ? (totalDiscountAmount / totalRevenue) * 100 : 0,
      freeItemCount,
      topOffers,
      offerPercentage: totalOrders ? ((offerOrderCount / totalOrders) * 100).toFixed(1) : '0',
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Offers report error:', err);
    return NextResponse.json(OfferReportSchema.parse({
      totalDiscountAmount: 0,
      totalOriginalPrice: 0,
      totalFinalPrice: 0,
      offerOrderCount: 0,
      totalOrders: 0,
      totalRevenue: 0,
      revenueBeforeDiscounts: 0,
      revenueAfterDiscounts: 0,
      avgDiscountPerOrder: 0,
      discountPercentage: 0,
      freeItemCount: 0,
      topOffers: [],
      offerPercentage: '0',
    }));
  }
}
