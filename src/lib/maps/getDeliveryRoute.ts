export interface DeliveryRoute {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
}

export interface DeliveryRouteOptions extends DeliveryRoute {
  index: number;
  isPrimary: boolean;
}

export interface DeliveryRoutesResult {
  primary: DeliveryRoute;
  alternatives: DeliveryRoute[];
  all: DeliveryRouteOptions[];
  status: 'ok' | 'error' | 'partial';
  error?: string;
}

interface CacheEntry {
  data: DeliveryRoutesResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function cacheKey(
  restaurantLat: number,
  restaurantLng: number,
  customerLat: number,
  customerLng: number,
): string {
  const rLat = restaurantLat.toFixed(6);
  const rLng = restaurantLng.toFixed(6);
  const cLat = customerLat.toFixed(6);
  const cLng = customerLng.toFixed(6);
  return `${rLat},${rLng}-${cLat},${cLng}`;
}

function parseOSRMCoord(coord: number[]): [number, number] {
  return [coord[1], coord[0]];
}

function routeToDeliveryRoute(route: any, index: number, isPrimary: boolean): DeliveryRouteOptions {
  const coordinates: [number, number][] = (route.geometry?.coordinates || []).map(parseOSRMCoord);
  const distanceKm = Math.round((route.distance / 1000) * 100) / 100;
  const durationMinutes = Math.ceil(route.duration / 60);
  return { coordinates, distanceKm, durationMinutes, index, isPrimary };
}

function selectBestRoute(routes: DeliveryRouteOptions[]): number {
  if (routes.length === 0) return -1;
  if (routes.length === 1) return 0;

  let bestIdx = 0;
  let bestDistance = routes[0].distanceKm;
  let bestDuration = routes[0].durationMinutes;

  for (let i = 1; i < routes.length; i++) {
    const r = routes[i];
    if (r.distanceKm < bestDistance) {
      bestIdx = i;
      bestDistance = r.distanceKm;
      bestDuration = r.durationMinutes;
    } else if (r.distanceKm === bestDistance && r.durationMinutes < bestDuration) {
      bestIdx = i;
      bestDuration = r.durationMinutes;
    }
  }

  return bestIdx;
}

export async function getDeliveryRoutes(
  restaurantLat: number,
  restaurantLng: number,
  customerLat: number,
  customerLng: number,
): Promise<DeliveryRoutesResult> {
  const key = cacheKey(restaurantLat, restaurantLng, customerLat, customerLng);
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/${restaurantLng},${restaurantLat};${customerLng},${customerLat}?overview=full&geometries=geojson&steps=false&alternatives=true`;

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      const fallback = await getDeliveryRoute(restaurantLat, restaurantLng, customerLat, customerLng);
      const fallbackResult: DeliveryRoutesResult = {
        primary: fallback,
        alternatives: [],
        all: [{ ...fallback, index: 0, isPrimary: true }],
        status: 'error',
        error: `OSRM returned ${response.status}`,
      };
      console.log('[OSRM_ROUTES_FETCHED] OSRM error, using fallback:', response.status);
      console.log('[ROUTE_SELECTION_FALLBACK] Using haversine fallback, reason: OSRM error');
      return fallbackResult;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      const fallback = await getDeliveryRoute(restaurantLat, restaurantLng, customerLat, customerLng);
      const fallbackResult: DeliveryRoutesResult = {
        primary: fallback,
        alternatives: [],
        all: [{ ...fallback, index: 0, isPrimary: true }],
        status: 'error',
        error: 'No route found',
      };
      console.log('[OSRM_ROUTES_FETCHED] No routes from OSRM, using fallback');
      console.log('[ROUTE_SELECTION_FALLBACK] Using haversine fallback, reason: No routes');
      return fallbackResult;
    }

    const parsedRoutes: DeliveryRouteOptions[] = data.routes.map((route: any, idx: number) => {
      const hasValidGeometry = route.geometry?.coordinates?.length >= 2;
      if (!hasValidGeometry) return null;
      return routeToDeliveryRoute(route, idx, false);
    }).filter(Boolean);

    if (parsedRoutes.length === 0) {
      const fallback = await getDeliveryRoute(restaurantLat, restaurantLng, customerLat, customerLng);
      const fallbackResult: DeliveryRoutesResult = {
        primary: fallback,
        alternatives: [],
        all: [{ ...fallback, index: 0, isPrimary: true }],
        status: 'error',
        error: 'Invalid route geometry',
      };
      console.log('[OSRM_ROUTES_FETCHED] Invalid geometry in all routes, using fallback');
      console.log('[ROUTE_SELECTION_FALLBACK] Using haversine fallback, reason: Invalid geometry');
      return fallbackResult;
    }

    const primaryIdx = selectBestRoute(parsedRoutes);

    const allRoutes = parsedRoutes.map((r, idx) => ({
      ...r,
      isPrimary: idx === primaryIdx,
      index: idx,
    }));

    const primary = allRoutes[primaryIdx];
    const alternatives = allRoutes.filter((_, idx) => idx !== primaryIdx);

    console.log('[OSRM_ROUTES_FETCHED]', JSON.stringify({
      numberOfRoutes: allRoutes.length,
      routes: allRoutes.map(r => ({
        index: r.index,
        distanceKm: r.distanceKm,
        durationMin: r.durationMinutes,
        isPrimary: r.isPrimary,
      })),
    }));

    console.log('[PRIMARY_ROUTE_SELECTED]', JSON.stringify({
      selectedIndex: primaryIdx,
      distanceKm: primary.distanceKm,
      durationMin: primary.durationMinutes,
      selectionCriteria: 'shortest_distance',
    }));

    if (alternatives.length > 0) {
      console.log('[ALTERNATIVE_ROUTES_RENDERED]', JSON.stringify({
        alternativeCount: alternatives.length,
        alternatives: alternatives.map(a => ({
          index: a.index,
          distanceKm: a.distanceKm,
          durationMin: a.durationMinutes,
        })),
      }));
    }

    const result: DeliveryRoutesResult = {
      primary: { coordinates: primary.coordinates, distanceKm: primary.distanceKm, durationMinutes: primary.durationMinutes },
      alternatives: alternatives.map(a => ({ coordinates: a.coordinates, distanceKm: a.distanceKm, durationMinutes: a.durationMinutes })),
      all: allRoutes,
      status: allRoutes.length > 1 ? 'ok' : 'partial',
    };

    cache.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

    return result;
  } catch (err: any) {
    const fallback = await getDeliveryRoute(restaurantLat, restaurantLng, customerLat, customerLng);
    const fallbackResult: DeliveryRoutesResult = {
      primary: fallback,
      alternatives: [],
      all: [{ ...fallback, index: 0, isPrimary: true }],
      status: 'error',
      error: err?.message || 'Routing request failed',
    };
    console.log('[OSRM_ROUTES_FETCHED] OSRM error, using fallback:', err?.message);
    console.log('[ROUTE_SELECTION_FALLBACK] Using haversine fallback, reason:', err?.message);
    return fallbackResult;
  }
}

export async function getDeliveryRoute(
  restaurantLat: number,
  restaurantLng: number,
  customerLat: number,
  customerLng: number,
): Promise<DeliveryRoute> {
  const key = cacheKey(restaurantLat, restaurantLng, customerLat, customerLng);
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt && cached.data.primary) {
    return cached.data.primary;
  }

  const url =
    `https://router.project-osrm.org/route/v1/driving/${restaurantLng},${restaurantLat};${customerLng},${customerLat}?overview=full&geometries=geojson&steps=false&alternatives=false`;

  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

  if (!response.ok) {
    throw new Error(`OSRM returned ${response.status}`);
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  const route = data.routes[0];
  const geometry = route.geometry;

  if (!geometry || !geometry.coordinates || geometry.coordinates.length < 2) {
    throw new Error('Route geometry is empty or invalid');
  }

  const coordinates: [number, number][] = geometry.coordinates.map(
    (coord: number[]) => [coord[1], coord[0]],
  );

  const distanceKm = Math.round((route.distance / 1000) * 100) / 100;
  const durationMinutes = Math.ceil(route.duration / 60);

  const result: DeliveryRoute = { coordinates, distanceKm, durationMinutes };

  const routesResult: DeliveryRoutesResult = {
    primary: result,
    alternatives: [],
    all: [{ ...result, index: 0, isPrimary: true }],
    status: 'partial',
  };
  cache.set(key, { data: routesResult, expiresAt: Date.now() + CACHE_TTL_MS });

  return result;
}
