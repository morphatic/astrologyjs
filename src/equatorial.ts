/**
 * Ecliptic-to-equatorial conversion.
 *
 * The library derives `declination` and `outOfBounds` here rather than reading
 * them from the API. As of 2026-08-10 the Morphemeris `/v1/chart` response
 * returns whatever occupies the `latitude` slot in its `declination` field —
 * ecliptic latitude, in the default ecliptic mode. Measured across 20 bodies
 * the error reached 23°, and the dependent `out_of_bounds` flag inverted.
 * Passing that through would be a plausible wrong number, which the contract's
 * governing principle forbids.
 *
 * See spec §6.5 and the rationale's "Why declination and out-of-bounds are
 * derived rather than read".
 */

const DEG = Math.PI / 180;

/** Julian Day number for J2000.0 (2000-01-01T12:00:00Z). */
const J2000 = 2451545.0;

/** Julian Day number of the Unix epoch (1970-01-01T00:00:00Z). */
const JD_UNIX_EPOCH = 2440587.5;

const MS_PER_DAY = 86_400_000;

/** Days in a Julian century. */
const DAYS_PER_CENTURY = 36525;

/**
 * Julian Day number for a UTC instant.
 *
 * @param instant - UTC instant as an ISO 8601 string.
 */
export function julianDay(instant: string): number {
  return Date.parse(instant) / MS_PER_DAY + JD_UNIX_EPOCH;
}

/**
 * Mean obliquity of the ecliptic, in degrees, for a Julian Day.
 *
 * The IAU 1980 / Laskar polynomial: 23°26'21.448" less 46.8150"T, with small
 * quadratic and cubic terms, where T is Julian centuries from J2000.0.
 *
 * This is *mean* obliquity — it omits nutation, which oscillates within about
 * ±9 arcseconds (0.0025°). Charts display arcminutes (0.0167°), so the omission
 * sits below the resolution of any output the caller sees.
 */
export function meanObliquity(jd: number): number {
  const t = (jd - J2000) / DAYS_PER_CENTURY;
  const arcseconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
  return 23 + (26 + arcseconds / 60) / 60;
}

/**
 * Declination in degrees, from ecliptic coordinates.
 *
 * `sin δ = sin β cos ε + cos β sin ε sin λ`
 *
 * @param longitude - Ecliptic longitude λ in degrees.
 * @param latitude - Ecliptic latitude β in degrees.
 * @param obliquity - Obliquity of the ecliptic ε in degrees, for the instant.
 */
export function declination(longitude: number, latitude: number, obliquity: number): number {
  const lambda = longitude * DEG;
  const beta = latitude * DEG;
  const epsilon = obliquity * DEG;
  const sinDelta =
    Math.sin(beta) * Math.cos(epsilon) + Math.cos(beta) * Math.sin(epsilon) * Math.sin(lambda);
  return Math.asin(Math.min(1, Math.max(-1, sinDelta))) / DEG;
}

/**
 * Whether a body is "out of bounds" — beyond the Sun's declination extremes.
 *
 * Astrologically meaningful, and the reason the upstream flag could not simply
 * be passed through: it compared ecliptic latitude against obliquity, which
 * flags bodies with high ecliptic latitude (Pallas at 28.4°, whose actual
 * declination was 6.1°) and misses bodies genuinely near the limit.
 */
export function isOutOfBounds(bodyDeclination: number, obliquity: number): boolean {
  return Math.abs(bodyDeclination) > obliquity;
}
