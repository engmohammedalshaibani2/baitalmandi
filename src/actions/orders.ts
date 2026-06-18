'use server';

import { createClient } from '@/utils/supabase/server';
import { calculateOfferPrice, type OfferPricingResult } from '@/lib/offer-pricing';
import { haversineDistance, MAX_DELIVERY_RADIUS_KM } from '@/lib/location-validation';
import { calculateRoute, estimateRoadDistance, estimateDuration } from '@/lib/delivery-routing';
import { calculateDeliveryFee, parseDeliverySettings } from '@/lib/delivery-pricing';
import { validateYemeniPhone, normalizeYemeniPhone } from '@/lib/validation';
import { db } from '@/db';
import {
  orders, orderItems, orderStatusHistory,
  orderOffers, orderOfferItems, auditLogs,
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { headers } from 'next/headers';

// ==========================================
// Rate Limiter — in-memory sliding window
// ==========================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 5;
  const record = rateLimitMap.get(identifier);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}

async function generateOrderNumber(): Promise<string> {
  const supabase = await createClient();
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const sequenceDate = today.toISOString().slice(0, 10);

  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const { error: upsertError } = await supabase
        .from('order_sequences')
        .upsert(
          { sequence_date: sequenceDate, last_number: 0 },
          { onConflict: 'sequence_date', ignoreDuplicates: true }
        );

      if (upsertError) { continue; }

      const { data: seq, error: readError } = await supabase
        .from('order_sequences')
        .select('last_number')
        .eq('sequence_date', sequenceDate)
        .maybeSingle();

      if (readError || seq === null) { continue; }

      const nextNum = (seq.last_number || 0) + 1;

      const { data: updated, error: updateError } = await supabase
        .from('order_sequences')
        .update({ last_number: nextNum })
        .eq('sequence_date', sequenceDate)
        .eq('last_number', seq.last_number)
        .select();

      if (updateError) { continue; }
      if (!updated || updated.length === 0) { continue; }

      const orderNumber = `BAM-${dateStr}-${String(nextNum).padStart(4, '0')}`;
      return orderNumber;
    } catch (err) {
      continue;
    }
  }

  const fallback = Date.now().toString(36).toUpperCase().slice(-4) +
                   Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BAM-${dateStr}-${fallback}`;
}

export interface OrderItemInput {
  item_id?: string | null;
  price_id?: string | null;
  category_name: string;
  item_name: string;
  size_label: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OfferInput {
  offer_id: string;
  quantity: number;
  bundle_items: OrderItemInput[];
}

export interface CreateOrderInput {
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  notes?: string;
  items: OrderItemInput[];
  offers?: OfferInput[];
  order_method: 'whatsapp' | 'website';
  payment_method?: 'cash' | 'transfer' | 'wallet';
  delivery_lat?: number;
  delivery_lng?: number;
  idempotency_key?: string;
}

/**
 * Fetch all delivery-related settings from site_settings table.
 */
async function fetchDeliverySettings(supabase: any): Promise<{
  settings: Record<string, string>;
  restLat: number;
  restLng: number;
}> {
  const { data: settingsData } = await supabase
    .from('site_settings')
    .select('setting_key, value')
    .in('setting_key', [
      'restaurant_lat', 'restaurant_lng',
      'delivery_enabled', 'max_delivery_distance_km',
      'road_factor',
      'base_delivery_fee', 'included_distance_km', 'extra_fee_per_km',
      'enable_weather_fee', 'weather_fee',
      'enable_peak_hours', 'peak_start_time', 'peak_end_time', 'peak_percentage', 'peak_days',
      'min_order_amount', 'currency',
    ]);

  const sMap: Record<string, string> = {};
  (settingsData || []).forEach((s: any) => {
    sMap[s.setting_key] = typeof s.value === 'string' ? s.value : String(s.value);
  });

  let restLat = parseFloat(sMap['restaurant_lat']);
  let restLng = parseFloat(sMap['restaurant_lng']);
  let foundInSettings = !!(restLat && restLng);

  if (!restLat || !restLng) {
    const { data: branch } = await supabase
      .from('branches')
      .select('latitude, longitude')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(1)
      .maybeSingle();
    if (branch) {
      restLat = parseFloat(String(branch.latitude));
      restLng = parseFloat(String(branch.longitude));
    }
  }

  if (!restLat || !restLng) {
    restLat = 15.360035270551275;
    restLng = 44.17484814594534;
  }

  if (!foundInSettings) {
    await supabase.from('site_settings').upsert([
      { setting_key: 'restaurant_lat', value: String(restLat) },
      { setting_key: 'restaurant_lng', value: String(restLng) },
    ], { onConflict: 'setting_key', ignoreDuplicates: false });
  }

  return { settings: sMap, restLat, restLng };
}

export async function createOrder(input: CreateOrderInput) {
  const supabase = await createClient();

  if (!input.items || input.items.length === 0) {
    throw new Error('لا يمكن إنشاء طلب بدون أصناف');
  }
  if (!input.customer_name?.trim()) {
    throw new Error('اسم العميل مطلوب');
  }
  if (!input.customer_phone?.trim()) {
    throw new Error('رقم هاتف العميل مطلوب');
  }
  const phoneValidation = validateYemeniPhone(input.customer_phone);
  if (!phoneValidation.valid) {
    throw new Error(phoneValidation.error);
  }
  if (!input.delivery_address?.trim() || input.delivery_address.trim().length < 10) {
    throw new Error('عنوان التوصيل مطلوب (10 أحرف على الأقل)');
  }

  const normalizedPhone = normalizeYemeniPhone(input.customer_phone);
  const phone = normalizedPhone || input.customer_phone.trim();

  // ==========================================
  // IDEMPOTENCY CHECK — BEFORE any DB writes
  // ==========================================
  if (input.idempotency_key) {
    const existing = await db.select().from(orders)
      .where(eq(orders.idempotencyKey, input.idempotency_key))
      .limit(1);
    if (existing.length > 0) {
      const o = existing[0];
      return { ...o, order_number: o.orderNumber, tracking_token: o.trackingToken };
    }
  }

  // ==========================================
  // RATE LIMITING — 5 requests/minute per IP+phone
  // ==========================================
  const headersList = await headers();
  const clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headersList.get('x-real-ip')
    || 'unknown';
  const limitKey = `${clientIp}:${input.customer_phone}`;
  if (!checkRateLimit(limitKey)) {
    throw new Error('طلبات كثيرة جداً. يرجى الانتظار دقيقة ثم المحاولة مرة أخرى.');
  }

  // ==========================================
  // AUTH CHECK — log authenticated user if present; guest orders still allowed
  // ==========================================
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    console.log('[CREATE_ORDER_AUTH]', JSON.stringify({
      userId: user.id,
      email: user.email,
      customerPhone: input.customer_phone,
    }));
  }

  let deliveryFeeNumeric = 0;
  let deliveryDistanceKm: number | null = null;
  let deliveryDurationMin: number | null = null;
  let deliveryLat: number | null = null;
  let deliveryLng: number | null = null;
  let weatherFeeApplied = 0;
  let peakFeeApplied = 0;
  let peakPercentageApplied = 0;
  let baseFeeAmount = 0;
  let extraDistanceKm = 0;
  let extraFeeAmount = 0;

  const { settings: settingsMap, restLat, restLng } = await fetchDeliverySettings(supabase);

  const minOrderAmount = parseFloat(settingsMap['min_order_amount']) || 0;
  const currency = settingsMap['currency'] || 'ريال';

  if (input.delivery_lat && input.delivery_lng) {
    deliveryLat = input.delivery_lat;
    deliveryLng = input.delivery_lng;

    if (settingsMap['delivery_enabled'] === 'false') {
      throw new Error('خدمة التوصيل غير متاحة حالياً');
    }

    const roadFactor = parseFloat(settingsMap['road_factor']) || 1.5;

    const straightLineKm = haversineDistance(restLat, restLng, deliveryLat, deliveryLng);

    const route = await calculateRoute(restLat, restLng, deliveryLat, deliveryLng, straightLineKm, roadFactor);

    if (route.status === 'ok') {
      deliveryDistanceKm = route.distanceKm;
      deliveryDurationMin = route.durationMin;
    } else {
      deliveryDistanceKm = estimateRoadDistance(straightLineKm, roadFactor);
      deliveryDurationMin = estimateDuration(deliveryDistanceKm);
    }

    const maxDist = parseFloat(settingsMap['max_delivery_distance_km']) || MAX_DELIVERY_RADIUS_KM;
    const calculatedDistance = Math.round(deliveryDistanceKm! * 100) / 100;

    console.log('[DELIVERY_DISTANCE_VALIDATION]', JSON.stringify({
      restaurantCoordinates: { lat: restLat, lng: restLng },
      customerCoordinates: { lat: deliveryLat, lng: deliveryLng },
      calculatedDistance,
      maxDeliveryDistance: maxDist,
      validationResult: calculatedDistance <= maxDist ? 'PASS' : 'FAIL',
    }));

    if (calculatedDistance > maxDist) {
      throw new Error(`خدمة التوصيل متاحة حتى ${maxDist} كم فقط. المسافة الحالية: ${calculatedDistance} كم.`);
    }

    // Calculate delivery fee using new pricing system
    const pricingSettings = parseDeliverySettings(settingsMap);
    const feeResult = calculateDeliveryFee({
      distanceKm: calculatedDistance,
      settings: pricingSettings,
    });

    if (feeResult.exceedsMaxDistance) {
      throw new Error(`خدمة التوصيل متاحة حتى ${pricingSettings.maxDeliveryDistanceKm} كم فقط. المسافة الحالية: ${calculatedDistance} كم.`);
    }

    deliveryDistanceKm = calculatedDistance;

    deliveryFeeNumeric = feeResult.fee;
    deliveryDistanceKm = feeResult.distanceKm;
    weatherFeeApplied = feeResult.weatherFeeApplied;
    peakFeeApplied = feeResult.peakFeeApplied;
    peakPercentageApplied = feeResult.peakPercentageApplied;
    baseFeeAmount = feeResult.baseFee;
    extraDistanceKm = Math.max(0, deliveryDistanceKm - pricingSettings.includedDistanceKm);
    extraFeeAmount = deliveryFeeNumeric - baseFeeAmount - weatherFeeApplied - peakFeeApplied;

    console.log('[DELIVERY_DEBUG]', JSON.stringify({
      restaurantLat: restLat,
      restaurantLng: restLng,
      customerLat: deliveryLat,
      customerLng: deliveryLng,
      haversineKm: Math.round(straightLineKm * 100) / 100,
      osrmDistanceKm: deliveryDistanceKm,
      durationMin: deliveryDurationMin,
      fee: deliveryFeeNumeric,
      weatherFeeApplied,
      peakFeeApplied,
    }));
  }

  const orderNumber = await generateOrderNumber();

  const { data: existingToken } = await supabase
    .from('customer_tokens')
    .select('tracking_token')
    .eq('phone', phone)
    .maybeSingle();
  const trackingToken = existingToken?.tracking_token || crypto.randomUUID();

  if (!existingToken) {
    const { error: tokenError } = await supabase
      .from('customer_tokens')
      .insert({ phone, tracking_token: trackingToken });
    if (tokenError && !tokenError.message?.includes('duplicate') && !tokenError.message?.includes('unique')) {
      console.error('[CREATE_ORDER] Failed to save customer token:', tokenError);
    }
  }

  // ==========================================
  // SERVER-SIDE PRICE VALIDATION
  // Look up current prices from DB for regular items
  // ==========================================
  const serverValidatedItems: Map<number, number> = new Map();
  const regularItemPriceIds = input.items
    .filter(item => item.category_name !== 'عروض')
    .map((_, idx) => idx);

  if (regularItemPriceIds.length > 0) {
    const priceIdToItemIdx = new Map<string, number>();
    const priceIds: string[] = [];
    for (const [idx, item] of input.items.entries()) {
      if (item.category_name !== 'عروض') {
        if (!item.price_id) {
          throw new Error(`بيانات السعر غير مكتملة للصنف "${item.item_name}"`);
        }
        priceIdToItemIdx.set(item.price_id, idx);
        priceIds.push(item.price_id);
      }
    }

    if (priceIds.length > 0) {
      const { data: dbPrices } = await supabase
        .from('item_prices')
        .select('id, original_price, sale_price, item_id')
        .in('id', priceIds);

      const priceMap = new Map((dbPrices || []).map((p: any) => [p.id, p]));

      for (const priceId of priceIds) {
        const dbPrice = priceMap.get(priceId);
        if (!dbPrice) {
          throw new Error('السعر المحدد غير صالح، يرجى إعادة تحميل القائمة');
        }
        const idx = priceIdToItemIdx.get(priceId)!;
        const item = input.items[idx];
        const serverPrice = Number(dbPrice.sale_price ?? dbPrice.original_price);
        if (Math.abs(serverPrice - item.unit_price) > 0.01) {
          console.warn('[PRICE_MISMATCH]', JSON.stringify({
            itemName: item.item_name,
            clientPrice: item.unit_price,
            serverPrice,
            corrected: true,
          }));
        }
        serverValidatedItems.set(idx, serverPrice);
      }
    }
  }

  // ==========================================
  // OFFER PROCESSING — fully validated server-side
  // ==========================================
  const processedOffers: Array<{
    offerInput: OfferInput;
    offer: any;
    pricing: OfferPricingResult;
  }> = [];

  if (input.offers && input.offers.length > 0) {
    for (const offerInput of input.offers) {
      const { data: offer } = await supabase
        .from('offers')
        .select('*, offer_items(*, menu_item:menu_item_id(*, item_prices(*)))')
        .eq('id', offerInput.offer_id)
        .maybeSingle();

      if (!offer) {
        throw new Error(`العرض ${offerInput.offer_id} غير موجود`);
      }

      const now = new Date().toISOString();
      const startDate = new Date(offer.start_date).toISOString();
      const endDate = new Date(offer.end_date).toISOString();
      if (offer.status !== 'active' || !offer.is_active || now < startDate || now > endDate) {
        throw new Error(`العرض ${offer.title_ar || ''} غير متاح حالياً`);
      }

      const bundleItems = (offer.offer_items || []).map((oi: any) => {
        const prices = oi.menu_item?.item_prices || [];
        const unitPrice = oi.unit_price ? Number(oi.unit_price) : 0;
        return {
          itemId: oi.menu_item_id,
          itemName: oi.menu_item?.name_ar || '',
          quantity: oi.quantity,
          unitPrice,
          priceId: oi.price_id || undefined,
          variantName: oi.variant_name || undefined,
          sizeLabel: oi.variant_name || prices[0]?.size_label_ar || 'عادي',
          categoryName: 'عروض',
        };
      });

      if (bundleItems.length === 0) {
        throw new Error(`العرض ${offer.title_ar || ''} لا يحتوي على منتجات`);
      }

      const pricing = calculateOfferPrice({
        offerType: (offer.offer_type as any) || 'percentage_discount',
        salePrice: offer.sale_price ? Number(offer.sale_price) : undefined,
        discountPercent: offer.discount_percent || undefined,
        discountAmount: offer.discount_amount ? Number(offer.discount_amount) : undefined,
        items: bundleItems,
      });

      processedOffers.push({ offerInput, offer, pricing });
    }
  }

  // ==========================================
  // SUBTOTAL CALCULATION — entirely server-side
  // ==========================================
  const regularItemsTotal = input.items.reduce((sum, item, idx) => {
    if (item.category_name === 'عروض') return sum;
    const serverPrice = serverValidatedItems.get(idx);
    return sum + (serverPrice ?? item.unit_price) * item.quantity;
  }, 0);

  const totalOfferAmount = processedOffers.reduce(
    (acc, po) => acc + po.pricing.finalPrice * po.offerInput.quantity,
    0,
  );

  const validatedSubtotal = regularItemsTotal + totalOfferAmount;
  const validatedTotalAmount = validatedSubtotal + deliveryFeeNumeric;

  console.log('[SERVER_PRICE_CALC]', JSON.stringify({
    regularItemsTotal,
    totalOfferAmount,
    validatedSubtotal,
    deliveryFee: deliveryFeeNumeric,
    validatedTotalAmount,
  }));

  const finalPayableAmount = validatedTotalAmount;
  const discountAmount = 0;

  console.log('[MIN_ORDER_CALCULATION]', JSON.stringify({
    productsTotal: validatedSubtotal,
    deliveryFee: deliveryFeeNumeric,
    discounts: discountAmount,
    finalTotal: finalPayableAmount,
    minOrderAmount,
    currency,
    validationResult: finalPayableAmount >= minOrderAmount ? 'PASS' : 'FAIL',
  }));

  if (minOrderAmount > 0 && finalPayableAmount < minOrderAmount) {
    console.log('[MIN_ORDER_VALIDATION]', JSON.stringify({
      orderTotal: finalPayableAmount,
      productsTotal: validatedSubtotal,
      deliveryFee: deliveryFeeNumeric,
      discountAmount,
      minOrderAmount,
      currency,
      result: 'REJECTED',
      customerName: input.customer_name,
      customerPhone: input.customer_phone,
      offerIds: processedOffers.map(po => po.offerInput.offer_id),
    }));
    throw new Error(`الحد الأدنى للطلب هو ${minOrderAmount} ${currency}. إجمالي الطلب: ${finalPayableAmount} ${currency}`);
  }

  let cleanNotes = input.notes || '';
  cleanNotes = cleanNotes.replace(/\[BUNDLE\].*?\[\/BUNDLE\]/g, '').replace(/\n{2,}/g, '\n').trim();
  const notesValue = cleanNotes || null;

  // ==========================================
  // TRANSACTION — All writes atomically
  // ==========================================
  const order = await db.transaction(async (tx) => {
    const [order] = await tx.insert(orders).values({
      orderNumber,
      trackingToken,
      offerId: null,
      customerName: input.customer_name.trim(),
      customerPhone: phone,
      deliveryAddress: input.delivery_address?.trim() || null,
      notes: notesValue,
      subtotal: String(validatedSubtotal),
      deliveryFee: String(deliveryFeeNumeric),
      taxAmount: '0',
      totalAmount: String(validatedTotalAmount),
      orderMethod: input.order_method,
      paymentMethod: input.payment_method || 'cash',
      status: 'pending',
      deliveryLatitude: deliveryLat ? String(deliveryLat) : null,
      deliveryLongitude: deliveryLng ? String(deliveryLng) : null,
      deliveryZone: null,
      deliveryDistanceKm: deliveryDistanceKm ? String(deliveryDistanceKm) : null,
      deliveryDurationMinutes: deliveryDurationMin,
      locationVerified: deliveryLat !== null,
      baseDeliveryFeeAmount: String(baseFeeAmount),
      extraDistanceKm: String(extraDistanceKm),
      extraFeeAmount: String(Math.max(0, extraFeeAmount)),
      weatherFeeAmount: String(weatherFeeApplied),
      peakFeeAmount: String(peakFeeApplied),
      peakPercentageUsed: String(peakPercentageApplied),
      idempotencyKey: input.idempotency_key || null,
    }).returning();

    const orderItemsData = input.items.map((item, idx) => {
      const serverPrice = serverValidatedItems.get(idx);
      const unitPrice = serverPrice ?? item.unit_price;
      return {
        orderId: order.id,
        categoryName: item.category_name,
        itemName: item.item_name,
        sizeLabel: item.size_label,
        quantity: item.quantity,
        unitPrice: String(unitPrice),
        totalPrice: String(unitPrice * item.quantity),
      };
    });
    await tx.insert(orderItems).values(orderItemsData);

    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      oldStatus: null,
      newStatus: 'pending',
    });

    for (const po of processedOffers) {
      const [orderOffer] = await tx.insert(orderOffers).values({
        orderId: order.id,
        offerId: po.offerInput.offer_id,
        offerName: po.offer.title_ar || 'عرض',
        offerType: po.offer.offer_type || 'percentage_discount',
        originalPrice: String(po.pricing.originalPrice),
        discountAmount: String(po.pricing.discountAmount),
        discountPercent: String(po.pricing.discountPercent),
        finalPrice: String(po.pricing.finalPrice),
        quantity: po.offerInput.quantity,
      }).returning();

      if (po.offerInput.bundle_items && po.offerInput.bundle_items.length > 0) {
        await tx.insert(orderOfferItems).values(
          po.offerInput.bundle_items.map(item => ({
            orderOfferId: orderOffer.id,
            itemName: item.item_name,
            sizeLabel: item.size_label,
            quantity: item.quantity,
            unitPrice: String(item.unit_price),
            totalPrice: String(item.total_price),
          }))
        );
      }
    }

    await tx.insert(auditLogs).values({
      entityId: order.id,
      entityType: 'order',
      action: 'other',
      details: JSON.stringify({
        orderNumber,
        action: 'created',
        method: input.order_method,
        paymentMethod: input.payment_method || 'cash',
        itemCount: input.items.length,
        totalAmount: validatedTotalAmount,
          tracking_token: trackingToken,  

      }),
      adminId: null,
    });

    return order;
  });

  // customer_tokens is outside the transaction (independent concern)
  if (!existingToken) {
    const { error: tokenError } = await supabase
      .from('customer_tokens')
      .insert({ phone, tracking_token: trackingToken });
    if (tokenError && !tokenError.message?.includes('duplicate') && !tokenError.message?.includes('unique')) {
      console.error('[CREATE_ORDER] Failed to save customer token:', tokenError);
    }
  }

  return { ...order, order_number: orderNumber, tracking_token: trackingToken };
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
  if (error) {
    console.error('[GET_ORDERS] Failed:', error);
    throw error;
  }
  return data;
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    console.error('[GET_ORDER_BY_ID] Failed:', { orderId, error });
    throw error;
  }
  return data;
}

/**
 * Server action to preview delivery fee (called from client before order creation).
 * All calculation logic is server-side — never trust client values.
 */
export async function calculateDeliveryFeeServer(lat: number, lng: number): Promise<{
  fee: number;
  distanceKm: number;
  durationMin: number;
  exceedsMaxDistance: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { settings: settingsMap, restLat, restLng } = await fetchDeliverySettings(supabase);

  if (settingsMap['delivery_enabled'] === 'false') {
    return { fee: 0, distanceKm: 0, durationMin: 0, exceedsMaxDistance: false, error: 'خدمة التوصيل غير متاحة حالياً' };
  }

  const roadFactor = parseFloat(settingsMap['road_factor']) || 1.5;

  const straightLineKm = haversineDistance(restLat, restLng, lat, lng);

  const route = await calculateRoute(restLat, restLng, lat, lng, straightLineKm, roadFactor);
  let distanceKm: number;
  let durationMin: number;

  if (route.status === 'ok') {
    distanceKm = route.distanceKm;
    durationMin = route.durationMin;
  } else {
    distanceKm = estimateRoadDistance(straightLineKm, roadFactor);
    durationMin = estimateDuration(distanceKm);
  }

  const maxDist = parseFloat(settingsMap['max_delivery_distance_km']) || MAX_DELIVERY_RADIUS_KM;
  const calculatedDistance = Math.round(distanceKm * 100) / 100;

  console.log('[DELIVERY_DISTANCE_VALIDATION]', JSON.stringify({
    restaurantCoordinates: { lat: restLat, lng: restLng },
    customerCoordinates: { lat, lng },
    calculatedDistance,
    maxDeliveryDistance: maxDist,
    validationResult: calculatedDistance <= maxDist ? 'PASS' : 'FAIL',
  }));

  if (calculatedDistance > maxDist) {
    return {
      fee: 0, distanceKm: calculatedDistance, durationMin,
      exceedsMaxDistance: true,
      error: `خدمة التوصيل متاحة حتى ${maxDist} كم فقط. المسافة الحالية: ${calculatedDistance} كم.`,
    };
  }

  const pricingSettings = parseDeliverySettings(settingsMap);
  const feeResult = calculateDeliveryFee({
    distanceKm: calculatedDistance,
    settings: pricingSettings,
  });

  if (feeResult.exceedsMaxDistance) {
    return {
      fee: 0, distanceKm: calculatedDistance, durationMin,
      exceedsMaxDistance: true,
      error: `خدمة التوصيل متاحة حتى ${pricingSettings.maxDeliveryDistanceKm} كم فقط. المسافة الحالية: ${calculatedDistance} كم.`,
    };
  }

  return {
    fee: feeResult.fee,
    distanceKm: calculatedDistance,
    durationMin,
    exceedsMaxDistance: false,
  };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  adminId?: string
) {
  const supabase = await createClient();

  // ==========================================
  // ADMIN AUTHORIZATION CHECK
  // ==========================================
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('يجب تسجيل الدخول كمسؤول لتعديل حالة الطلب');
  }
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (!admin) {
    throw new Error('غير مصرح لك بتعديل حالة الطلب');
  }

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('status, version')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchError || !order) {
    console.error('[UPDATE_ORDER_STATUS] Order not found:', { orderId, error: fetchError });
    throw new Error('الطلب غير موجود');
  }

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

  if (error) {
    console.error('[UPDATE_ORDER_STATUS] Update failed:', { orderId, newStatus, error });
    throw error;
  }
  if (!data) {
    console.error('[UPDATE_ORDER_STATUS] Concurrent modification detected:', { orderId, newStatus });
    throw new Error('تم تعديل الطلب من قبل مستخدم آخر، يرجى إعادة المحاولة');
  }

  await supabase.from('order_status_history').insert({
    order_id: orderId,
    old_status: order.status,
    new_status: newStatus,
    changed_by_admin_id: adminId || null,
  });

  console.log(`[UPDATE_ORDER_STATUS] ${orderId} → ${newStatus} (by ${adminId || 'system'})`);
  return data;
}
