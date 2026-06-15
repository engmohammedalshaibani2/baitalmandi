'use server';

import { createClient } from '@/utils/supabase/server';
import { calculateOfferPrice } from '@/lib/offer-pricing';
import { isInsideSanaa, haversineDistance, MAX_DELIVERY_RADIUS_KM } from '@/lib/location-validation';
import { calculateRoute, estimateRoadDistance, estimateDuration } from '@/lib/delivery-routing';
import { calculateDeliveryFee, parseDeliverySettings } from '@/lib/delivery-pricing';

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
        console.error(`[ORDER_NUMBER] Upsert failed (attempt ${attempt}):`, upsertError);
        continue;
      }

      const { data: seq, error: readError } = await supabase
        .from('order_sequences')
        .select('last_number')
        .eq('sequence_date', sequenceDate)
        .maybeSingle();

      if (readError || seq === null) {
        console.error(`[ORDER_NUMBER] Read failed (attempt ${attempt}):`, readError);
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
        console.error(`[ORDER_NUMBER] Update error (attempt ${attempt}):`, updateError);
        continue;
      }

      if (!updated || updated.length === 0) {
        continue;
      }

      const orderNumber = `BAM-${dateStr}-${String(nextNum).padStart(4, '0')}`;
      return orderNumber;
    } catch (err) {
      console.error(`[ORDER_NUMBER] Unexpected error (attempt ${attempt}):`, err);
    }
  }

  const fallback = Date.now().toString(36).toUpperCase().slice(-4) +
                   Math.random().toString(36).substring(2, 6).toUpperCase();
  const fallbackNumber = `BAM-${dateStr}-${fallback}`;
  console.warn(`[ORDER_NUMBER] Using UUID fallback: ${fallbackNumber}`);
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

export interface CreateOrderInput {
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  notes?: string;
  items: OrderItemInput[];
  offer_id?: string;
  subtotal: number;
  /** Client-provided delivery_fee — NEVER TRUSTED, recalculated server-side */
  delivery_fee?: number;
  tax_amount?: number;
  /** Client-provided total — NEVER TRUSTED, recalculated server-side */
  total_amount?: number;
  order_method: 'whatsapp' | 'website';
  payment_method?: 'cash' | 'transfer' | 'wallet';
  /** Delivery location (from map/GPS) — validated server-side */
  delivery_lat?: number;
  delivery_lng?: number;
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

  // Resolve restaurant and fetch all settings
  const { settings: settingsMap, restLat, restLng } = await fetchDeliverySettings(supabase);

  if (input.delivery_lat && input.delivery_lng) {
    deliveryLat = input.delivery_lat;
    deliveryLng = input.delivery_lng;

    if (!isInsideSanaa(deliveryLat, deliveryLng)) {
      throw new Error('عذراً، خدمة التوصيل متاحة داخل محافظة صنعاء فقط');
    }

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
    if (deliveryDistanceKm > maxDist) {
      throw new Error(`أقصى مسافة للتوصيل هي ${maxDist} كم. المسافة الحالية ${deliveryDistanceKm} كم`);
    }

    // Calculate delivery fee using new pricing system
    const pricingSettings = parseDeliverySettings(settingsMap);
    const feeResult = calculateDeliveryFee({
      distanceKm: deliveryDistanceKm,
      settings: pricingSettings,
    });

    if (feeResult.exceedsMaxDistance) {
      throw new Error(`أقصى مسافة للتوصيل هي ${pricingSettings.maxDeliveryDistanceKm} كم. المسافة الحالية ${deliveryDistanceKm} كم`);
    }

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
      console.error('[CREATE_ORDER] Failed to save customer token:', tokenError);
    }
  }

  let validatedSubtotal = 0;
  let validatedTotalAmount = 0;

  if (input.offer_id) {
    const { data: offer } = await supabase
      .from('offers')
      .select('*, offer_items(*, menu_item:menu_item_id(*, item_prices(*)))')
      .eq('id', input.offer_id)
      .maybeSingle();

    if (!offer) {
      throw new Error('العرض غير موجود');
    }

    const now = new Date().toISOString();
    const startDate = new Date(offer.start_date).toISOString();
    const endDate = new Date(offer.end_date).toISOString();
    if (offer.status !== 'active' || !offer.is_active || now < startDate || now > endDate) {
      throw new Error('العرض غير متاح حالياً');
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
      throw new Error('العرض لا يحتوي على منتجات');
    }

    const pricing = calculateOfferPrice({
      offerType: (offer.offer_type as any) || 'percentage_discount',
      salePrice: offer.sale_price ? Number(offer.sale_price) : undefined,
      discountPercent: offer.discount_percent || undefined,
      discountAmount: offer.discount_amount ? Number(offer.discount_amount) : undefined,
      items: bundleItems,
    });

    validatedSubtotal = pricing.finalPrice;
    validatedTotalAmount = validatedSubtotal + deliveryFeeNumeric;
  } else {
    validatedSubtotal = input.subtotal;
    validatedTotalAmount = validatedSubtotal + deliveryFeeNumeric;
  }

  let cleanNotes = input.notes || '';
  cleanNotes = cleanNotes.replace(/\[BUNDLE\].*?\[\/BUNDLE\]/g, '').replace(/\n{2,}/g, '\n').trim();
  const notesValue = cleanNotes || null;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      tracking_token: trackingToken,
      offer_id: input.offer_id || null,
      customer_name: input.customer_name.trim(),
      customer_phone: phone,
      delivery_address: input.delivery_address?.trim() || null,
      notes: notesValue,
      subtotal: String(validatedSubtotal),
      delivery_fee: String(deliveryFeeNumeric),
      tax_amount: String(input.tax_amount || 0),
      total_amount: String(validatedTotalAmount),
      order_method: input.order_method,
      payment_method: input.payment_method || 'cash',
      status: 'pending',
      delivery_latitude: deliveryLat ? String(deliveryLat) : null,
      delivery_longitude: deliveryLng ? String(deliveryLng) : null,
      delivery_zone: null, // Zone-based pricing removed
      delivery_distance_km: deliveryDistanceKm ? String(deliveryDistanceKm) : null,
      delivery_duration_minutes: deliveryDurationMin,
      location_verified: deliveryLat !== null,
      base_delivery_fee_amount: String(baseFeeAmount),
      extra_distance_km: String(extraDistanceKm),
      extra_fee_amount: String(Math.max(0, extraFeeAmount)),
      weather_fee_amount: String(weatherFeeApplied),
      peak_fee_amount: String(peakFeeApplied),
      peak_percentage_used: String(peakPercentageApplied),
    })
    .select()
    .single();

  if (orderError) {
    console.error('[CREATE_ORDER] Order insert failed:', {
      orderNumber,
      customer: input.customer_name,
      phone: input.customer_phone,
      error: orderError,
    });
    throw new Error(`فشل إنشاء الطلب: ${orderError.message}`);
  }

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

  if (itemsError) {
    console.error('[CREATE_ORDER] Items insert failed, rolling back order:', {
      orderId: order.id,
      orderNumber,
      itemsCount: input.items.length,
      error: itemsError,
    });

    await supabase.from('orders').delete().eq('id', order.id);
    throw new Error(`فشل إضافة أصناف الطلب: ${itemsError.message}`);
  }

  const { error: historyError } = await supabase
    .from('order_status_history')
    .insert({
      order_id: order.id,
      old_status: null,
      new_status: 'pending',
    });

  if (historyError) {
    console.error('[CREATE_ORDER] Status history insert failed:', {
      orderId: order.id,
      orderNumber,
      error: historyError,
    });
  }

  if (input.offer_id && order) {
    const { data: offer } = await supabase
      .from('offers')
      .select('*, offer_items(*)')
      .eq('id', input.offer_id)
      .maybeSingle();

    if (offer) {
      const bundleItems = (offer.offer_items || []).map((oi: any) => ({
        itemId: oi.menu_item_id,
        itemName: oi.menu_item_id || '',
        quantity: oi.quantity,
        unitPrice: Number(oi.unit_price || 0),
        priceId: oi.price_id || undefined,
        variantName: oi.variant_name || undefined,
        sizeLabel: oi.variant_name || 'عادي',
        categoryName: 'عروض',
      }));

      const pricing = calculateOfferPrice({
        offerType: (offer.offer_type as any) || 'percentage_discount',
        salePrice: offer.sale_price ? Number(offer.sale_price) : undefined,
        discountPercent: offer.discount_percent || undefined,
        discountAmount: offer.discount_amount ? Number(offer.discount_amount) : undefined,
        items: bundleItems,
      });

      const { data: orderOffer } = await supabase
        .from('order_offers')
        .insert({
          order_id: order.id,
          offer_id: input.offer_id,
          offer_name: offer.title_ar,
          offer_type: offer.offer_type || 'percentage_discount',
          original_price: String(pricing.originalPrice),
          discount_amount: String(pricing.discountAmount),
          discount_percent: String(pricing.discountPercent),
          final_price: String(pricing.finalPrice),
        })
        .select()
        .single();

      if (orderOffer) {
        const offerItemsData = input.items
          .filter(item => item.category_name === 'عروض')
          .map(item => ({
            order_offer_id: orderOffer.id,
            item_name: item.item_name,
            size_label: item.size_label,
            quantity: item.quantity,
            unit_price: String(item.unit_price),
            total_price: String(item.total_price),
          }));

        if (offerItemsData.length > 0) {
          await supabase.from('order_offer_items').insert(offerItemsData);
        }
      }
    }
  }

  console.log(`[CREATE_ORDER] Success: ${orderNumber} (${input.customer_name})`);
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
  insideSanaa: boolean;
  exceedsMaxDistance: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  if (!isInsideSanaa(lat, lng)) {
    return { fee: 0, distanceKm: 0, durationMin: 0, insideSanaa: false, exceedsMaxDistance: false, error: 'عذراً، خدمة التوصيل متاحة داخل محافظة صنعاء فقط' };
  }

  const { settings: settingsMap, restLat, restLng } = await fetchDeliverySettings(supabase);

  if (settingsMap['delivery_enabled'] === 'false') {
    return { fee: 0, distanceKm: 0, durationMin: 0, insideSanaa: true, exceedsMaxDistance: false, error: 'خدمة التوصيل غير متاحة حالياً' };
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
  if (distanceKm > maxDist) {
    return { fee: 0, distanceKm, durationMin, insideSanaa: true, exceedsMaxDistance: true, error: `أقصى مسافة للتوصيل هي ${maxDist} كم` };
  }

  const pricingSettings = parseDeliverySettings(settingsMap);
  const feeResult = calculateDeliveryFee({
    distanceKm,
    settings: pricingSettings,
  });

  if (feeResult.exceedsMaxDistance) {
    return { fee: 0, distanceKm, durationMin, insideSanaa: true, exceedsMaxDistance: true, error: `أقصى مسافة للتوصيل هي ${pricingSettings.maxDeliveryDistanceKm} كم` };
  }

  console.log('[DELIVERY_DEBUG]', JSON.stringify({
    restaurantLat: restLat,
    restaurantLng: restLng,
    customerLat: lat,
    customerLng: lng,
    haversineKm: Math.round(straightLineKm * 100) / 100,
    osrmDistanceKm: distanceKm,
    durationMin,
    fee: feeResult.fee,
    weatherFeeApplied: feeResult.weatherFeeApplied,
    peakFeeApplied: feeResult.peakFeeApplied,
  }));

  return {
    fee: feeResult.fee,
    distanceKm,
    durationMin,
    insideSanaa: true,
    exceedsMaxDistance: false,
  };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  adminId?: string
) {
  const supabase = await createClient();

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
