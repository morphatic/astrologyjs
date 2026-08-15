/**
 * A deliberately dumb HTTP client for the live cross-check suite.
 *
 * It shares no code with `src/ephemeris/client.ts` on purpose. The point of
 * these tests is to compare the library's local computation against an
 * independent implementation, and an oracle that reuses the code under test is
 * not an oracle.
 */
const BASE = process.env['MORPHEMERIS_BASE_URL'] ?? 'https://api.morphemeris.com';

export interface AspectRecord {
  readonly body_a: string;
  readonly body_b: string;
  readonly aspect: string;
  /** The actual separation, in degrees — not the aspect's exact angle. */
  readonly angle: number;
  /** Distance from exactness, in degrees. */
  readonly orb: number;
  readonly applying?: boolean;
}

export interface CompositePosition {
  readonly body: string;
  readonly midpoint_longitude: number;
}

export interface ChartPosition {
  readonly body: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly speed: number;
  readonly declination: number;
}

/**
 * The equatorial-mode shape, which is genuinely different.
 *
 * Before morphemeris#83 this response reused the `longitude`/`latitude` field
 * names from ecliptic mode, so one interface covered both. It now uses the
 * `right_ascension`/`declination` names its own spec defines, which is the
 * correct behavior and means the two shapes need separate types.
 */
export interface EquatorialPosition {
  readonly body: string;
  readonly right_ascension: number;
  readonly declination: number;
  readonly out_of_bounds: boolean;
}

/** The ten classical bodies, named identically on both sides of the comparison. */
export const PLANETS = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
] as const;

/**
 * The five major aspects, in Morphemeris's vocabulary.
 *
 * The two catalogues are not identical — Morphemeris has fifteen types, this
 * library twenty-one, and they disagree on names (`conjunction`/`conjunct`,
 * `quincunx`/`inconjunct`). Only the intersection can be cross-checked, and the
 * five majors are the part where both give a 6° orb, so a pinned `orb=6`
 * request makes the two aspect *sets* directly comparable rather than merely
 * overlapping.
 */
export const MAJORS = ['conjunction', 'sextile', 'square', 'trine', 'opposition'] as const;

/** Morphemeris aspect name → this library's name, for the majors. */
export const MAJOR_NAMES: Readonly<Record<string, string>> = {
  conjunction: 'conjunct',
  sextile: 'sextile',
  square: 'square',
  trine: 'trine',
  opposition: 'opposition',
};

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(path, BASE);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env['MORPHEMERIS_API_KEY'] ?? ''}` },
  });
  const payload: unknown = await response.json();
  if (!response.ok) {
    throw new Error(`${path} returned ${String(response.status)}: ${JSON.stringify(payload)}`);
  }
  return (payload as { data: T }).data;
}

export async function serverAspects(instant: string): Promise<{ aspects: AspectRecord[] }> {
  return get('/v1/aspects', {
    datetime: instant,
    bodies: PLANETS.join(','),
    aspects: MAJORS.join(','),
    orb: '6',
    applying: 'true',
  });
}

/**
 * Positions in the equatorial frame.
 *
 * The oracle for the library's local ecliptic-to-equatorial conversion, and an
 * independent implementation of it. Since morphemeris#83 this agrees with the
 * ecliptic mode's own `declination` field, but this remains the right thing to
 * compare against: it is the path the engine computes equatorially rather than
 * one it converts for presentation.
 */
export async function serverEquatorial(
  instant: string,
  place: { readonly lat: number; readonly lng: number },
): Promise<{ positions: EquatorialPosition[] }> {
  return get('/v1/chart', {
    datetime: instant,
    lat: String(place.lat),
    lon: String(place.lng),
    bodies: PLANETS.join(','),
    equatorial: 'true',
  });
}

/**
 * Positions in the default ecliptic frame — the response the library consumes.
 *
 * Fetched separately here because the library's adapter discards the wire
 * `declination` and `out_of_bounds` fields, so they cannot be reached through
 * a `Chart`.
 */
export async function serverEcliptic(
  instant: string,
  place: { readonly lat: number; readonly lng: number },
): Promise<{ positions: (ChartPosition & { out_of_bounds: boolean })[] }> {
  return get('/v1/chart', {
    datetime: instant,
    lat: String(place.lat),
    lon: String(place.lng),
    bodies: PLANETS.join(','),
  });
}

export async function serverComposite(
  a: { instant: string; lat: number; lng: number },
  b: { instant: string; lat: number; lng: number },
): Promise<{ positions: CompositePosition[] }> {
  return get('/v1/composite', {
    datetime_a: a.instant,
    lat_a: String(a.lat),
    lon_a: String(a.lng),
    datetime_b: b.instant,
    lat_b: String(b.lat),
    lon_b: String(b.lng),
    bodies: PLANETS.join(','),
    // Matches `longitudeMidpoint`, which takes the shorter arc (§7.1).
    resolution: 'nearest',
  });
}

export async function serverDavison(
  a: { instant: string; lat: number; lng: number },
  b: { instant: string; lat: number; lng: number },
): Promise<{ positions: ChartPosition[] }> {
  return get('/v1/davison', {
    datetime_a: a.instant,
    lat_a: String(a.lat),
    lon_a: String(a.lng),
    datetime_b: b.instant,
    lat_b: String(b.lat),
    lon_b: String(b.lng),
    bodies: PLANETS.join(','),
  });
}

/** A stable key for an unordered body pair, so two aspect lists can be compared as sets. */
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}
