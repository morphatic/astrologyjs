import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { geoMidpoint, instantMidpoint, longitudeMidpoint } from './midpoints.js';

describe('longitudeMidpoint', () => {
  it('takes the shorter arc', () => {
    // Ported from 1.x, whose implementation of this was correct.
    expect(longitudeMidpoint(10, 20).longitude).toBeCloseTo(15, 9);
    expect(longitudeMidpoint(0, 180).longitude).toBeCloseTo(90, 9);
    expect(longitudeMidpoint(350, 10).longitude).toBeCloseTo(0, 9);
    expect(longitudeMidpoint(350, 20).longitude).toBeCloseTo(5, 9);
    expect(longitudeMidpoint(340, 10).longitude).toBeCloseTo(355, 9);
    expect(longitudeMidpoint(10, 10).longitude).toBeCloseTo(10, 9);
  });

  it('is commutative', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 359.999, noNaN: true }),
        fc.double({ min: 0, max: 359.999, noNaN: true }),
        (a, b) =>
          Math.abs(longitudeMidpoint(a, b).longitude - longitudeMidpoint(b, a).longitude) < 1e-9,
      ),
    );
  });

  it('always lands within 90 degrees of both inputs', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 359.999, noNaN: true }),
        fc.double({ min: 0, max: 359.999, noNaN: true }),
        (a, b) => {
          const m = longitudeMidpoint(a, b).longitude;
          const arc = (x: number, y: number): number => {
            const d = Math.abs(x - y);
            return d > 180 ? 360 - d : d;
          };
          return arc(m, a) <= 90.000001 && arc(m, b) <= 90.000001;
        },
      ),
    );
  });

  it('flags the antipodal case, where the midpoint is genuinely undefined', () => {
    // Two points exactly 180° apart have two equally valid midpoints. §7.1
    // requires resolving to the ascending arc and recording a warning rather
    // than picking silently.
    const result = longitudeMidpoint(0, 180);
    expect(result.antipodal).toBe(true);
    const ordinary = longitudeMidpoint(10, 20);
    expect(ordinary.antipodal).toBe(false);
  });
});

describe('instantMidpoint', () => {
  it('is the temporal midpoint of two instants', () => {
    expect(instantMidpoint('2000-01-01T00:00:00.000Z', '2000-01-03T00:00:00.000Z')).toBe(
      '2000-01-02T00:00:00.000Z',
    );
  });

  it('returns the instant itself when both are equal', () => {
    expect(instantMidpoint('2000-01-01T00:00:00.000Z', '2000-01-01T00:00:00.000Z')).toBe(
      '2000-01-01T00:00:00.000Z',
    );
  });

  it('does not depend on argument order', () => {
    const a = '1974-02-17T22:30:00.000Z';
    const b = '1976-04-25T13:02:00.000Z';
    expect(instantMidpoint(a, b)).toBe(instantMidpoint(b, a));
  });
});

describe('geoMidpoint', () => {
  it('is the great-circle midpoint of two coordinates', () => {
    const m = geoMidpoint({ lat: 0, lng: 0 }, { lat: 0, lng: 90 });
    expect(m.lat).toBeCloseTo(0, 6);
    expect(m.lng).toBeCloseTo(45, 6);
  });

  it('returns the point itself when both are the same', () => {
    const m = geoMidpoint({ lat: 37.44, lng: -79.19 }, { lat: 37.44, lng: -79.19 });
    expect(m.lat).toBeCloseTo(37.44, 6);
    expect(m.lng).toBeCloseTo(-79.19, 6);
  });

  it('produces coordinates inside the valid range', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -89, max: 89, noNaN: true }),
        fc.double({ min: -179, max: 179, noNaN: true }),
        fc.double({ min: -89, max: 89, noNaN: true }),
        fc.double({ min: -179, max: 179, noNaN: true }),
        (lat1, lng1, lat2, lng2) => {
          const m = geoMidpoint({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 });
          return m.lat >= -90 && m.lat <= 90 && m.lng >= -180 && m.lng <= 180;
        },
      ),
    );
  });
});
