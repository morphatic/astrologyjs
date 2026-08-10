/**
 * Zodiac sign assignment.
 *
 * Sign and degree-within-sign are always computed here, never read from the API
 * response — the API returns them for tropical output only, so deriving them
 * locally gives one code path that is correct in both tropical and sidereal
 * frames. See spec §6.4.
 */

/** The twelve tropical signs, in order from the vernal point. */
export const SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const;

export type SignName = (typeof SIGNS)[number];

const DEGREES_PER_SIGN = 360 / SIGNS.length;

/**
 * Wraps an ecliptic longitude into `[0, 360)`.
 *
 * Wraps rather than throwing: longitudes arrive from arithmetic (midpoints,
 * derivations, progressions) that legitimately overshoots the circle, and a
 * wrapped value is always the intended one.
 */
export function normalizeLongitude(longitude: number): number {
  const wrapped = longitude % 360;
  if (wrapped >= 0) return wrapped;
  const shifted = wrapped + 360;
  // For a tiny negative input the sum rounds up to exactly 360 in float64 —
  // `-5e-324 + 360 === 360` — which would put the value outside [0, 360) and
  // report Aries as Pisces. Found by property test, not by inspection.
  return shifted >= 360 ? 0 : shifted;
}

/** The sign a given ecliptic longitude falls in. */
export function signOf(longitude: number): SignName {
  const index = Math.floor(normalizeLongitude(longitude) / DEGREES_PER_SIGN);
  // `index` is in [0, 11] because normalizeLongitude bounds its input, but
  // noUncheckedIndexedAccess cannot know that.
  return SIGNS[index] ?? 'aries';
}

/** Position within the sign, in `[0, 30)`. */
export function signDegree(longitude: number): number {
  return normalizeLongitude(longitude) % DEGREES_PER_SIGN;
}
