'use server';

import { createClient } from '@/utils/supabase/server';
import { calculateOfferPrice, type OfferPricingResult } from '@/lib/offer-pricing';
import { haversineDistance, MAX_DELIVERY_RADIUS_KM } from '@/lib/location-validation';
import { calculateRoute, estimateRoadDistance, estimateDuration } from '@/lib/delivery-routing';
import { calculateDeliveryFee, parseDeliverySettings } from '@/lib/delivery-pricing';
import { validateYemeniPhone } from '@/lib/validation';
import { calculateSubtotal, calculateOrderTotals } from '@/lib/pricing-engine';
import { logger } from '@/lib/logger';
import { db } from '@/db';
import { 
  orders, orderItems, orderStatusHistory, customerTokens, 
  orderOffers, orderOfferItems 
} from '@/db/schema';
import { eq } from 'drizzle-orm';

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

      if (upsertError) {
        logger.error('ORDER_NUMBER', `Upsert failed (attempt ${attempt}):`, upsertError);
        continue;
      }

      const { data: seq, error: readError } = await supabase
        .from('order_sequences')
        .select('last_number')
        .eq('sequence_date', sequenceDate)
        .maybeSingle();

      if (readError || seq === null) {
        logger.error('ORDER_NUMBER', `Read failed (attempt ${attempt}):`, readError);
        continue;
      }

      const nextNum = (seq.last_number || 0) + 1;

      const { data: updated, error: updateError } = await supabase
        .from('order_sequences')
        .update({ last_number: nextNum })
        .eq('sequence_date', sequenceDate)
        .eq('last_number', seq.last_number)
        .select();

      if (updateError) {
        logger.error('ORDER_NUMBER', `Update error (attempt ${attempt}):`, updateError);
        continue;
      }

      if (!updated || updated.length === 0) {
        continue;
      }

      const orderNumber = `BAM-${dateStr}-${String(nextNum).padStart(4, '0')}`;
      return orderNumber;
    } catch (err) {
      logger.error('ORDER_NUMBER', `Unexpected error (attempt ${attempt}):`, err);
    }
  }

  const fallback = Date.now().toString(36).toUpperCase().slice(-4) +
                   Math.random().toString(36).substring(2, 6).toUpperCase();
  const fallbackNumber = `BAM-${dateStr}-${fallback}`;
  logger.warn('ORDER_NUMBER', `Using UUID fallback: ${fallbackNumber}`);
  return fallbackNumber;
}

export interface OrderItemInput {
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
  subtotal: number;
  delivery_fee?: number;
  tax_amount?: number;
  total_amount?: number;
  order_method: 'whatsapp' | 'website';
  payment_method?: 'cash' | 'transfer' | 'wallet';
  delivery_lat?: number;
  delivery_lng?: number;
}

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

    logger.info('DELIVERY_DISTANCE_VALIDATION', 'Distance Validated', { calculatedDistance, maxDist });

    if (calculatedDistance > maxDist) {
      throw new Error(`خدمة التوصيل متاحة حتى ${maxDist} كم فقط. المسافة الحالية: ${calculatedDistance} كم.`);
    }

    const pricingSettings = parseDeliverySettings(settingsMap);
    const feeResult = calculateDeliveryFee({
      distanceKm: calculatedDistance,
      settings: pricingSettings,
    });

    if (feeResult.exceedsMaxDistance) {
      throw new Error(`خدمة التوصيل متاحة حتى ${pricingSettings.maxDeliveryDistanceKm} كم فقط.`);
    }

    deliveryDistanceKm = calculatedDistance;
    deliveryFeeNumeric = feeResult.fee;
    weatherFeeApplied = feeResult.weatherFeeApplied;
    peakFeeApplied = feeResult.peakFeeApplied;
    peakPercentageApplied = feeResult.peakPercentageApplied;
    baseFeeAmount = feeResult.baseFee;
    extraDistanceKm = Math.max(0, deliveryDistanceKm - pricingSettings.includedDistanceKm);
    extraFeeAmount = deliveryFeeNumeric - baseFeeAmount - weatherFeeApplied - peakFeeApplied;

    logger.info('DELIVERY_DEBUG', 'Delivery Fee Calculated', { fee: deliveryFeeNumeric, durationMin: deliveryDurationMin });
  }

  const orderNumber = await generateOrderNumber();
  const phone = input.customer_phone.trim();

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
      logger.error('CREATE_ORDER', 'Failed to save customer token', tokenError);
    }
  }

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

      if (!offer) throw new Error(`العرض ${offerInput.offer_id} غير موجود`);

      const now = new Date().toISOString();
      const startDate = new Date(offer.start_date).toISOString();
      const endDate = new Date(offer.end_date).toISOString();
      if (offer.status !== 'active' || !offer.is_active || now < startDate || now > endDate) {
        throw new Error(`العرض ${offer.title_ar || ''} غير متاح حالياً`);
      }

      const bundleItems = (offer.offer_items || []).map((oi: any) => {
        const prices = oi.menu_item?.item_prices || [];
        return {
          itemId: oi.menu_item_id,
          itemName: oi.menu_item?.name_ar || '',
          quantity: oi.quantity,
          unitPrice: oi.unit_price ? Number(oi.unit_price) : 0,
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

  // === CALCULATE TOTALS VIA PRICING ENGINE ===
  const regularItemsSubtotal = calculateSubtotal(
    input.items.filter(i => i.category_name !== 'عروض').map(i => ({
      unit_price: i.unit_price,
      quantity: i.quantity
    }))
  );

  const totalOfferAmount = processedOffers.reduce(
    (acc, po) => acc + po.pricing.finalPrice * po.offerInput.quantity,
    0
  );

  const totalProducts = regularItemsSubtotal + totalOfferAmount;

  const totals = calculateOrderTotals({
    subtotal: totalProducts,
    deliveryFee: deliveryFeeNumeric,
    taxAmount: input.tax_amount || 0,
    discountAmount: 0
  });

  const validatedSubtotal = totals.subtotal;
  const validatedTotalAmount = totals.totalAmount;

  logger.info('MIN_ORDER_CALCULATION', 'Calculated Totals', { validatedSubtotal, deliveryFeeNumeric, validatedTotalAmount });

  if (minOrderAmount > 0 && validatedTotalAmount < minOrderAmount) {
    logger.warn('MIN_ORDER_VALIDATION', 'Order total below minimum', { validatedTotalAmount, minOrderAmount });
    throw new Error(`الحد الأدنى للطلب هو ${minOrderAmount} ${currency}. إجمالي الطلب: ${validatedTotalAmount} ${currency}`);
  }

  let cleanNotes = input.notes || '';
  cleanNotes = cleanNotes.replace(/\[BUNDLE\].*?\[\/BUNDLE\]/g, '').replace(/\n{2,}/g, '\n').trim();
  const notesValue = cleanNotes || null;

  // === DRIZZLE TRANSACTION ===
  try {
    const finalOrder = await db.transaction(async (tx) => {
      // 1. Insert Parent Order
      const [order] = await tx.insert(orders).values({
        orderNumber,
        trackingToken,
        customerName: input.customer_name.trim(),
        customerPhone: phone,
        deliveryAddress: input.delivery_address?.trim() || null,
        notes: notesValue,
        subtotal: String(validatedSubtotal),
        deliveryFee: String(deliveryFeeNumeric),
        taxAmount: String(totals.taxAmount),
        totalAmount: String(validatedTotalAmount),
        orderMethod: input.order_method,
        paymentMethod: input.payment_method || 'cash',
        status: 'pending',
        deliveryLatitude: deliveryLat ? String(deliveryLat) : null,
        deliveryLongitude: deliveryLng ? String(deliveryLng) : null,
        deliveryDistanceKm: deliveryDistanceKm ? String(deliveryDistanceKm) : null,
        deliveryDurationMinutes: deliveryDurationMin,
        locationVerified: deliveryLat !== null,
        baseDeliveryFeeAmount: String(baseFeeAmount),
        extraDistanceKm: String(extraDistanceKm),
        extraFeeAmount: String(Math.max(0, extraFeeAmount)),
        weatherFeeAmount: String(weatherFeeApplied),
        peakFeeAmount: String(peakFeeApplied),
        peakPercentageUsed: String(peakPercentageApplied),
      }).returning();

      // 2. Insert Order Items
      if (input.items.length > 0) {
        await tx.insert(orderItems).values(
          input.items.map(item => ({
            orderId: order.id,
            categoryName: item.category_name,
            itemName: item.item_name,
            sizeLabel: item.size_label,
            quantity: item.quantity,
            unitPrice: String(item.unit_price),
            totalPrice: String(item.total_price),
          }))
        );
      }

      // 3. Insert Status History
      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        newStatus: 'pending',
      });

      // 4. Insert Offers
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

        const bundleItemsData = (po.offerInput.bundle_items || []).map(item => ({
          orderOfferId: orderOffer.id,
          itemName: item.item_name,
          sizeLabel: item.size_label,
          quantity: item.quantity,
          unitPrice: String(item.unit_price),
          totalPrice: String(item.total_price),
        }));

        if (bundleItemsData.length > 0) {
          await tx.insert(orderOfferItems).values(bundleItemsData);
        }
      }

      return order;
    });

    logger.info('CREATE_ORDER', `Success: ${orderNumber} (${input.customer_name})`);
    return { 
      ...finalOrder, 
      tracking_token: trackingToken, 
      order_number: orderNumber,
      created_at: finalOrder.createdAt 
    };
  } catch (error) {
    logger.error('CREATE_ORDER', `Transaction failed for order ${orderNumber}`, error);
    throw new Error('فشل إنشاء الطلب بالكامل. لم يتم حفظ أي بيانات.');
  }
}

export async function getOrders(filters?: { status?: string; is_archived?: boolean }) {
  const supabase = await createClient();
  let query = supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.is_archived !== undefined) query = query.eq('is_archived', filters.is_archived);

  const { data, error } = await query;
  if (error) {
    logger.error('SUPABASE_ERROR', 'GET_ORDERS Failed', error);
    throw error;
  }
  return data;
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    logger.error('SUPABASE_ERROR', 'GET_ORDER_BY_ID Failed', error);
    throw error;
  }
  return data;
}

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

  if (calculatedDistance > maxDist) {
    return {
      fee: 0, distanceKm: calculatedDistance, durationMin,
      exceedsMaxDistance: true,
      error: `خدمة التوصيل متاحة حتى ${maxDist} كم فقط.`,
    };
  }

  const pricingSettings = parseDeliverySettings(settingsMap);
  const feeResult = calculateDeliveryFee({ distanceKm: calculatedDistance, settings: pricingSettings });

  if (feeResult.exceedsMaxDistance) {
    return {
      fee: 0, distanceKm: calculatedDistance, durationMin,
      exceedsMaxDistance: true,
      error: `خدمة التوصيل متاحة حتى ${pricingSettings.maxDeliveryDistanceKm} كم فقط.`,
    };
  }

  return { fee: feeResult.fee, distanceKm: calculatedDistance, durationMin, exceedsMaxDistance: false };
}

export async function updateOrderStatus(orderId: string, newStatus: string, adminId?: string) {
  const supabase = await createClient();
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('status, version')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchError || !order) {
    logger.error('UPDATE_ORDER_STATUS', 'Order not found', fetchError);
    throw new Error('الطلب غير موجود');
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus, version: order.version + 1, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('version', order.version)
    .select()
    .single();

  if (error) {
    logger.error('UPDATE_ORDER_STATUS', 'Update failed', error);
    throw error;
  }
  if (!data) throw new Error('تم تعديل الطلب من قبل مستخدم آخر، يرجى إعادة المحاولة');

  await supabase.from('order_status_history').insert({
    order_id: orderId,
    old_status: order.status,
    new_status: newStatus,
    changed_by_admin_id: adminId || null,
  });

  logger.info('UPDATE_ORDER_STATUS', `${orderId} → ${newStatus}`);
  return data;
}
