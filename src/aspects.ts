/**
 * Aspect calculation.
 *
 * Two 1.x defects are fixed here and both are load-bearing:
 *
 * - `orb` is the angular distance from exactness. 1.x computed the fractional
 *   part of the separation, so a trine at 118.5° reported 0.5 rather than 1.5.
 *   Astrologers read orb as an aspect's strength, so the error silently
 *   misrepresents which aspects in a chart matter.
 * - Absence of an aspect is a value, not an exception. 1.x threw for the
 *   ordinary case of two planets not in aspect — most pairs in every chart —
 *   and the caller swallowed it, making genuine faults invisible.
 *
 * See spec §8.
 */
import type { AdaptedPlanet } from './ephemeris/adapter.js';
import { normalizeLongitude } from './signs.js';

export interface AspectType {
  readonly name: string;
  /** Exact angle in degrees. */
  readonly angle: number;
  /** Maximum deviation from exactness at which the aspect is recognized. */
  readonly orb: number;
  readonly major: boolean;
}

/**
 * The catalogue, carried forward from 1.x unchanged (rationale Appendix B).
 *
 * Data, not code: adding an entry is a minor release (§1.6). No two ranges
 * currently overlap, which is why 1.x's last-match-wins loop happened to work;
 * {@link findAspect} does not rely on that remaining true.
 */
export const ASPECTS: readonly AspectType[] = [
  { name: 'conjunct', angle: 0, orb: 6, major: true },
  { name: 'semisextile', angle: 30, orb: 3, major: false },
  { name: 'decile', angle: 36, orb: 1.5, major: false },
  { name: 'novile', angle: 40, orb: 1.9, major: false },
  { name: 'semisquare', angle: 45, orb: 3, major: false },
  { name: 'septile', angle: 51.417, orb: 2, major: false },
  { name: 'sextile', angle: 60, orb: 6, major: true },
  { name: 'quintile', angle: 72, orb: 2, major: false },
  { name: 'bilin', angle: 75, orb: 0.9, major: false },
  { name: 'binovile', angle: 80, orb: 2, major: false },
  { name: 'square', angle: 90, orb: 6, major: true },
  { name: 'biseptile', angle: 102.851, orb: 2, major: false },
  { name: 'tredecile', angle: 108, orb: 2, major: false },
  { name: 'trine', angle: 120, orb: 6, major: true },
  { name: 'sesquiquadrate', angle: 135, orb: 3, major: false },
  { name: 'biquintile', angle: 144, orb: 2, major: false },
  { name: 'inconjunct', angle: 150, orb: 3, major: false },
  { name: 'treseptile', angle: 154.284, orb: 1.1, major: false },
  { name: 'tetranovile', angle: 160, orb: 3, major: false },
  { name: 'tao', angle: 165, orb: 1.5, major: false },
  { name: 'opposition', angle: 180, orb: 6, major: true },
];

export interface Aspect {
  readonly p1: AdaptedPlanet;
  readonly p2: AdaptedPlanet;
  readonly type: string;
  /** The exact angle of the aspect type, in degrees. */
  readonly angle: number;
  /** Angular distance from exactness, in degrees. Never negative. */
  readonly orb: number;
  readonly applying: boolean;
  readonly major: boolean;
}

/** The shorter arc between two longitudes, in `[0, 180]`. */
export function separation(a: number, b: number): number {
  const diff = Math.abs(normalizeLongitude(a) - normalizeLongitude(b));
  return diff > 180 ? 360 - diff : diff;
}

/**
 * The aspect between two bodies, or `undefined` when they are not in aspect.
 *
 * Chooses the catalogue entry closest to exactness among those in range. 1.x
 * took the last match in iteration order, which is correct only while no two
 * orb ranges overlap — a property no future edit to the catalogue guarantees.
 */
export function findAspect(p1: AdaptedPlanet, p2: AdaptedPlanet): Aspect | undefined {
  const sep = separation(p1.longitude, p2.longitude);

  let best: AspectType | undefined;
  let bestOrb = Number.POSITIVE_INFINITY;
  for (const type of ASPECTS) {
    const orb = Math.abs(sep - type.angle);
    if (orb <= type.orb && orb < bestOrb) {
      best = type;
      bestOrb = orb;
    }
  }
  if (best === undefined) return undefined;

  return {
    p1,
    p2,
    type: best.name,
    angle: best.angle,
    orb: bestOrb,
    applying: isApplying(p1, p2, sep, best.angle),
    major: best.major,
  };
}

/**
 * Whether the aspect is closing rather than separating.
 *
 * Determined by asking what the separation would be a short time later: if it
 * moves toward the exact angle, the aspect is applying. This handles retrograde
 * motion and aspects spanning 0° Aries without special cases, which is where
 * 1.x's nested boolean condition became unreadable.
 */
function isApplying(p1: AdaptedPlanet, p2: AdaptedPlanet, sep: number, angle: number): boolean {
  const dt = 1 / 1440; // one minute, in days
  const later = separation(p1.longitude + p1.speed * dt, p2.longitude + p2.speed * dt);
  return Math.abs(later - angle) < Math.abs(sep - angle);
}

/** Whether one body was derived from the other. */
function isDerivedPair(a: AdaptedPlanet, b: AdaptedPlanet): boolean {
  return a.derivedFrom === b.name || b.derivedFrom === a.name;
}

/**
 * Every aspect within one set of bodies.
 *
 * Each unordered pair is considered once. A derived body never aspects its own
 * source: a derived south node sits exactly 180° from its north node by
 * construction, so an unfiltered engine reports a perfect opposition with orb
 * zero in every chart ever produced, sorted to the top of the list. That is an
 * artifact of the derivation, not an observation about the sky (§8.3).
 */
export function aspectsWithin(planets: readonly AdaptedPlanet[]): Aspect[] {
  const aspects: Aspect[] = [];
  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const a = planets[i];
      const b = planets[j];
      if (a === undefined || b === undefined) continue;
      if (isDerivedPair(a, b)) continue;
      const aspect = findAspect(a, b);
      if (aspect !== undefined) aspects.push(aspect);
    }
  }
  return aspects;
}

/** Every aspect between two sets of bodies — the two-ring case. */
export function aspectsBetween(
  inner: readonly AdaptedPlanet[],
  outer: readonly AdaptedPlanet[],
): Aspect[] {
  const aspects: Aspect[] = [];
  for (const a of inner) {
    for (const b of outer) {
      if (isDerivedPair(a, b)) continue;
      const aspect = findAspect(a, b);
      if (aspect !== undefined) aspects.push(aspect);
    }
  }
  return aspects;
}
