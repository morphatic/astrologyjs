import { describe, expect, it } from 'vitest';

import { declination, julianDay, meanObliquity } from './equatorial.js';

/**
 * Records the precision the local derivation actually achieves against the
 * API's own `equatorial=true` output, so the claim in the spec's Definition of
 * Done is measured rather than asserted.
 *
 * The residual is nutation in obliquity: this uses mean obliquity, the engine
 * uses true. It is bounded by roughly ±9 arcseconds by construction.
 */
describe('declination precision against the API oracle', () => {
  const EPOCH = '1974-02-17T23:30:00Z';
  const eps = meanObliquity(julianDay(EPOCH));

  const cases = [
    { body: 'sun', lon: 328.9288483757996, lat: -0.00002959947384742615, api: -11.848277085569032 },
    { body: 'moon', lon: 282.376739, lat: 1.370274, api: -21.50191961499825 },
    { body: 'saturn', lon: 87.876187, lat: -0.907421, api: 22.518146939373995 },
    { body: 'pallas', lon: 289.56962, lat: 28.398472, api: 6.119595047020675 },
  ] as const;

  it('agrees to within one arcsecond on every body', () => {
    // Measured worst case at the time of writing: 0.497 arcseconds, on Pallas.
    // The bound is 1" to leave headroom for ephemeris revisions upstream; a
    // regression past that means the obliquity model, not rounding.
    const deltas = cases.map(({ lon, lat, api }) => Math.abs(declination(lon, lat, eps) - api));
    const worstArcseconds = Math.max(...deltas) * 3600;
    expect(worstArcseconds).toBeLessThan(1);
  });

  it('agrees far inside the arcminute that charts actually display', () => {
    for (const { lon, lat, api } of cases) {
      expect(Math.abs(declination(lon, lat, eps) - api)).toBeLessThan(1 / 60);
    }
  });
});
