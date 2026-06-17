import { getOrderOffers, type OrderOfferSnapshot } from '@/actions/orders-offers';

export interface OrderBundleInfo {
  offerName: string;
  originalPrice: number;
  discountAmount: number;
  discountPercent: number;
  finalPrice: number;
  quantity?: number;
}

/**
 * Extract bundle info from order notes (backward compat for old orders).
 * Falls back to parsing [BUNDLE] JSON tag from notes.
 */
export function extractBundleFromNotes(notes?: string | null): OrderBundleInfo | null {
  if (!notes) return null;
  const match = notes.match(/\[BUNDLE\](.*?)\[\/BUNDLE\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed?.bundle) return parsed.bundle;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Convert a server-side OrderOfferSnapshot to the client-side OrderBundleInfo format.
 */
export function snapshotToBundleInfo(snapshot: OrderOfferSnapshot): OrderBundleInfo {
  return {
    offerName: snapshot.offerName,
    originalPrice: snapshot.originalPrice,
    discountAmount: snapshot.discountAmount,
    discountPercent: snapshot.discountPercent,
    finalPrice: snapshot.finalPrice,
    quantity: snapshot.quantity || 1,
  };
}

/**
 * Get all bundle infos for an order.
 * First tries the order_offers table (new system — returns ALL offers),
 * then falls back to notes (single offer, backward compat).
 */
export async function getBundleInfos(orderId: string, notes?: string | null): Promise<OrderBundleInfo[]> {
  try {
    const offers = await getOrderOffers(orderId);
    if (offers.length > 0) {
      return offers.map(snapshotToBundleInfo);
    }
  } catch {
    // Fall through to notes
  }
  const single = extractBundleFromNotes(notes);
  return single ? [single] : [];
}
