import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { separation } from '../../src/aspects.js';
import { ChartType, createChart, type Chart } from '../../src/chart.js';
import { configure, resetConfig } from '../../src/config.js';
import { createPerson, type Person } from '../../src/person.js';
import {
  MAJOR_NAMES,
  PLANETS,
  pairKey,
  serverAspects,
  serverComposite,
  serverDavison,
  serverEquatorial,
} from './morphemeris.js';

/**
 * Cross-checks the library's local computation against Morphemeris's
 * server-side equivalents.
 *
 * These are the strongest tests in the suite. Aspects, midpoints and
 * declinations are computed here in TypeScript and there in Rust, by different
 * people from different sources, and the two must agree. A unit test can only
 * confirm the code does what its author intended; this confirms the intent was
 * right.
 *
 * Scope note: both sides read the same ephemeris at the same instant, so this
 * validates *geometry*, not planetary positions. Positions are the one thing
 * the library never computes.
 */
const apiKey = process.env['MORPHEMERIS_API_KEY'];
const live = describe.runIf(apiKey !== undefined && apiKey.trim() !== '');

const PLANET_NAMES: readonly string[] = PLANETS;

const A = { instant: '1990-06-15T13:30:00Z', lat: 51.4779, lng: 0.0015 };
const B = { instant: '1985-12-21T02:00:00Z', lat: 69.6492, lng: 18.9553 };

live('cross-checked against Morphemeris server-side computation', () => {
  let personA: Person;
  let personB: Person;

  beforeAll(async () => {
    configure({ apiKey });
    personA = await createPerson('A', { utc: A.instant }, { lat: A.lat, lng: A.lng });
    personB = await createPerson('B', { utc: B.instant }, { lat: B.lat, lng: B.lng });
  });

  afterAll(() => {
    resetConfig();
  });

  /** Only the ten classical bodies, so both sides consider the same pairs. */
  const natalA = async (): Promise<Chart> =>
    createChart('cross-check', personA, { bodies: [...PLANETS] });

  it('finds exactly the same major aspects the server finds', async () => {
    const [chart, server] = await Promise.all([natalA(), serverAspects(A.instant)]);

    const majorNames = new Set(Object.values(MAJOR_NAMES));
    const mine = chart.aspects.filter((a) => majorNames.has(a.type));
    const theirs = server.aspects;

    const mineKeys = mine.map((a) => `${pairKey(a.p1.name, a.p2.name)}:${a.type}`).sort();
    const theirKeys = theirs
      .map((a) => `${pairKey(a.body_a, a.body_b)}:${MAJOR_NAMES[a.aspect] ?? a.aspect}`)
      .sort();

    expect(mineKeys).toEqual(theirKeys);
    expect(mineKeys.length).toBeGreaterThan(5); // guards against two empty lists agreeing
  });

  it('agrees with the server on separation and orb for every aspect', async () => {
    const [chart, server] = await Promise.all([natalA(), serverAspects(A.instant)]);

    const byPair = new Map(chart.aspects.map((a) => [pairKey(a.p1.name, a.p2.name), a]));

    for (const record of server.aspects) {
      const key = pairKey(record.body_a, record.body_b);
      const mine = byPair.get(key);
      expect(mine, key).toBeDefined();
      if (mine === undefined) continue;

      // `orb` is distance from exactness on both sides. This is the assertion
      // that 1.x would have failed: it reported the fractional part of the
      // separation, so a trine at 118.5° gave 0.5 rather than 1.5.
      expect(Math.abs(mine.orb - record.orb), `${key} orb`).toBeLessThan(1e-6);
      expect(
        Math.abs(separation(mine.p1.longitude, mine.p2.longitude) - record.angle),
        `${key} separation`,
      ).toBeLessThan(1e-6);
    }
  });

  it('agrees with the server on which aspects are applying', async () => {
    const [chart, server] = await Promise.all([natalA(), serverAspects(A.instant)]);
    const byPair = new Map(chart.aspects.map((a) => [pairKey(a.p1.name, a.p2.name), a]));

    for (const record of server.aspects) {
      if (record.applying === undefined) continue;
      const mine = byPair.get(pairKey(record.body_a, record.body_b));
      if (mine === undefined) continue;
      expect(mine.applying, `${record.body_a}-${record.body_b} ${record.aspect}`).toBe(
        record.applying,
      );
    }
  });

  it('agrees with the server’s equatorial output on declination, to a tenth of an arcsecond', async () => {
    // The strongest check on the local conversion: the same instant computed
    // in the equatorial frame upstream, which is a different code path from
    // the ecliptic mode whose `declination` field is wrong (morphemeris#83).
    //
    // The tolerance is the documented accuracy of the abbreviated four-term
    // nutation series, 0.1" — deliberately the model's bound and not the
    // residual measured at one epoch, which is how the previous version of
    // this comparison ended up asserting something that only held in 1974.
    // Observed here: 0.014". With mean obliquity instead of true it would be
    // 5.4", and up to 9" at other epochs (§6.5).
    const [chart, server] = await Promise.all([
      natalA(),
      serverEquatorial(A.instant, { lat: A.lat, lng: A.lng }),
    ]);

    const mine = new Map(chart.planets.map((p) => [p.name, p.declination]));
    expect(server.positions.length).toBe(PLANET_NAMES.length);

    for (const position of server.positions) {
      const ours = mine.get(position.body);
      expect(ours, position.body).toBeDefined();
      if (ours === undefined) continue;
      expect(Math.abs(ours - position.declination), `${position.body} declination`).toBeLessThan(
        0.1 / 3600,
      );
    }
  });

  it('computes the same composite midpoints the server does', async () => {
    const [chart, server] = await Promise.all([
      createChart('composite', personA, {
        type: ChartType.Combined,
        p2: personB,
        bodies: [...PLANETS],
      }),
      serverComposite(A, B),
    ]);

    const mine = new Map(chart.planets.map((p) => [p.name, p.longitude]));
    expect(server.positions.length).toBe(PLANET_NAMES.length);

    for (const position of server.positions) {
      const ours = mine.get(position.body);
      expect(ours, position.body).toBeDefined();
      if (ours === undefined) continue;
      // Both take the shorter arc. The Sun in this pair is 184.96° apart, so
      // the two conventions give answers 180° apart — a naive average would
      // fail here, which is the point of the fixture.
      expect(Math.abs(ours - position.midpoint_longitude), position.body).toBeLessThan(1e-6);
    }
  });

  it('computes the same Davison chart the server does', async () => {
    const [chart, server] = await Promise.all([
      createChart('davison', personA, {
        type: ChartType.Davison,
        p2: personB,
        bodies: [...PLANETS],
      }),
      serverDavison(A, B),
    ]);

    const mine = new Map(chart.planets.map((p) => [p.name, p]));

    for (const position of server.positions) {
      const ours = mine.get(position.body);
      expect(ours, position.body).toBeDefined();
      if (ours === undefined) continue;
      // A Davison chart is cast at the time-space midpoint, so agreement here
      // tests `instantMidpoint` and `geoMidpoint` together: disagree on either
      // and the fast bodies move visibly.
      expect(Math.abs(ours.longitude - position.longitude), position.body).toBeLessThan(1e-6);
    }
  });
});
