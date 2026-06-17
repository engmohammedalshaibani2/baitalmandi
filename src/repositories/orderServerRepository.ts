import { createClient } from '@/utils/supabase/server';
import type { OrderListParams, OrderListResult } from './orderRepository';

/** Server-side paginated list. */
export async function getOrdersServer(params: OrderListParams): Promise<OrderListResult> {
  const supabase = await createClient();
  let query = supabase
    .from('orders')
    .select('*, items:order_items(*)', { count: 'exact' })
    .eq('is_deleted', false)
    .eq('is_archived', false);

  if (params.status && params.status !== 'all') query = query.eq('status', params.status);
  if (params.paymentMethod && params.paymentMethod !== 'all') query = query.eq('payment_method', params.paymentMethod);
  if (params.startDate) query = query.gte('created_at', params.startDate);
  if (params.endDate) query = query.lte('created_at', params.endDate);
  if (params.search && params.search.trim()) {
    const s = params.search.trim();
    query = query.or(`customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%,order_number.ilike.%${s}%`);
  }

  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return { data: data || [], total: count || 0, page: params.page, limit: params.limit, totalPages: Math.ceil((count || 0) / params.limit) };
}

/** Get single order by id (server-side). */
export async function getOrderById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Get order by tracking token. */
export async function getOrderByToken(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('tracking_token', token)
    .eq('is_deleted', false)
    .maybeSingle();
  if (error) return null;
  return data;
}

/** Customer orders by phone. */
export async function getCustomerOrders(phone: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('customer_phone', phone)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

/** Update order status with optimistic concurrency. */
export async function updateOrderStatus(orderId: string, newStatus: string, currentVersion: number, adminId: string) {
  const supabase = await createClient();
  const { data: order } = await supabase.from('orders').select('status, version').eq('id', orderId).single();
  if (!order) throw new Error('الطلب غير موجود');
  const oldStatus = order.status;

  const { data: updated, error } = await supabase
    .from('orders')
    .update({ status: newStatus, version: currentVersion + 1, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('version', currentVersion)
    .select()
    .single();

  if (error) throw new Error('حدث خطأ أثناء التحديث');
  if (!updated) throw new Error('تم تعديل الطلب من شخص آخر، يرجى إعادة المحاولة');

  await supabase.from('order_status_history').insert({
    order_id: orderId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by_admin_id: adminId,
  });

  return { success: true, oldStatus, newStatus };
}
