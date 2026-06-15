import { point, booleanPointInPolygon } from '@turf/turf';
import { getResolver, getGeoJSON } from './sanaa-boundaries';
import type { ResolveResult } from './resolve-location';

export interface ZoneResult {
  zoneId: string;
  zoneName: string;
  confidence: number;
  method: 'point-in-polygon' | 'edge-fallback' | 'nominatim';
  adminLevel: number;
  areaKm2: number;
  baseFee: number;
  perKmFee: number;
  maxDistanceKm: number;
  distanceToEdgeKm: number;
  distanceToCenterKm: number;
}

interface MemoEntry {
  result: ZoneResult;
  timestamp: number;
}

const TTL_MS = 24 * 60 * 60 * 1000;
const memoCache = new Map<string, MemoEntry>();
const MAX_CACHE = 5000;

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

function getCached(lat: number, lng: number): ZoneResult | null {
  const key = cacheKey(lat, lng);
  const entry = memoCache.get(key);
  if (entry && Date.now() - entry.timestamp < TTL_MS) {
    return entry.result;
  }
  memoCache.delete(key);
  return null;
}

function setCached(lat: number, lng: number, result: ZoneResult): void {
  const key = cacheKey(lat, lng);
  memoCache.set(key, { result, timestamp: Date.now() });
  if (memoCache.size > MAX_CACHE) {
    let oldestKey = '';
    let oldestTs = Infinity;
    for (const [k, v] of memoCache) {
      if (v.timestamp < oldestTs) {
        oldestTs = v.timestamp;
        oldestKey = k;
      }
    }
    if (oldestKey) memoCache.delete(oldestKey);
  }
}

function districtToZoneResult(district: any, confidence: number, method: ZoneResult['method']): ZoneResult {
  const p = district.properties;
  const id = p.id || p.name_en?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
  return {
    zoneId: id,
    zoneName: p.name_ar || 'غير معروفة',
    confidence,
    method,
    adminLevel: p.admin_level ?? 6,
    areaKm2: p.area_km2 ?? 0,
    baseFee: 700,
    perKmFee: 250,
    maxDistanceKm: 12,
    distanceToEdgeKm: 0,
    distanceToCenterKm: 0,
  };
}

function resolveToZoneResult(lat: number, lng: number): ZoneResult {
  const resolver = getResolver();
  const result: ResolveResult = resolver.resolveLocation(lat, lng);

  if (!result.district) {
    return {
      zoneId: 'unknown',
      zoneName: 'غير معروفة',
      confidence: 0,
      method: 'edge-fallback',
      adminLevel: 0,
      areaKm2: 0,
      baseFee: 500,
      perKmFee: 200,
      maxDistanceKm: 10,
      distanceToEdgeKm: 0,
      distanceToCenterKm: 0,
    };
  }

  const numericConfidence =
    result.confidence === 'high' ? 0.99
    : result.confidence === 'medium' ? 0.8
    : 0.5;

  return districtToZoneResult(result.district, numericConfidence, 'point-in-polygon');
}

async function nominatimReverse(lat: number, lng: number): Promise<ZoneResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=10&accept-language=ar`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BaitalMandiwibApp/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.address) return null;

    const addr = data.address;
    const queryText = [
      addr.suburb,
      addr.neighbourhood,
      addr.city_district,
      addr.city,
      addr.state_district,
      addr.state,
    ].filter(Boolean).join(' ');

    if (!queryText) return null;

    const geojson = getGeoJSON();
    const pt = point([lng, lat]);

    for (const f of geojson.features) {
      try {
        if (f.properties.area_km2 > 50) continue;
        if (booleanPointInPolygon(pt, f.geometry)) {
          return districtToZoneResult(f, 0.85, 'nominatim');
        }
      } catch { continue; }
    }

    const words = queryText.toLowerCase();
    for (const f of geojson.features) {
      if (words.includes((f.properties.name_ar || '').toLowerCase())) {
        return districtToZoneResult(f, 0.7, 'nominatim');
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function resolveZone(lat: number, lng: number): ZoneResult {
  const cached = getCached(lat, lng);
  if (cached) return cached;

  const result = resolveToZoneResult(lat, lng);
  setCached(lat, lng, result);
  return result;
}

export async function resolveZoneWithFallback(
  lat: number,
  lng: number,
): Promise<ZoneResult> {
  const cached = getCached(lat, lng);
  if (cached) return cached;

  const result = resolveToZoneResult(lat, lng);

  if (result.zoneId !== 'unknown' && result.confidence >= 0.7) {
    setCached(lat, lng, result);
    return result;
  }

  const nomResult = await nominatimReverse(lat, lng);
  if (nomResult) {
    setCached(lat, lng, nomResult);
    return nomResult;
  }

  setCached(lat, lng, result);
  return result;
}
