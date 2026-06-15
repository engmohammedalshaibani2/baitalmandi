import fs from 'fs';
import path from 'path';
import { centroid } from '@turf/turf';
import { SanaMapResolver } from './resolve-location';

export interface SanaaDistrict {
  id: string;
  nameAr: string;
  nameEn: string;
  adminLevel: number;
  areaKm2: number;
  feature: any;
  centroid: [number, number];
}

let cachedGeoJSON: any = null;
let cachedResolver: SanaMapResolver | null = null;
let cachedDistricts: SanaaDistrict[] | null = null;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function loadFromDisk(): void {
  const filePath = path.join(
    process.cwd(),
    'sanaa-map-integration',
    'sanaa-map-integration',
    'sanaa_districts.geojson',
  );
  const raw = fs.readFileSync(filePath, 'utf-8');
  cachedGeoJSON = JSON.parse(raw);

  cachedResolver = new SanaMapResolver(cachedGeoJSON);

  cachedDistricts = cachedGeoJSON.features.map((f: any) => {
    const p = f.properties;
    const coords = f.geometry.coordinates;
    const feat: any = {
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: coords },
      properties: {},
    };

    const id = p.id || slugify(p.name_en || p.name_ar || 'unknown');

    const poly = { type: 'Polygon', coordinates: coords } as any;
    const c = centroid(poly);

    return {
      id,
      nameAr: p.name_ar || 'غير معروفة',
      nameEn: p.name_en || 'Unknown',
      adminLevel: p.admin_level ?? 6,
      areaKm2: p.area_km2 ?? 0,
      feature: feat,
      centroid: c.geometry.coordinates as [number, number],
    };
  });
}

export function getGeoJSON(): any {
  if (!cachedGeoJSON) loadFromDisk();
  return cachedGeoJSON;
}

export function getResolver(): SanaMapResolver {
  if (!cachedResolver) loadFromDisk();
  return cachedResolver!;
}

export function getDistricts(): SanaaDistrict[] {
  if (!cachedDistricts) loadFromDisk();
  return cachedDistricts!;
}

export function invalidateCache(): void {
  cachedGeoJSON = null;
  cachedResolver = null;
  cachedDistricts = null;
}
