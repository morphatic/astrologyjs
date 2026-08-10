import { describe, expect, it } from 'vitest';

import { declination, isOutOfBounds, julianDay, meanObliquity } from './equatorial.js';

describe('julianDay', () => {
  it('returns the standard epoch for J2000.0', () => {
    // 2000-01-01T12:00:00Z is JD 2451545.0 by definition.
    expect(julianDay('2000-01-01T12:00:00Z')).toBeCloseTo(2451545.0, 6);
  });

  it('advances by exactly one per day', () => {
    const a = julianDay('2024-03-15T00:00:00Z');
    const b = julianDay('2024-03-16T00:00:00Z');
    expect(b - a).toBeCloseTo(1, 9);
  });
});

describe('meanObliquity', () => {
  it('is 23.4392911 degrees at J2000.0', () => {
    expect(meanObliquity(2451545.0)).toBeCloseTo(23.4392911, 6);
  });

  it('decreases with time, as the actual obliquity does', () => {
    expect(meanObliquity(julianDay('2100-01-01T00:00:00Z'))).toBeLessThan(
      meanObliquity(julianDay('1900-01-01T00:00:00Z')),
    );
  });

  it('is about 23.4427 degrees in early 1974', () => {
    expect(meanObliquity(julianDay('1974-02-17T23:30:00Z'))).toBeCloseTo(23.4427, 3);
  });
});

describe('declination', () => {
  const OBLIQUITY = 23.4392911;

  it('is zero at the equinoxes, where the ecliptic crosses the equator', () => {
    expect(declination(0, 0, OBLIQUITY)).toBeCloseTo(0, 9);
    expect(declination(180, 0, OBLIQUITY)).toBeCloseTo(0, 9);
  });

  it('reaches +obliquity at the summer solstice point and -obliquity at the winter one', () => {
    expect(declination(90, 0, OBLIQUITY)).toBeCloseTo(OBLIQUITY, 9);
    expect(declination(270, 0, OBLIQUITY)).toBeCloseTo(-OBLIQUITY, 9);
  });

  it('is not merely a copy of ecliptic latitude — the upstream bug this replaces', () => {
    // The API returns latitude in the declination slot. A body with zero
    // ecliptic latitude still has a large declination away from the equinoxes.
    expect(Math.abs(declination(90, 0, OBLIQUITY))).toBeGreaterThan(20);
  });

  describe('against the API’s own equatorial=true output for 1974-02-17T23:30:00Z', () => {
    // Ecliptic longitude/latitude from POST /v1/chart; expected declination from
    // POST /v1/positions with equatorial=true, which is correct upstream.
    // Tolerance is 0.0005° (1.8 arcseconds). The residual is nutation in
    // obliquity — we use mean obliquity, the engine uses true — and measures
    // 0.497" worst case. Chart output is displayed in arcminutes (0.0167°), so
    // this sits well below the resolution anyone can see.
    const TOLERANCE = 0.0005;
    const cases = [
      { body: 'sun', lon: 328.9288483757996, lat: -0.00002959947384742615, expected: -11.848277 },
      { body: 'moon', lon: 282.376739, lat: 1.370274, expected: -21.50192 },
      { body: 'saturn', lon: 87.876187, lat: -0.907421, expected: 22.518147 },
      { body: 'pallas', lon: 289.56962, lat: 28.398472, expected: 6.119595 },
    ] as const;

    const eps = meanObliquity(julianDay('1974-02-17T23:30:00Z'));

    for (const { body, lon, lat, expected } of cases) {
      it(`matches for ${body}`, () => {
        expect(Math.abs(declination(lon, lat, eps) - expected)).toBeLessThan(TOLERANCE);
      });
    }
  });
});

describe('isOutOfBounds', () => {
  it('is true only beyond the obliquity of the ecliptic', () => {
    expect(isOutOfBounds(24, 23.4392911)).toBe(true);
    expect(isOutOfBounds(-24, 23.4392911)).toBe(true);
    expect(isOutOfBounds(23, 23.4392911)).toBe(false);
    expect(isOutOfBounds(0, 23.4392911)).toBe(false);
  });

  it('does not flag Pallas, which the upstream out_of_bounds flag got wrong', () => {
    // Upstream compared ecliptic latitude (28.4°) against obliquity and said
    // out of bounds. Pallas's actual declination on that date was 6.1°.
    const eps = meanObliquity(julianDay('1974-02-17T23:30:00Z'));
    const dec = declination(289.56962, 28.398472, eps);
    expect(isOutOfBounds(dec, eps)).toBe(false);
  });
});
