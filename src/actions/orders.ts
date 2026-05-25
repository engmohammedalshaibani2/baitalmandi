'use server';

import { createClient } from '@/utils/supabase/server';

// Generate order number BAM-YYYYMMDD-XXXX
async function generateOrderNumber(): Promise<string> {
  const supabase = await createClient();
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const sequenceDate = today.toISOString().slice(0, 10);

  // Upsert the sequence for today
  const { data: seq, error } = await supabase
    .from('order_sequences')
    .upsert(
      { sequence_date: sequenceDate, last_number: 1 },
      { onConflict: 'sequence_date' }
    )
    .select()
    .single();

  if (error) {
    // Fallback: use timestamp
    return `BAM-${dateStr}-${Date.now().toString().slice(-4)}`;
  }

  // Increment
  const nextNum = (seq.last_number || 0) + 1;
  await supabase
    .from('order_sequences')
    .update({ last_number: nextNum })
    .eq('id', seq.id);

  return `BAM-${dateStr}-${String(nextNum).padStart(4, '0')}`;
}

export interface OrderItemInput {
  category_name: string;
  item_name: string;
  size_label: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CreateOrderInput {
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  items: OrderItemInput[];
  subtotal: number;
  delivery_fee?: number;
  tax_amount?: number;
  total_amount: number;
  order_method: 'whatsapp' | 'website';
}

export async function createOrder(input: CreateOrderInput) {
  const supabase = await createClient();
  const orderNumber = await generateOrderNumber();

  // Insert Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      delivery_address: input.delivery_address || null,
      subtotal: String(input.subtotal),
      delivery_fee: String(input.delivery_fee || 0),
      tax_amount: String(input.tax_amount || 0),
      total_amount: String(input.total_amount),
      order_method: input.order_method,
      status: 'pending',
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Insert Order Items
  const orderItemsData = input.items.map(item => ({
    order_id: order.id,
    category_name: item.category_name,
    item_name: item.item_name,
    size_label: item.size_label,
    quantity: item.quantity,
    unit_price: String(item.unit_price),
    total_price: String(item.total_price),
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsData);

  if (itemsError) throw itemsError;

  // Insert initial status history
  await supabase.from('order_status_history').insert({
    order_id: order.id,
    old_status: null,
    new_status: 'pending',
  });

  return order;
}

export async function getOrders(filters?: { status?: string; is_archived?: boolean }) {
  const supabase = await createClient();
  let query = supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.is_archived !== undefined) {
    query = query.eq('is_archived', filters.is_archived);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  adminId?: string
) {
  const supabase = await createClient();

  // Get current status
  const { data: order } = await supabase
    .from('orders')
    .select('status, version')
    .eq('id', orderId)
    .single();

  if (!order) throw new Error('Order not found');

  // Update order with optimistic locking
  const { data, error } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      version: order.version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('version', order.version)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Concurrent update detected');

  // Log status change
  await supabase.from('order_status_history').insert({
    order_id: orderId,
    old_status: order.status,
    new_status: newStatus,
    changed_by_admin_id: adminId || null,
  });

  return data;
}
