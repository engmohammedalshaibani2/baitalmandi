import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export interface DeliveryAnalyticsData {
  totalOrders: number;
  ordersWithDelivery: number;
  totalDeliveryFee: number;
  avgDeliveryFee: number;
  avgDistanceKm: number;
  totalBaseFee: number;
  totalExtraFee: number;
  totalWeatherFee: number;
  totalPeakFee: number;
  ordersWithWeatherFee: number;
  ordersWithPeakFee: number;
  avgPeakPercentage: number;
  feeByDay: { day: string; orders: number; totalFee: number; avgFee: number }[];
  feeByDistanceRange: { range: string; orders: number; totalFee: number }[];
}

const DAY_NAMES: Record<string, string> = {
  '0': 'الأحد', '1': 'الإثنين', '2': 'الثلاثاء', '3': 'الأربعاء',
  '4': 'الخميس', '5': 'الجمعة', '6': 'السبت',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('startDate') || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const end = searchParams.get('endDate') || new Date(new Date().setHours(23, 59, 59, 999)).toISOString();

  try {
    const supabase = await createClient();

    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id, delivery_fee, delivery_distance_km, status,
        base_delivery_fee_amount, extra_distance_km, extra_fee_amount,
        weather_fee_amount, peak_fee_amount, peak_percentage_used,
        created_at
      `)
      .gte('created_at', start)
      .lte('created_at', end)
      .eq('is_deleted', false)
      .not('delivery_fee', 'is', null);

    const allOrders = orders || [];
    const deliveredOrders = allOrders.filter(o => o.status !== 'cancelled');
    const totalOrders = deliveredOrders.length;

    if (totalOrders === 0) {
      return NextResponse.json({
        totalOrders: 0,
        ordersWithDelivery: 0,
        totalDeliveryFee: 0,
        avgDeliveryFee: 0,
        avgDistanceKm: 0,
        totalBaseFee: 0,
        totalExtraFee: 0,
        totalWeatherFee: 0,
        totalPeakFee: 0,
        ordersWithWeatherFee: 0,
        ordersWithPeakFee: 0,
        avgPeakPercentage: 0,
        feeByDay: [],
        feeByDistanceRange: [],
      } satisfies DeliveryAnalyticsData);
    }

    const totalDeliveryFee = deliveredOrders.reduce((s, o) => s + parseFloat(o.delivery_fee || '0'), 0);
    const totalBaseFee = deliveredOrders.reduce((s, o) => s + parseFloat(o.base_delivery_fee_amount || '0'), 0);
    const totalExtraFee = deliveredOrders.reduce((s, o) => s + parseFloat(o.extra_fee_amount || '0'), 0);
    const totalWeatherFee = deliveredOrders.reduce((s, o) => s + parseFloat(o.weather_fee_amount || '0'), 0);
    const totalPeakFee = deliveredOrders.reduce((s, o) => s + parseFloat(o.peak_fee_amount || '0'), 0);

    const ordersWithWeatherFee = deliveredOrders.filter(o => parseFloat(o.weather_fee_amount || '0') > 0).length;
    const ordersWithPeakFee = deliveredOrders.filter(o => parseFloat(o.peak_fee_amount || '0') > 0).length;

    const peakPercentages = deliveredOrders
      .filter(o => parseFloat(o.peak_percentage_used || '0') > 0)
      .map(o => parseFloat(o.peak_percentage_used || '0'));
    const avgPeakPercentage = peakPercentages.length > 0
      ? peakPercentages.reduce((s, v) => s + v, 0) / peakPercentages.length
      : 0;

    const totalDistanceKm = deliveredOrders.reduce((s, o) => s + parseFloat(o.delivery_distance_km || '0'), 0);

    // Fee by day of week
    const dayMap: Record<string, { orders: number; totalFee: number }> = {};
    deliveredOrders.forEach(o => {
      const d = new Date(o.created_at).getDay().toString();
      const dayName = DAY_NAMES[d] || d;
      if (!dayMap[dayName]) dayMap[dayName] = { orders: 0, totalFee: 0 };
      dayMap[dayName].orders++;
      dayMap[dayName].totalFee += parseFloat(o.delivery_fee || '0');
    });
    const feeByDay = Object.entries(dayMap).map(([day, info]) => ({
      day,
      orders: info.orders,
      totalFee: info.totalFee,
      avgFee: Math.round(info.totalFee / info.orders),
    }));

    // Fee by distance range
    const ranges = [
      { label: '0-1 كم', min: 0, max: 1 },
      { label: '1-2 كم', min: 1, max: 2 },
      { label: '2-3 كم', min: 2, max: 3 },
      { label: '3-5 كم', min: 3, max: 5 },
      { label: '5-7 كم', min: 5, max: 7 },
      { label: '7-10 كم', min: 7, max: 10 },
      { label: 'أكثر من 10 كم', min: 10, max: Infinity },
    ];
    const feeByDistanceRange = ranges.map(r => {
      const ordersInRange = deliveredOrders.filter(o => {
        const d = parseFloat(o.delivery_distance_km || '0');
        return d >= r.min && d < r.max;
      });
      return {
        range: r.label,
        orders: ordersInRange.length,
        totalFee: ordersInRange.reduce((s, o) => s + parseFloat(o.delivery_fee || '0'), 0),
      };
    }).filter(r => r.orders > 0);

    const result: DeliveryAnalyticsData = {
      totalOrders,
      ordersWithDelivery: totalOrders,
      totalDeliveryFee,
      avgDeliveryFee: Math.round(totalDeliveryFee / totalOrders),
      avgDistanceKm: Math.round((totalDistanceKm / totalOrders) * 100) / 100,
      totalBaseFee,
      totalExtraFee,
      totalWeatherFee,
      totalPeakFee,
      ordersWithWeatherFee,
      ordersWithPeakFee,
      avgPeakPercentage: Math.round(avgPeakPercentage * 100) / 100,
      feeByDay,
      feeByDistanceRange,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('Delivery analytics error:', err);
    return NextResponse.json({ error: 'Failed to load delivery analytics' }, { status: 500 });
  }
}
