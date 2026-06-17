import { supabase as browserClient } from '@/lib/supabase';
import {
  DashboardMetricsSchema, type DashboardMetrics,
  SalesMetricsSchema, type SalesMetrics,
  CustomerMetricsSchema, type CustomerMetrics,
  ProductMetricsSchema, type ProductMetrics,
} from '@/schemas/reports';
import { toNumber } from '@/lib/formatUtils';

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 120_000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) return entry.data as T;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > 20) {
    const oldest = cache.entries().next().value;
    if (oldest) cache.delete(oldest[0]);
  }
}

const DASHBOARD_DEFAULTS: DashboardMetrics = {
  totalOrders: 0, pendingOrders: 0, deliveredOrders: 0, todayRevenue: 0, totalRevenue: 0,
};

/** Fetch from mv_dashboard_metrics (cached). */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const key = 'dashboard';
  const cached = getCached<DashboardMetrics>(key);
  if (cached) return cached;
  const { data } = await browserClient.from('mv_dashboard_metrics').select('*').maybeSingle();
  if (data) {
    const parsed = DashboardMetricsSchema.parse({
      totalOrders: toNumber(data.total_orders),
      pendingOrders: toNumber(data.pending_orders),
      deliveredOrders: toNumber(data.delivered_orders),
      todayRevenue: toNumber(data.today_revenue),
      totalRevenue: toNumber(data.total_revenue),
    });
    setCache(key, parsed);
    return parsed;
  }
  return DASHBOARD_DEFAULTS;
}

/** Fetch from mv_sales_metrics with optional date range. */
export async function getSalesMetrics(startDate?: string, endDate?: string, limit = 50): Promise<SalesMetrics[]> {
  const key = `sales-${startDate || 'all'}-${endDate || 'all'}-${limit}`;
  const cached = getCached<SalesMetrics[]>(key);
  if (cached) return cached;
  let q = browserClient.from('mv_sales_metrics').select('*');
  if (startDate) q = q.gte('sale_date', startDate);
  if (endDate) q = q.lte('sale_date', endDate);
  const { data } = await q.order('sale_date', { ascending: false }).limit(limit);
  if (data) {
    const parsed = data.map(row => SalesMetricsSchema.parse({
      saleDate: row.sale_date || '',
      orderCount: toNumber(row.order_count),
      revenue: toNumber(row.revenue),
      deliveryFees: toNumber(row.delivery_fees),
      cancelledCount: toNumber(row.cancelled_count),
      cashOrders: toNumber(row.cash_orders),
      transferOrders: toNumber(row.transfer_orders),
      walletOrders: toNumber(row.wallet_orders),
    }));
    setCache(key, parsed);
    return parsed;
  }
  return [];
}

/** Fetch from mv_offer_metrics. */
export async function getOfferMetrics(limit = 50) {
  const key = `offers-${limit}`;
  const cached = getCached<any[]>(key);
  if (cached) return cached;
  const { data } = await browserClient.from('mv_offer_metrics').select('*').order('times_ordered', { ascending: false }).limit(limit);
  if (data) setCache(key, data);
  return data || [];
}

/** Fetch from mv_customer_metrics with optional search. */
export async function getCustomerMetrics(search?: string, limit = 50): Promise<CustomerMetrics[]> {
  const key = `customers-${search || 'all'}-${limit}`;
  const cached = getCached<CustomerMetrics[]>(key);
  if (cached) return cached;
  let q = browserClient.from('mv_customer_metrics').select('*');
  if (search) q = q.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
  const { data } = await q.order('total_spent', { ascending: false }).limit(limit);
  if (data) {
    const parsed = data.map(row => CustomerMetricsSchema.parse({
      customerName: row.customer_name || '',
      customerPhone: row.customer_phone || '',
      orderCount: toNumber(row.order_count),
      totalSpent: toNumber(row.total_spent),
      avgOrderValue: toNumber(row.avg_order_value),
      lastOrderDate: row.last_order_date || '',
      firstOrderDate: row.first_order_date || '',
    }));
    setCache(key, parsed);
    return parsed;
  }
  return [];
}

/** Fetch from mv_product_metrics with optional category filter. */
export async function getProductMetrics(categoryName?: string, limit = 50): Promise<any[]> {
  const key = `products-${categoryName || 'all'}-${limit}`;
  const cached = getCached<any[]>(key);
  if (cached) return cached;
  let q = browserClient.from('mv_product_metrics').select('*');
  if (categoryName) q = q.eq('category_name', categoryName);
  const { data } = await q.order('total_quantity_sold', { ascending: false }).limit(limit);
  if (data) setCache(key, data);
  return data || [];
}

/** Clear all report caches. */
export function clearReportCache() {
  cache.clear();
}
