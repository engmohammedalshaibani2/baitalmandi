/**
 * Delivery routing with multi-provider fallback.
 * Primary: OSRM (free, no API key needed).
 * Validates results against haversine straight-line distance.
 * Falls back to road_factor × haversine when routing is unreliable.
 *
 * OSRM expects coordinates in longitude,latitude order.
 */

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  status: 'ok' | 'error';
  error?: string;
}

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';
const MAX_ROAD_TO_LINE_RATIO = 10;
const DEFAULT_ROAD_FACTOR = 1.5;

/**
 * Calculate real road route between two points using OSRM.
 * Validates result against haversine straight-line distance.
 */
export async function calculateRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  straightLineKm?: number,
  roadFactor: number = DEFAULT_ROAD_FACTOR,
): Promise<RouteResult> {
  try {
    const url = `${OSRM_BASE_URL}/${originLng},${originLat};${destLng},${destLat}?overview=false&steps=false&alternatives=false`;

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!response.ok) {
      return {
        distanceKm: 0,
        durationMin: 0,
        status: 'error',
        error: `OSRM returned ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return {
        distanceKm: 0,
        durationMin: 0,
        status: 'error',
        error: 'No route found',
      };
    }

    const route = data.routes[0];
    const osrmDistanceMeters = route.distance;
    const osrmDurationSeconds = route.duration;

    let distanceKm = osrmDistanceMeters / 1000;
    let durationMin = Math.ceil(osrmDurationSeconds / 60);

    // Validate OSRM result
    const valid = straightLineKm
      ? isRouteValid(distanceKm, straightLineKm, roadFactor)
      : true;

    if (!valid && straightLineKm) {
      const fallbackKm = estimateRoadDistance(straightLineKm, roadFactor);
      const fallbackMin = estimateDuration(fallbackKm);

      return {
        distanceKm: Math.round(fallbackKm * 10) / 10,
        durationMin: fallbackMin,
        status: 'ok',
      };
    }

    return {
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMin,
      status: 'ok',
    };
  } catch (err: any) {
    return {
      distanceKm: 0,
      durationMin: 0,
      status: 'error',
      error: err?.message || 'Routing request failed',
    };
  }
}

/**
 * Validate OSRM route distance against straight-line distance.
 * Returns false if the route is unreliable.
 */
export function isRouteValid(
  osrmKm: number,
  straightLineKm: number,
  roadFactor: number = DEFAULT_ROAD_FACTOR,
): boolean {
  if (straightLineKm <= 0) return true;

  // Route cannot be shorter than straight line
  if (osrmKm < straightLineKm) {
    return false;
  }

  // Route cannot be unreasonably longer than straight line
  if (osrmKm > straightLineKm * MAX_ROAD_TO_LINE_RATIO) {
    return false;
  }

  // Route cannot be shorter than haversine × road factor (suggests wrong data)
  if (osrmKm < straightLineKm * roadFactor * 0.5) {
    return false;
  }

  return true;
}

/**
 * Fallback: estimate route distance from haversine + road factor.
 */
export function estimateRoadDistance(
  straightLineKm: number,
  roadFactor: number = DEFAULT_ROAD_FACTOR,
): number {
  return Math.round(straightLineKm * roadFactor * 10) / 10;
}

/**
 * Estimate duration from distance assuming avg 30 km/h in city.
 */
export function estimateDuration(distanceKm: number): number {
  return Math.ceil((distanceKm / 30) * 60);
}
