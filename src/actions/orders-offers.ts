'use server';

import { createClient } from '@/utils/supabase/server';

export interface OrderOfferSnapshot {
  id: string;
  orderId: string;
  offerId: string | null;
  offerName: string;
  offerType: string;
  originalPrice: number;
  discountAmount: number;
  discountPercent: number;
  finalPrice: number;
  quantity: number;
  items: OrderOfferItemSnapshot[];
}

interface OrderOfferItemSnapshot {
  id: string;
  orderOfferId: string;
  itemName: string;
  sizeLabel: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export async function getOrderOffers(orderId: string): Promise<OrderOfferSnapshot[]> {
  if (!orderId) {
    console.warn('[GET_ORDER_OFFERS] Invalid orderId:', orderId);
    return [];
  }

  const supabase = await createClient();

  const { data: offers } = await supabase
    .from('order_offers')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (!offers || offers.length === 0) return [];

  const offerIds = offers.map(o => o.id);
  const { data: items } = await supabase
    .from('order_offer_items')
    .select('*')
    .in('order_offer_id', offerIds)
    .order('created_at', { ascending: true });

  const itemsByOfferId: Record<string, OrderOfferItemSnapshot[]> = {};
  for (const item of items || []) {
    if (!itemsByOfferId[item.order_offer_id]) itemsByOfferId[item.order_offer_id] = [];
    itemsByOfferId[item.order_offer_id].push({
      id: item.id,
      orderOfferId: item.order_offer_id,
      itemName: item.item_name,
      sizeLabel: item.size_label,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.total_price),
    });
  }

  return offers.map(o => ({
    id: o.id,
    orderId: o.order_id,
    offerId: o.offer_id,
    offerName: o.offer_name,
    offerType: o.offer_type,
    originalPrice: Number(o.original_price),
    discountAmount: Number(o.discount_amount),
    discountPercent: Number(o.discount_percent),
    finalPrice: Number(o.final_price),
    quantity: Number(o.quantity) || 1,
    items: itemsByOfferId[o.id] || [],
  }));
}
