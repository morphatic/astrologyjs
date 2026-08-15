/**
 * IANA zone resolution from coordinates.
 *
 * The built-in resolver is `tz-lookup`: 152 KB, zero dependencies, and the same
 * code in Node and the browser. It is a compressed approximation accurate to a
 * few kilometers, so near a zone border it can return the wrong zone — which
 * would be a wrong offset, the failure this library exists to prevent.
 *
 * Three mitigations, all in the contract (§5.2): the resolver is replaceable,
 * an explicit zone bypasses lookup entirely, and the resolved zone is always
 * readable on the `Person` so a wrong answer is detectable rather than silent.
 * A Node caller who needs polygon-exact borders can drop in `geo-tz` without
 * every browser user paying its 73 MB.
 */
import tzlookup from 'tz-lookup';

import { ValidationError } from '../errors.js';
import type { ZoneResolver } from '../config.js';

export interface GeoPoint {
  readonly lat: number;
  readonly lng: number;
}

export interface ZoneResolution {
  readonly zone: string;
  /** True when the built-in resolver supplied the zone, driving a warning. */
  readonly fromDefaultResolver: boolean;
}

export interface ZoneResolutionOptions {
  /** An explicit zone, which beats every form of lookup. */
  readonly zone?: string | undefined;
  readonly zoneResolver?: ZoneResolver | undefined;
}

/** The bundled `tz-lookup` resolver. */
export function defaultZoneResolver(lat: number, lng: number): string {
  return tzlookup(lat, lng);
}

function assertValidCoordinates(point: GeoPoint): void {
  if (!Number.isFinite(point.lat) || point.lat < -90 || point.lat > 90) {
    throw new ValidationError(`Latitude must be between -90 and 90; received ${String(point.lat)}`);
  }
  if (!Number.isFinite(point.lng) || point.lng < -180 || point.lng > 180) {
    throw new ValidationError(
      `Longitude must be between -180 and 180; received ${String(point.lng)}`,
    );
  }
}

function assertUsableZone(zone: string): void {
  if (zone.trim() === '') {
    throw new ValidationError('Zone resolver returned an empty zone name');
  }
  try {
    // Constructing a formatter is the cheapest way to ask the platform whether
    // it knows the zone. An unknown zone throws RangeError.
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
  } catch {
    throw new ValidationError(
      `Unknown IANA time zone: ${JSON.stringify(zone)}. ` +
        'The library will not fall back to UTC, which would shift every chart.',
    );
  }
}

/**
 * Resolves the IANA zone for a point.
 *
 * Precedence is explicit zone, then a caller-supplied resolver, then the
 * built-in one. Never falls back to UTC: a wrong zone that looks plausible is
 * worse than a refusal.
 */
export function resolveZone(point: GeoPoint, options: ZoneResolutionOptions): ZoneResolution {
  if (options.zone !== undefined && options.zone.trim() !== '') {
    assertUsableZone(options.zone);
    return { zone: options.zone, fromDefaultResolver: false };
  }

  assertValidCoordinates(point);

  if (options.zoneResolver !== undefined) {
    const zone = options.zoneResolver(point.lat, point.lng);
    assertUsableZone(zone);
    return { zone, fromDefaultResolver: false };
  }

  const zone = defaultZoneResolver(point.lat, point.lng);
  assertUsableZone(zone);
  return { zone, fromDefaultResolver: true };
}
