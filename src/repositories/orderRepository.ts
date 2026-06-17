import { supabase as browserClient } from '@/lib/supabase';

export interface OrderListParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderListResult {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DEFAULTS = { page: 1, limit: 50 };

function buildListQuery(supabase: any, params: OrderListParams) {
  const { status, search, paymentMethod, startDate, endDate } = params;

  let query = supabase
    .from('orders')
    .select('*, items:order_items(*)', { count: 'exact' })
    .eq('is_deleted', false)
    .eq('is_archived', false);

  if (status && status !== 'all') query = query.eq('status', status);
  if (paymentMethod && paymentMethod !== 'all') query = query.eq('payment_method', paymentMethod);
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  if (search && search.trim()) {
    const s = search.trim();
    query = query.or(`customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%,order_number.ilike.%${s}%`);
  }

  return query;
}

/** Client-side paginated list. */
export async function getOrdersClient(params: OrderListParams): Promise<OrderListResult> {
  const query = buildListQuery(browserClient, params);
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return { data: data || [], total: count || 0, page: params.page, limit: params.limit, totalPages: Math.ceil((count || 0) / params.limit) };
}
