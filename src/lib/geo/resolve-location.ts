/**
 * Sana'a Map - ADVANCED LOCATION ENGINE (R-TREE + SNAP)
 * مستوى: Production / High Precision GIS Resolver
 *
 * الميزات:
 * - R-tree spatial indexing (fast candidate filtering)
 * - strict polygon containment
 * - boundary snapping (fix edge misclassification)
 * - overlap resolution engine
 * - deterministic (NO AI / NO scoring)
 */

import * as turf from "@turf/turf";
import RBush from "rbush";

type Feature = any;

interface BBoxItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  feature: Feature;
}

export interface ResolveResult {
  district: Feature | null;
  confidence: "high" | "medium" | "fallback";
  reason: string;
}

export class SanaMapResolver {
  private tree = new RBush<BBoxItem>();
  private features: Feature[] = [];

  constructor(geojson: any) {
    this.features = geojson.features;

    const items: BBoxItem[] = geojson.features.map((f: Feature) => {
      const bbox = turf.bbox(f);

      return {
        minX: bbox[0],
        minY: bbox[1],
        maxX: bbox[2],
        maxY: bbox[3],
        feature: f,
      };
    });

    this.tree.load(items);
  }

  resolveLocation(lat: number, lng: number): ResolveResult {
    const point = turf.point([lng, lat]);

    // =========================
    // 1. R-TREE SEARCH (FAST FILTER)
    // =========================
    const candidates = this.tree.search({
      minX: lng,
      minY: lat,
      maxX: lng,
      maxY: lat,
    });

    if (!candidates.length) {
      return {
        district: null,
        confidence: "fallback",
        reason: "No candidates in R-tree → outside known bounds",
      };
    }

    // =========================
    // 2. STRICT POINT-IN-POLYGON FILTER
    // =========================
    let matches: Feature[] = [];

    for (const c of candidates) {
      const f = c.feature;

      try {
        if (turf.booleanPointInPolygon(point, f)) {
          matches.push(f);
        }
      } catch {
        continue;
      }
    }

    // =========================
    // 3. SNAP TO NEAREST BOUNDARY IF NO MATCH
    // =========================
    if (matches.length === 0) {
      let nearest: Feature | null = null;
      let minDist = Infinity;

      for (const f of candidates.map((c) => c.feature)) {
        const line = turf.polygonToLine(f) as any;
        const snapped = turf.nearestPointOnLine(line, point);

        const dist = (snapped.properties as any)?.dist ?? 0;

        if (dist < minDist) {
          minDist = dist;
          nearest = f;
        }
      }

      return {
        district: nearest,
        confidence: "medium",
        reason: "Snapped to nearest boundary (no full containment match)",
      };
    }

    // =========================
    // 4. OVERLAP RESOLUTION (CRITICAL FIX)
    // =========================
    matches.sort(
      (a, b) =>
        (a.properties.area_km2 ?? 999999) -
        (b.properties.area_km2 ?? 999999),
    );

    // =========================
    // 5. HARD RULE: SABEEN OVERRIDE PROTECTION
    // =========================
    const sabain = matches.find(
      (m) => m.properties.name_ar === "السبعين",
    );

    if (sabain) {
      const hasSmaller = matches.some(
        (m) =>
          m.properties.name_ar !== "السبعين" &&
          (m.properties.area_km2 || 999999) <
            (sabain.properties.area_km2 || 999999),
      );

      if (hasSmaller) {
        const filtered = matches.filter(
          (m) => m.properties.name_ar !== "السبعين",
        );
        if (filtered.length > 0) {
          matches = filtered;
        }
      }
    }

    // =========================
    // 6. ADMIN LEVEL PRIORITY (STRICT, NO SCORING)
    // =========================
    const priority = [8, 6, 4];

    for (const level of priority) {
      const levelMatches = matches.filter(
        (m) => m.properties.admin_level === level,
      );

      if (levelMatches.length) {
        levelMatches.sort(
          (a, b) =>
            (a.properties.area_km2 ?? 999999) -
            (b.properties.area_km2 ?? 999999),
        );

        return {
          district: levelMatches[0],
          confidence: "high",
          reason: `R-tree + polygon match + admin_level=${level}`,
        };
      }
    }

    // =========================
    // 7. FINAL FALLBACK (ANY MATCH)
    // =========================
    return {
      district: matches[0],
      confidence: "high",
      reason: "Fallback smallest-area selection",
    };
  }
}
