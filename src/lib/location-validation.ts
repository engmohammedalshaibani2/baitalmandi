/**
 * Location validation for Sanaa delivery area.
 * Uses a polygonal approximation of Sanaa city boundary.
 */

// Approximate Sanaa city boundary polygon (lat, lng) in clockwise order
// These coordinates define the main Sanaa municipality area
const SANAA_BOUNDARY: [number, number][] = [
  [15.4300, 44.1300], // NW
  [15.4300, 44.2700], // NE
  [15.2800, 44.2700], // SE
  [15.2800, 44.1300], // SW
];

/**
 * Check if a point is inside the Sanaa boundary using ray-casting algorithm.
 */
export function isInsideSanaa(lat: number, lng: number): boolean {
  let inside = false;
  const n = SANAA_BOUNDARY.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = SANAA_BOUNDARY[i][1], yi = SANAA_BOUNDARY[i][0];
    const xj = SANAA_BOUNDARY[j][1], yj = SANAA_BOUNDARY[j][0];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculate Haversine distance between two points (used as fallback only).
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Get approximate center of Sanaa.
 */
export function sanaaCenter(): { lat: number; lng: number } {
  return { lat: 15.3547, lng: 44.2067 };
}

/**
 * Get max delivery radius from restaurant (km).
 * Used as an initial filter before OSRM routing.
 */
export const MAX_DELIVERY_RADIUS_KM = 25;
