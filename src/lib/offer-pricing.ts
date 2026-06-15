export interface BundleItemData {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  sizeLabel?: string;
  categoryName?: string;
  image?: string;
  /** Variant / size price info */
  priceId?: string;
  variantName?: string;
  /** Original DB price fields for server-side audit */
  dbOriginalPrice?: number;
  dbSalePrice?: number | null;
}

export interface OfferPricingInput {
  offerType: 'fixed_price' | 'percentage_discount' | 'amount_discount' | 'free_item';
  salePrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  items: BundleItemData[];
}

export interface OfferPricingResult {
  originalPrice: number;
  discountAmount: number;
  discountPercent: number;
  finalPrice: number;
  finalPriceRounded: number;
  savings: number;
  items: BundleItemData[];
}

/**
 * Single source of truth for all offer/bundle pricing.
 * 
 * - originalPrice = sum of (unitPrice * quantity) for all items
 * - unitPrice must be the EFFECTIVE price (sale_price ?? original_price) of the selected variant
 * - For items without a selected variant, uses the best available price
 */
export function calculateOfferPrice(input: OfferPricingInput): OfferPricingResult {
  const originalPrice = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  let finalPrice: number;

  switch (input.offerType) {
    case 'fixed_price':
      finalPrice = input.salePrice ?? originalPrice;
      break;
    case 'percentage_discount':
      finalPrice = originalPrice * (1 - (input.discountPercent ?? 0) / 100);
      break;
    case 'amount_discount':
      finalPrice = Math.max(0, originalPrice - (input.discountAmount ?? 0));
      break;
    case 'free_item': {
      if (input.items.length === 0) {
        finalPrice = 0;
      } else {
        const cheapest = input.items.reduce((min, item) =>
          item.unitPrice * item.quantity < min.unitPrice * min.quantity ? item : min
        );
        finalPrice = originalPrice - cheapest.unitPrice * cheapest.quantity;
      }
      break;
    }
    default:
      finalPrice = originalPrice;
  }

  finalPrice = Math.max(0, Math.round(finalPrice));
  const discountAmount = originalPrice - finalPrice;
  const discountPercent = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;

  return {
    originalPrice: Math.round(originalPrice),
    discountAmount: Math.round(discountAmount),
    discountPercent,
    finalPrice,
    finalPriceRounded: finalPrice,
    savings: Math.round(discountAmount),
    items: input.items,
  };
}

/**
 * Resolve the best effective price for an item from its variants.
 * - Uses sale_price if available, else original_price
 * - If a priceId is provided, finds that specific variant
 * - Falls back to the minimum active price
 */
export function resolveItemPrice(
  prices: Array<{ id: string; original_price: string | number; sale_price?: string | number | null; size_label_ar?: string; is_active?: boolean }>,
  preferredPriceId?: string,
): { effectivePrice: number; priceId: string; variantName: string } {
  const active = prices.filter(p => p.is_active !== false);
  if (active.length === 0) return { effectivePrice: 0, priceId: '', variantName: '' };

  // If a specific price_id is preferred, find it
  if (preferredPriceId) {
    const match = active.find(p => p.id === preferredPriceId);
    if (match) {
      return {
        effectivePrice: Number(match.sale_price ?? match.original_price),
        priceId: match.id,
        variantName: match.size_label_ar || '',
      };
    }
  }

  // Use the minimum active price (sale_price preferred)
  const sorted = [...active].sort((a, b) => {
    const aPrice = Number(a.sale_price ?? a.original_price);
    const bPrice = Number(b.sale_price ?? b.original_price);
    return aPrice - bPrice;
  });
  const best = sorted[0];
  return {
    effectivePrice: Number(best.sale_price ?? best.original_price),
    priceId: best.id,
    variantName: best.size_label_ar || '',
  };
}

export function offerTypeLabel(type: string): string {
  const map: Record<string, string> = {
    fixed_price: 'سعر ثابت',
    percentage_discount: 'خصم نسبة',
    amount_discount: 'خصم مبلغ',
    free_item: 'منتج مجاني',
  };
  return map[type] || type;
}
