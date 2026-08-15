/**
 * Midpoint arithmetic for combined and Davison charts.
 *
 * Ported from 1.x, where these three functions were correct — they are among
 * the few pieces of that codebase that survive the port unchanged in substance.
 */
import { normalizeLongitude } from './signs.js';
import type { GeoPoint } from './time/zone.js';

const DEG = Math.PI / 180;

export interface LongitudeMidpoint {
  readonly longitude: number;
  /**
   * True when the inputs are exactly 180° apart and the midpoint is therefore
   * genuinely ambiguous — two answers are equally correct.
   */
  readonly antipodal: boolean;
}

/**
 * The midpoint of two ecliptic longitudes, taken along the shorter arc.
 *
 * When the two are exactly opposite, both midpoints are equally valid. The
 * contract requires resolving to the ascending arc from the lower longitude and
 * recording a warning rather than choosing silently (§7.1).
 */
export function longitudeMidpoint(a: number, b: number): LongitudeMidpoint {
  const l1 = normalizeLongitude(a);
  const l2 = normalizeLongitude(b);
  if (l1 === l2) return { longitude: l1, antipodal: false };

  const high = Math.max(l1, l2);
  const low = Math.min(l1, l2);
  const arc = high - low;

  if (Math.abs(arc - 180) < 1e-9) {
    return { longitude: normalizeLongitude(low + 90), antipodal: true };
  }
  if (arc < 180) {
    return { longitude: (high + low) / 2, antipodal: false };
  }
  return { longitude: normalizeLongitude((low + 360 - high) / 2 + high), antipodal: false };
}

/** The temporal midpoint of two instants, as an ISO 8601 string. */
export function instantMidpoint(a: string, b: string): string {
  const t1 = Date.parse(a);
  const t2 = Date.parse(b);
  if (t1 === t2) return new Date(t1).toISOString();
  return new Date(Math.min(t1, t2) + Math.abs(t2 - t1) / 2).toISOString();
}

/**
 * The great-circle midpoint of two coordinates.
 *
 * Ported from 1.x's `getGeoMidpoint`, which was correct.
 */
export function geoMidpoint(p1: GeoPoint, p2: GeoPoint): GeoPoint {
  const lat1 = p1.lat * DEG;
  const lng1 = p1.lng * DEG;
  const lat2 = p2.lat * DEG;
  const lng2 = p2.lng * DEG;

  const bx = Math.cos(lat2) * Math.cos(lng2 - lng1);
  const by = Math.cos(lat2) * Math.sin(lng2 - lng1);
  const lng3 = lng1 + Math.atan2(by, Math.cos(lat1) + bx);
  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) ** 2 + by ** 2),
  );

  // Wrap longitude into [-180, 180]; the atan2 sum can leave it just outside.
  const lngDegrees = ((((lng3 / DEG + 180) % 360) + 360) % 360) - 180;
  return { lat: lat3 / DEG, lng: lngDegrees };
}
