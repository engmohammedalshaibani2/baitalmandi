/**
 * Centralized Pricing Engine
 * Single source of truth for all financial calculations in the application.
 */

/**
 * Centrally processes any numeric input to ensure safety against undefined, null, NaN, and Infinity.
 */
export function safeNumber(value: any, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') {
    return Number.isFinite(value) && !Number.isNaN(value) ? value : fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : fallback;
}

export interface PricingItem {
  unit_price: number | string;
  quantity: number | string;
}

export interface PricingOffer {
  quantity: number | string;
  finalPrice: number | string;
}

/**
 * Recalculate subtotal for items.
 */
export function calculateSubtotal(items: PricingItem[]): number {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const price = safeNumber(item.unit_price);
    const qty = safeNumber(item.quantity);
    return sum + (price * qty);
  }, 0);
}

/**
 * Calculate final order totals in a centralized manner.
 */
export function calculateOrderTotals({
  subtotal,
  deliveryFee,
  taxAmount = 0,
  discountAmount = 0,
}: {
  subtotal: number | string;
  deliveryFee: number | string;
  taxAmount?: number | string;
  discountAmount?: number | string;
}) {
  const s = safeNumber(subtotal);
  const df = safeNumber(deliveryFee);
  const t = safeNumber(taxAmount);
  const d = safeNumber(discountAmount);

  const totalAmount = Math.max(0, s + df + t - d);

  return {
    subtotal: s,
    deliveryFee: df,
    taxAmount: t,
    discountAmount: d,
    totalAmount,
  };
}
