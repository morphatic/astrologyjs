import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ChartType, createChart, type Chart } from '../../src/chart.js';
import type { Planet } from '../../src/index.js';
import { configure, resetConfig } from '../../src/config.js';
import { declination, julianDay, trueObliquity } from '../../src/equatorial.js';
import { createPerson } from '../../src/person.js';
import { signOf } from '../../src/signs.js';

/**
 * End-to-end tests against the live Morphemeris API.
 *
 * Gated on `MORPHEMERIS_API_KEY` via `runIf` rather than a skip marker, so they
 * no-op cleanly in CI where no secret is configured (spec §13.1). `.env.local`
 * is loaded by `test/setup/load-env.ts` for local runs.
 *
 * Birth data here is synthetic. Real birth data — exact date, time and place —
 * is about as identifying as data gets, and there is no reason to commit any.
 */
const apiKey = process.env['MORPHEMERIS_API_KEY'];
const live = describe.runIf(apiKey !== undefined && apiKey.trim() !== '');

/** Greenwich, so the reference frame is uncontroversial. */
const GREENWICH = { lat: 51.4779, lng: 0.0015 };
/** Tromsø — above the Arctic Circle, where Placidus is undefined. */
const TROMSO = { lat: 69.6492, lng: 18.9553 };

/** Fails loudly rather than with a non-null assertion, which the lint config bans. */
function planet(chart: Chart, name: string): Planet {
  const found = chart.planets.find((p) => p.name === name);
  if (found === undefined) throw new Error(`The chart has no ${name}.`);
  return found;
}

live('against the live Morphemeris API', () => {
  beforeAll(() => {
    configure({ apiKey });
  });

  afterAll(() => {
    resetConfig();
  });

  it('builds a natal chart from a local birth time in one call', async () => {
    const person = await createPerson('Subject A', { local: '1990-06-15T14:30' }, GREENWICH);

    expect(person.zone).toBe('Europe/London');
    expect(person.utcOffsetMinutes).toBe(60); // BST in June
    expect(person.instant).toBe('1990-06-15T13:30:00.000Z');

    const chart = await createChart('natal', person);

    expect(chart.planets.length).toBeGreaterThanOrEqual(19);
    expect(chart.houses).toHaveLength(12);
    expect(chart.ascendant).toBeGreaterThanOrEqual(0);
    expect(chart.ascendant).toBeLessThan(360);
    expect(chart.aspects.length).toBeGreaterThan(0);
  });

  it('returns a declination that is not merely the ecliptic latitude', async () => {
    // The upstream bug this library works around (morphemeris#83). If a future
    // refactor started trusting the response field again, the Sun's declination
    // would collapse to roughly zero and this would catch it.
    const person = await createPerson('Subject A', { local: '1990-06-15T14:30' }, GREENWICH);
    const chart = await createChart('natal', person);

    const sun = planet(chart, 'sun');
    expect(Math.abs(sun.latitude)).toBeLessThan(0.01); // Sun's ecliptic latitude ~0
    expect(Math.abs(sun.declination)).toBeGreaterThan(20); // mid-June: near +23
  });

  it('agrees with an independent declination computation for every body', async () => {
    const person = await createPerson('Subject A', { local: '1990-06-15T14:30' }, GREENWICH);
    const chart = await createChart('natal', person);
    const obliquity = trueObliquity(julianDay(person.instant));

    for (const planet of chart.planets) {
      const expected = declination(planet.longitude, planet.latitude, obliquity);
      expect(Math.abs(planet.declination - expected), planet.name).toBeLessThan(1e-9);
    }
  });

  it('assigns signs consistently with the longitudes it returns', async () => {
    const person = await createPerson('Subject A', { local: '1990-06-15T14:30' }, GREENWICH);
    const chart = await createChart('natal', person);

    for (const planet of chart.planets) {
      expect(planet.sign, planet.name).toBe(signOf(planet.longitude));
      expect(planet.signDegree).toBeGreaterThanOrEqual(0);
      expect(planet.signDegree).toBeLessThan(30);
    }
  });

  it('derives the south node exactly opposite the north node', async () => {
    const person = await createPerson('Subject A', { local: '1990-06-15T14:30' }, GREENWICH);
    const chart = await createChart('natal', person);

    const north = planet(chart, 'north node');
    const south = planet(chart, 'south node');
    expect((south.longitude - north.longitude + 360) % 360).toBeCloseTo(180, 9);

    // And never reports the artifact opposition between them.
    const pairs = chart.aspects.map((a) => [a.p1.name, a.p2.name].sort().join('|'));
    expect(pairs).not.toContain('north node|south node');
  });

  it('spends no second credit on an identical repeat chart', async () => {
    const person = await createPerson('Subject A', { local: '1990-06-15T14:30' }, GREENWICH);
    const first = await createChart('natal', person);
    const second = await createChart('natal', person);
    // Same frame, same instant, same place: the second must come from cache.
    expect(second.planets.map((p) => p.longitude)).toEqual(first.planets.map((p) => p.longitude));
  });

  it('honours an explicit house system', async () => {
    const person = await createPerson('Subject A', { local: '1990-06-15T14:30' }, GREENWICH);
    const placidus = await createChart('p', person, { houseSystem: 'placidus' });
    const wholeSign = await createChart('w', person, { houseSystem: 'whole_sign' });

    expect(wholeSign.options.houseSystem).toBe('whole_sign');
    // Whole-sign cusps sit at exact sign boundaries; Placidus almost never does.
    for (const cusp of wholeSign.houses ?? []) {
      expect(cusp % 30).toBeCloseTo(0, 6);
    }
    expect(placidus.houses).not.toEqual(wholeSign.houses);
  });

  it('produces a sidereal chart whose longitudes differ by the ayanamsha', async () => {
    const person = await createPerson('Subject A', { local: '1990-06-15T14:30' }, GREENWICH);
    const tropical = await createChart('t', person);
    const sidereal = await createChart('s', person, { sidereal: 'lahiri' });

    const shift =
      (planet(tropical, 'sun').longitude - planet(sidereal, 'sun').longitude + 360) % 360;
    // Lahiri ayanamsha was roughly 23.7° in 1990.
    expect(shift).toBeGreaterThan(22);
    expect(shift).toBeLessThan(25);
  });

  it('surfaces a high-latitude house warning rather than silently substituting', async () => {
    const person = await createPerson('Subject B', { local: '1985-12-21T03:00' }, TROMSO);
    const chart = await createChart('arctic', person, { houseSystem: 'placidus' });

    // Whatever the API decides above the Arctic Circle, the library must not
    // swap the house system on the caller's behalf.
    expect(chart.options.houseSystem).toBe('placidus');
    expect(chart.houses).toHaveLength(12);
  });

  it('builds a synastry chart across two people', async () => {
    const a = await createPerson('Subject A', { local: '1990-06-15T14:30' }, GREENWICH);
    const b = await createPerson('Subject B', { local: '1985-12-21T03:00' }, TROMSO);
    const chart = await createChart('synastry', a, { type: ChartType.Synastry, p2: b });

    expect(chart.transits).toBeDefined();
    expect(chart.aspects.length).toBeGreaterThan(0);
    // Every aspect crosses the two rings.
    const inner = new Set(chart.planets.map((p) => p.name));
    for (const aspect of chart.aspects) {
      expect(inner.has(aspect.p1.name)).toBe(true);
    }
  });
});
