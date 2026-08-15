import { describe, expect, it } from 'vitest';

import {
  declination,
  isOutOfBounds,
  julianDay,
  meanObliquity,
  nutationInObliquity,
  trueObliquity,
} from './equatorial.js';

/** Meeus, *Astronomical Algorithms*, Example 22.a — 1987 April 10.0 TD. */
const MEEUS_22A = {
  jd: 2446895.5,
  /** Δε, in arcseconds. */
  nutation: 9.443,
  /** ε₀ = 23°26'27.407". */
  mean: 23 + (26 + 27.407 / 60) / 60,
  /** ε = 23°26'36.850". */
  true: 23 + (26 + 36.85 / 60) / 60,
};

const ARCSEC = 1 / 3600;

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

  it('matches Meeus’s worked example to the arcsecond', () => {
    expect(Math.abs(meanObliquity(MEEUS_22A.jd) - MEEUS_22A.mean)).toBeLessThan(0.1 * ARCSEC);
  });
});

describe('nutationInObliquity', () => {
  it('matches Meeus’s worked example', () => {
    // The abbreviated four-term series is good to about 0.1", against the full
    // 106-term IAU 1980 expansion Meeus used to get 9.443".
    expect(nutationInObliquity(MEEUS_22A.jd) * 3600).toBeCloseTo(MEEUS_22A.nutation, 1);
  });

  it('swings across the 18.6-year node cycle, bounded by the series amplitudes', () => {
    let min = Infinity;
    let max = -Infinity;
    // One full cycle of the Moon's ascending node, sampled every 30 days.
    for (let jd = 2451545.0; jd < 2451545.0 + 6800; jd += 30) {
      const arcseconds = nutationInObliquity(jd) * 3600;
      min = Math.min(min, arcseconds);
      max = Math.max(max, arcseconds);
    }
    // The 9.20" node term dominates, so the swing must clear ±9"...
    expect(max).toBeGreaterThan(9);
    expect(min).toBeLessThan(-9);
    // ...and can never exceed the sum of the four amplitudes, 9.96". Meeus's
    // own worked example gives 9.443", so any tighter bound than this is wrong.
    expect(max).toBeLessThan(9.96);
    expect(min).toBeGreaterThan(-9.96);
  });
});

describe('trueObliquity', () => {
  it('matches Meeus’s worked example', () => {
    expect(Math.abs(trueObliquity(MEEUS_22A.jd) - MEEUS_22A.true)).toBeLessThan(0.1 * ARCSEC);
  });

  it('is the mean obliquity plus the nutation in obliquity', () => {
    const jd = julianDay('1990-06-15T13:30:00Z');
    expect(trueObliquity(jd)).toBeCloseTo(meanObliquity(jd) + nutationInObliquity(jd), 12);
  });

  it('departs from the mean by up to 9 arcseconds, which the mean value cannot express', () => {
    // The reason this exists. Nutation is small enough to be invisible in a
    // chart printed to arcminutes, but `isOutOfBounds` is a threshold
    // comparison, and 9" is decisive for a body sitting on the boundary.
    const jd = julianDay('2006-09-01T00:00:00Z'); // near a nutation extreme
    expect(Math.abs(trueObliquity(jd) - meanObliquity(jd))).toBeGreaterThan(8 * ARCSEC);
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
    //
    // Tolerance is a hundredth of an arcsecond. It used to be 1.8", justified
    // by a measured worst case of 0.497" — but that measurement was taken only
    // at this epoch, where nutation in obliquity happens to be −0.5", and it
    // did not generalize: at 1990-06-15 the same comparison was off by 5.4".
    // Using true obliquity removes the term rather than tolerating it (§6.5).
    //
    // Every value below is full float64 as returned by the API. The previous
    // table was transcribed to six digits, and the truncation was not harmless:
    // Pallas's latitude lost 0.2", which lands almost 1:1 in its declination
    // and looked exactly like a residual modelling error.
    const TOLERANCE = 0.01 * ARCSEC;
    const cases = [
      {
        body: 'sun',
        lon: 328.9288483757996,
        lat: -0.00002959947384742615,
        expected: -11.848277085569032,
      },
      {
        body: 'moon',
        lon: 282.3767381128411,
        lat: 1.370262095316694,
        expected: -21.50191961499825,
      },
      {
        body: 'saturn',
        lon: 87.87618737683162,
        lat: -0.9074205509464015,
        expected: 22.518146939373995,
      },
      // High ecliptic latitude, where the conversion does the most work and the
      // upstream `out_of_bounds` flag inverted.
      {
        body: 'pallas',
        lon: 289.5696764853796,
        lat: 28.398415398926275,
        expected: 6.119595047020675,
      },
      {
        body: 'pluto',
        lon: 186.3944066710445,
        lat: 17.0382856199889,
        expected: 13.088932630233588,
      },
      {
        body: 'chiron',
        lon: 17.57224389975558,
        lat: 1.0758512025375098,
        expected: 7.8923806555838585,
      },
    ] as const;

    const eps = trueObliquity(julianDay('1974-02-17T23:30:00Z'));

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
    const eps = trueObliquity(julianDay('1974-02-17T23:30:00Z'));
    const dec = declination(289.5696764853796, 28.398415398926275, eps);
    expect(isOutOfBounds(dec, eps)).toBe(false);
  });
});
