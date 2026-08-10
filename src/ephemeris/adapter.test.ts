import { describe, expect, it } from 'vitest';

import { AdapterError } from '../errors.js';
import { adaptChart, applyDerivations } from './adapter.js';
import type { AdaptedPlanet } from './adapter.js';
import type { WireBodyPosition, WireChartData } from './types.js';

function wire(overrides: Partial<WireChartData> = {}): WireChartData {
  return {
    positions: [
      {
        body: 'sun',
        longitude: 328.9288483757996,
        latitude: -0.00002959947384742615,
        distance: 0.9883320728277193,
        speed: 1.0091756274327963,
        // The API also sends sign, sign_degree, declination and out_of_bounds.
        // The adapter must ignore all four — declination is upstream-wrong.
        sign: 'aquarius',
        sign_degree: 28.92884837579959,
        declination: -0.00002959947384742615,
        out_of_bounds: false,
      },
      {
        body: 'true_node',
        longitude: 266.806626,
        latitude: 0,
        distance: 0.002,
        speed: -0.041911,
      },
    ],
    houses: {
      system: 'Placidus',
      cusps: [
        156.24, 180.77, 209.98, 242.92, 276.68, 308.18, 336.24, 0.77, 29.98, 62.92, 96.68, 128.18,
      ],
      ascendant: 156.24,
      midheaven: 62.92,
      armc: 60.87,
      vertex: 300.1,
    },
    ...overrides,
  };
}

const CONTEXT = { instant: '1974-02-17T23:30:00.000Z', node: 'true' as const };

/** Finds a planet or fails the test — avoids non-null assertions in expectations. */
function planet(data: { planets: readonly AdaptedPlanet[] }, name: string): AdaptedPlanet {
  const found = data.planets.find((p) => p.name === name);
  if (found === undefined) throw new Error(`no planet named ${name}`);
  return found;
}

/** A wire response whose first position is patched. */
function wireWithSun(patch: Partial<WireBodyPosition>): WireChartData {
  const base = wire();
  const [sun, ...rest] = base.positions;
  if (sun === undefined) throw new Error('fixture has no positions');
  return { ...base, positions: [{ ...sun, ...patch }, ...rest] };
}

describe('adaptChart', () => {
  it('maps the fields the contract says it maps', () => {
    const result = adaptChart(wire(), { ...CONTEXT, requestedBodies: ['sun', 'north node'] });
    const sun = planet(result, 'sun');
    expect(sun.longitude).toBeCloseTo(328.9288483757996, 9);
    expect(sun.speed).toBeCloseTo(1.0091756274327963, 9);
    expect(sun.distance).toBeCloseTo(0.9883320728277193, 9);
  });

  it('renames the API body identifier back to the library name', () => {
    const result = adaptChart(wire(), { ...CONTEXT, requestedBodies: ['north node'] });
    expect(result.planets.map((p) => p.name)).toContain('north node');
    expect(result.planets.map((p) => p.name)).not.toContain('true_node');
  });

  it('derives declination rather than trusting the response (§6.5)', () => {
    // The wire declination is -0.00003 (it is ecliptic latitude). The true
    // value is about -11.85. Reading the field would ship a wrong number.
    const result = adaptChart(wire(), { ...CONTEXT, requestedBodies: ['sun'] });
    const sun = planet(result, 'sun');
    expect(sun.declination).toBeLessThan(-11);
    expect(sun.declination).toBeGreaterThan(-12);
  });

  it('computes sign locally rather than reading it', () => {
    // Corrupt the response's sign. The adapter must not care.
    const w = wireWithSun({ sign: 'capricorn' });
    const result = adaptChart(w, { ...CONTEXT, requestedBodies: ['sun'] });
    expect(planet(result, 'sun').sign).toBe('aquarius');
  });

  it('maps the angles and cusps', () => {
    const result = adaptChart(wire(), { ...CONTEXT, requestedBodies: ['sun'] });
    expect(result.houses).toHaveLength(12);
    expect(result.ascendant).toBeCloseTo(156.24, 6);
    expect(result.midheaven).toBeCloseTo(62.92, 6);
    expect(result.vertex).toBeCloseTo(300.1, 6);
  });

  it('passes the API high-latitude house warning through (§10.4)', () => {
    const w = wire();
    w.houses.warnings = ['Placidus is undefined above the polar circle; fallback applied'];
    const result = adaptChart(w, { ...CONTEXT, requestedBodies: ['sun'] });
    expect(result.warnings.map((x) => x.code)).toContain('high_latitude_houses');
  });

  describe('invariants that must throw rather than degrade', () => {
    it('throws when a requested body is missing from the response', () => {
      expect(() => adaptChart(wire(), { ...CONTEXT, requestedBodies: ['sun', 'mars'] })).toThrow(
        AdapterError,
      );
      expect(() => adaptChart(wire(), { ...CONTEXT, requestedBodies: ['sun', 'mars'] })).toThrow(
        /mars/,
      );
    });

    it('throws when a position has no speed', () => {
      // Accepting this would make isRetrograde() false for every body and
      // invert every applying/separating determination, silently.
      const w = wireWithSun({ speed: undefined });
      expect(() => adaptChart(w, { ...CONTEXT, requestedBodies: ['sun'] })).toThrow(AdapterError);
      expect(() => adaptChart(w, { ...CONTEXT, requestedBodies: ['sun'] })).toThrow(/speed/i);
    });

    it('throws on an out-of-range longitude rather than clamping it', () => {
      const w = wireWithSun({ longitude: 400 });
      expect(() => adaptChart(w, { ...CONTEXT, requestedBodies: ['sun'] })).toThrow(AdapterError);
    });

    it('throws when the cusp array is not twelve long', () => {
      const base = wire();
      const w = { ...base, houses: { ...base.houses, cusps: [1, 2, 3] } };
      expect(() => adaptChart(w, { ...CONTEXT, requestedBodies: ['sun'] })).toThrow(AdapterError);
    });
  });
});

describe('applyDerivations', () => {
  it('derives the south node exactly opposite the north node', () => {
    const adapted = adaptChart(wire(), { ...CONTEXT, requestedBodies: ['north node'] });
    const withDerived = applyDerivations(adapted, ['north node', 'south node']);
    const north = planet(withDerived, 'north node');
    const south = planet(withDerived, 'south node');
    expect((south.longitude - north.longitude + 360) % 360).toBeCloseTo(180, 9);
    expect(south.latitude).toBeCloseTo(-north.latitude, 9);
    expect(south.declination).toBeCloseTo(-north.declination, 9);
    expect(south.speed).toBeCloseTo(north.speed, 9);
  });

  it('marks the derived body as derived and names its source', () => {
    const adapted = adaptChart(wire(), { ...CONTEXT, requestedBodies: ['north node'] });
    const south = applyDerivations(adapted, ['south node']).planets.find(
      (p) => p.name === 'south node',
    );
    expect(south?.derived).toBe(true);
    expect(south?.derivedFrom).toBe('north node');
  });

  it('omits the source body when the caller did not ask for it', () => {
    const adapted = adaptChart(wire(), { ...CONTEXT, requestedBodies: ['north node'] });
    const names = applyDerivations(adapted, ['south node']).planets.map((p) => p.name);
    expect(names).toContain('south node');
    expect(names).not.toContain('north node');
  });
});
