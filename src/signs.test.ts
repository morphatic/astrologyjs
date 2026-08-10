import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { SIGNS, normalizeLongitude, signDegree, signOf } from './signs.js';

describe('normalizeLongitude', () => {
  it('wraps into [0, 360)', () => {
    expect(normalizeLongitude(0)).toBe(0);
    expect(normalizeLongitude(360)).toBe(0);
    expect(normalizeLongitude(370)).toBe(10);
    expect(normalizeLongitude(-10)).toBe(350);
    expect(normalizeLongitude(-370)).toBe(350);
  });

  it('always lands in [0, 360) for any finite input', () => {
    fc.assert(
      fc.property(fc.double({ min: -100_000, max: 100_000, noNaN: true }), (x) => {
        const n = normalizeLongitude(x);
        return n >= 0 && n < 360;
      }),
    );
  });
});

describe('signOf', () => {
  it('has twelve signs beginning at Aries', () => {
    expect(SIGNS).toHaveLength(12);
    expect(SIGNS[0]).toBe('aries');
    expect(SIGNS[11]).toBe('pisces');
  });

  it('places each 30-degree segment in the right sign', () => {
    expect(signOf(0)).toBe('aries');
    expect(signOf(29.999)).toBe('aries');
    expect(signOf(30)).toBe('taurus');
    expect(signOf(328.928848)).toBe('aquarius'); // Sun, 1974-02-17 — matches the API
    expect(signOf(359.99)).toBe('pisces');
  });

  it('wraps rather than throwing on out-of-range input', () => {
    expect(signOf(360)).toBe('aries');
    expect(signOf(-1)).toBe('pisces');
  });
});

describe('signDegree', () => {
  it('is the position within the sign, in [0, 30)', () => {
    expect(signDegree(0)).toBeCloseTo(0, 9);
    expect(signDegree(29.5)).toBeCloseTo(29.5, 9);
    expect(signDegree(30)).toBeCloseTo(0, 9);
    // Sun on 1974-02-17: API reported sign_degree 28.92884837579959.
    expect(signDegree(328.9288483757996)).toBeCloseTo(28.9288483757996, 9);
  });

  it('always lands in [0, 30) for any finite input', () => {
    fc.assert(
      fc.property(fc.double({ min: -100_000, max: 100_000, noNaN: true }), (x) => {
        const d = signDegree(x);
        return d >= 0 && d < 30;
      }),
    );
  });

  it('reconstructs the longitude when combined with the sign index', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 359.999999, noNaN: true }), (lon) => {
        const index = SIGNS.indexOf(signOf(lon));
        return Math.abs(index * 30 + signDegree(lon) - lon) < 1e-9;
      }),
    );
  });
});
