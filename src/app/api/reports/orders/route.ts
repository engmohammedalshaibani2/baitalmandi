import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('startDate') || new Date(new Date().setHours(0,0,0,0)).toISOString();
  const end = searchParams.get('endDate') || new Date(new Date().setHours(23,59,59,999)).toISOString();
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const status = searchParams.get('status') || 'all';
  const payment = searchParams.get('payment') || 'all';
  const search = searchParams.get('search') || '';

  try {
    const supabase = await createClient();

    let query = supabase
      .from('orders')
      .select(`*, items:order_items(*)`, { count: 'exact' })
      .gte('created_at', start)
      .lte('created_at', end)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status !== 'all') query = query.eq('status', status);
    if (payment !== 'all') query = query.eq('payment_method', payment);
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,order_number.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const mapped = (data || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      createdAt: o.created_at,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      deliveryAddress: o.delivery_address,
      subtotal: o.subtotal,
      deliveryFee: o.delivery_fee,
      taxAmount: o.tax_amount,
      totalAmount: o.total_amount,
      notes: o.notes,
      orderMethod: o.order_method,
      paymentMethod: o.payment_method,
      status: o.status,
      items: (o.items || []).map((i: any) => ({
        id: i.id,
        itemName: i.item_name,
        categoryName: i.category_name,
        sizeLabel: i.size_label,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        totalPrice: i.total_price,
      })),
    }));

    return NextResponse.json({
      data: mapped,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error('Orders report error:', err);
    return NextResponse.json({ data: [], total: 0, page: 1, limit, totalPages: 0 });
  }
}
