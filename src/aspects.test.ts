import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { ASPECTS, aspectsWithin, findAspect, separation } from './aspects.js';
import type { AdaptedPlanet } from './ephemeris/adapter.js';

function body(name: string, longitude: number, speed = 1): AdaptedPlanet {
  return {
    name,
    longitude,
    latitude: 0,
    speed,
    distance: 1,
    declination: 0,
    outOfBounds: false,
    sign: 'aries',
    signDegree: 0,
    derived: false,
  };
}

describe('separation', () => {
  it('is the shorter arc, always in [0, 180]', () => {
    expect(separation(10, 20)).toBeCloseTo(10, 9);
    expect(separation(350, 10)).toBeCloseTo(20, 9);
    expect(separation(0, 180)).toBeCloseTo(180, 9);
    expect(separation(0, 200)).toBeCloseTo(160, 9);
  });

  it('is symmetric and bounded for any pair of longitudes', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 359.999, noNaN: true }),
        fc.double({ min: 0, max: 359.999, noNaN: true }),
        (a, b) => {
          const s = separation(a, b);
          return s >= 0 && s <= 180 && Math.abs(s - separation(b, a)) < 1e-9;
        },
      ),
    );
  });
});

describe('the aspect catalogue', () => {
  it('has the twenty-one types from Appendix B', () => {
    expect(ASPECTS).toHaveLength(21);
  });

  it('marks exactly the five Ptolemaic aspects major', () => {
    expect(
      ASPECTS.filter((a) => a.major)
        .map((a) => a.name)
        .sort(),
    ).toEqual(['conjunct', 'opposition', 'sextile', 'square', 'trine'].sort());
  });
});

describe('findAspect', () => {
  it('returns undefined when the pair is not in aspect, rather than throwing', () => {
    // 1.x threw here — for most pairs in every chart — and the caller caught
    // and discarded it, which made real faults indistinguishable from routine.
    expect(findAspect(body('moon', 105.1), body('mars', 236.5))).toBeUndefined();
  });

  it('reports orb as the distance from exactness, not the fractional part', () => {
    // The 1.x bug: it computed `separation % 1`, so a trine at 118.5° reported
    // 0.5 instead of 1.5. Every non-integer separation was wrong.
    const aspect = findAspect(body('sun', 0), body('jupiter', 118.5));
    expect(aspect?.type).toBe('trine');
    expect(aspect?.orb).toBeCloseTo(1.5, 9);
  });

  it('reports a zero orb for an exact aspect', () => {
    expect(findAspect(body('sun', 0), body('moon', 120))?.orb).toBeCloseTo(0, 9);
  });

  it('finds aspects across 0° Aries', () => {
    // 358° and 3° are 5° apart — inside the 6° conjunction orb, and only
    // reachable if the shorter arc is taken across the boundary.
    const aspect = findAspect(body('sun', 358), body('moon', 3));
    expect(aspect?.type).toBe('conjunct');
    expect(aspect?.orb).toBeCloseTo(5, 9);
  });

  it('does not invent an aspect for a pair merely near the boundary', () => {
    // 355° and 5° are 10° apart, outside every orb in the catalogue.
    expect(findAspect(body('sun', 355), body('moon', 5))).toBeUndefined();
  });

  it('chooses the closest type when more than one is in range', () => {
    // 1.x took the last match in iteration order, which is correct only by
    // accident of the current orb values.
    const aspect = findAspect(body('a', 0), body('b', 30.4));
    expect(aspect?.type).toBe('semisextile');
    expect(aspect?.orb).toBeCloseTo(0.4, 9);
  });

  it('never reports an orb wider than the type allows', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 359.999, noNaN: true }),
        fc.double({ min: 0, max: 359.999, noNaN: true }),
        (a, b) => {
          const aspect = findAspect(body('a', a), body('b', b));
          if (aspect === undefined) return true;
          const def = ASPECTS.find((x) => x.name === aspect.type);
          return def !== undefined && aspect.orb <= def.orb + 1e-9;
        },
      ),
    );
  });

  describe('applying and separating', () => {
    it('is applying when the faster body is closing on the aspect', () => {
      // Moon at 118°, Sun at 0°: the Moon is fast and approaching the trine.
      const aspect = findAspect(body('sun', 0, 1), body('moon', 118, 13));
      expect(aspect?.applying).toBe(true);
    });

    it('is separating when the faster body has passed exactness', () => {
      const aspect = findAspect(body('sun', 0, 1), body('moon', 122, 13));
      expect(aspect?.applying).toBe(false);
    });

    it('inverts when the faster body is retrograde', () => {
      const direct = findAspect(body('sun', 0, 1), body('mars', 118, 3));
      const retro = findAspect(body('sun', 0, 1), body('mars', 118, -3));
      expect(direct?.applying).not.toBe(retro?.applying);
    });
  });
});

describe('aspectsWithin', () => {
  it('considers each unordered pair exactly once and never self-pairs', () => {
    const planets = [body('sun', 0), body('moon', 120), body('mars', 240)];
    const aspects = aspectsWithin(planets);
    expect(aspects).toHaveLength(3);
    for (const a of aspects) expect(a.p1.name).not.toBe(a.p2.name);
  });

  it('excludes a derived body from aspecting its own source (§8.3)', () => {
    // A derived south node is 180° from the north node BY CONSTRUCTION. An
    // unfiltered engine reports a perfect opposition, orb 0, in every chart
    // ever produced, sorted to the top of the list. It is an artifact of the
    // derivation, not an observation about the sky.
    const north = body('north node', 100);
    const south: AdaptedPlanet = {
      ...body('south node', 280),
      derived: true,
      derivedFrom: 'north node',
    };
    const aspects = aspectsWithin([north, south]);
    expect(aspects).toHaveLength(0);
  });

  it('still lets a derived body aspect unrelated bodies', () => {
    const north = body('north node', 100);
    const south: AdaptedPlanet = {
      ...body('south node', 280),
      derived: true,
      derivedFrom: 'north node',
    };
    const sun = body('sun', 40);
    const names = aspectsWithin([north, south, sun]).map((a) => `${a.p1.name}|${a.p2.name}`);
    expect(names).toContain('north node|sun');
    expect(names).toContain('south node|sun');
    expect(names).not.toContain('north node|south node');
  });
});
