/**
 * Delivery zone auto-detection from geographic coordinates.
 * Uses Turf.js point-in-polygon for accurate zone detection.
 * NEVER use nearest-center matching — it misclassifies edge cases.
 */

import { resolveZone, type ZoneResult } from '@/lib/geo/resolve-zone';
import { isInsideSanaa } from './location-validation';

export interface DeliveryZone {
  name: string;
  baseFee: number;
  perKmFee: number;
  maxDistanceKm: number;
  centerLat: number;
  centerLng: number;
  polygon: [number, number][];
}

export const SANAA_ZONES: DeliveryZone[] = [];

/**
 * Find the delivery zone using Turf.js point-in-polygon resolution.
 * This is the ONLY zone detection function used in production.
 */
export function findZoneByPolygon(lat: number, lng: number): DeliveryZone | null {
  if (!isInsideSanaa(lat, lng)) return null;

  const result: ZoneResult = resolveZone(lat, lng);

  if (result.zoneId === 'unknown' || !result.zoneName) {
    return null;
  }

  return {
    name: result.zoneName,
    baseFee: result.baseFee,
    perKmFee: result.perKmFee,
    maxDistanceKm: result.maxDistanceKm,
    centerLat: lat,
    centerLng: lng,
    polygon: [],
  };
}

export function findNearestZone(lat: number, lng: number): DeliveryZone | null {
  return findZoneByPolygon(lat, lng);
}

export function getDefaultZone(): DeliveryZone {
  return {
    name: 'أزال',
    baseFee: 500,
    perKmFee: 200,
    maxDistanceKm: 10,
    centerLat: 15.3700,
    centerLng: 44.2050,
    polygon: [],
  };
}
