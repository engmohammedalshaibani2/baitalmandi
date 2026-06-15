export interface DeliveryRoute {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
}

interface CacheEntry {
  data: DeliveryRoute;
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

export async function getDeliveryRoute(
  restaurantLat: number,
  restaurantLng: number,
  customerLat: number,
  customerLng: number,
): Promise<DeliveryRoute> {
  const key = cacheKey(restaurantLat, restaurantLng, customerLat, customerLng);
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
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

  cache.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

  return result;
}
