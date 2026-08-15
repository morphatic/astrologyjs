/**
 * Ecliptic-to-equatorial conversion.
 *
 * The library derives `declination` and `outOfBounds` here rather than reading
 * them from the API.
 *
 * The original reason was a bug: through 2026-08-15 the Morphemeris
 * `/v1/chart` response returned whatever occupied the `latitude` slot in its
 * `declination` field — ecliptic latitude, in the default ecliptic mode —
 * with errors reaching 23° across 20 bodies and the dependent `out_of_bounds`
 * flag inverting. That is fixed upstream (morphemeris#83); all three of the
 * API's declination paths now agree with this module.
 *
 * The derivation stays anyway, as §6.5 always said it would: it costs nothing,
 * it is verified against an independent implementation, and it is one less
 * thing to depend on. Reading the field back would trade a value this library
 * can prove for one it would have to trust.
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
 * This is *mean* obliquity: it omits nutation. Use {@link trueObliquity} for
 * anything that compares against a threshold.
 */
export function meanObliquity(jd: number): number {
  const t = (jd - J2000) / DAYS_PER_CENTURY;
  const arcseconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
  return 23 + (26 + arcseconds / 60) / 60;
}

/**
 * Nutation in obliquity Δε, in degrees, for a Julian Day.
 *
 * The four principal terms of the IAU 1980 series (Meeus, *Astronomical
 * Algorithms*, ch. 22), which reproduce the full 106-term expansion to about
 * 0.1 arcsecond — two orders of magnitude finer than the effect being
 * corrected for, and far beyond what a chart can display.
 *
 * The arguments are strictly functions of Terrestrial Time and we pass a UTC
 * Julian Day. The two differ by about 70 seconds, over which the fastest
 * argument here moves 4×10⁻⁵ degrees; the resulting error in Δε is under a
 * microarcsecond.
 */
export function nutationInObliquity(jd: number): number {
  const t = (jd - J2000) / DAYS_PER_CENTURY;

  /** Longitude of the ascending node of the Moon's mean orbit, in degrees. */
  const omega = 125.04452 - t * (1934.136261 - t * (0.0020708 + t / 450_000));
  /** Mean longitude of the Sun. */
  const sun = 280.4665 + 36_000.7698 * t;
  /** Mean longitude of the Moon. */
  const moon = 218.3165 + 481_267.8813 * t;

  const arcseconds =
    9.2 * Math.cos(omega * DEG) +
    0.57 * Math.cos(2 * sun * DEG) +
    0.1 * Math.cos(2 * moon * DEG) -
    0.09 * Math.cos(2 * omega * DEG);

  return arcseconds / 3600;
}

/**
 * True obliquity of the ecliptic ε = ε₀ + Δε, in degrees, for a Julian Day.
 *
 * This is the value to convert coordinates with. Nutation swings by nearly ±10
 * arcseconds over the 18.6-year cycle of the lunar node — invisible in a chart
 * printed to arcminutes, but decisive for {@link isOutOfBounds}, which is a
 * threshold comparison rather than a displayed quantity, and enough to put this
 * library measurably at odds with any engine that does the conversion properly.
 *
 * An earlier revision used mean obliquity and claimed agreement with the
 * upstream engine "to within 1 arcsecond". That number came from a single test
 * epoch — 1974-02-17, where Δε happens to be −0.5" — and did not generalize:
 * at 1990-06-15 the same comparison is off by 5.4".
 */
export function trueObliquity(jd: number): number {
  return meanObliquity(jd) + nutationInObliquity(jd);
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
