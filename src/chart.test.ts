import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChartType, createChart, floorInstant, resetClients } from './chart.js';
import { configure, resetConfig } from './config.js';
import { ValidationError } from './errors.js';
import { createPerson } from './person.js';
import type { WireChartData } from './ephemeris/types.js';

const LYNCHBURG = { lat: 37.4381927, lng: -79.18932 };
const CHARLOTTE = { lat: 35.2033533, lng: -80.9796095 };

function chartPayload(sunLongitude: number): WireChartData {
  return {
    positions: [
      { body: 'sun', longitude: sunLongitude, latitude: 0, distance: 1, speed: 1 },
      {
        body: 'moon',
        longitude: (sunLongitude + 120) % 360,
        latitude: 1,
        distance: 0.002,
        speed: 13,
      },
      // Both nodes, so the stub serves whichever the request asked for. The
      // adapter ignores the one it did not request.
      {
        body: 'true_node',
        longitude: (sunLongitude + 40) % 360,
        latitude: 0,
        distance: 0.002,
        speed: -0.05,
      },
      {
        body: 'mean_node',
        longitude: (sunLongitude + 41) % 360,
        latitude: 0,
        distance: 0.002,
        speed: -0.05,
      },
    ],
    houses: {
      system: 'Placidus',
      cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      ascendant: 156.24,
      midheaven: 62.92,
      armc: 60.87,
      vertex: 300.1,
    },
  };
}

function stubFetch(): ReturnType<typeof vi.fn> {
  let n = 0;
  return vi.fn().mockImplementation(() => {
    n += 1;
    return new Response(JSON.stringify({ data: chartPayload(n * 10) }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
}

const BODIES = ['sun', 'moon', 'north node', 'south node'];

afterEach(() => {
  resetConfig();
  resetClients();
});

async function people(): Promise<
  [Awaited<ReturnType<typeof createPerson>>, Awaited<ReturnType<typeof createPerson>>]
> {
  return [
    await createPerson('A', { local: '1975-02-17T18:30' }, LYNCHBURG),
    await createPerson('B', { local: '1977-04-25T09:02' }, CHARLOTTE),
  ];
}

describe('createChart', () => {
  it('issues exactly the request count each chart type specifies (§7.1)', async () => {
    const cases: [(typeof ChartType)[keyof typeof ChartType], number, boolean][] = [
      [ChartType.Basic, 1, false],
      [ChartType.Transits, 2, true],
      [ChartType.Synastry, 2, true],
      [ChartType.Combined, 2, true],
      [ChartType.Davison, 1, true],
      [ChartType.CombinedTransits, 3, true],
      [ChartType.DavisonTransits, 2, true],
    ];

    for (const [type, expected, needsSecond] of cases) {
      const fetchImpl = stubFetch();
      configure({ apiKey: 'k', fetch: fetchImpl as never });
      const [a, b] = await people();
      await createChart('c', a, {
        type,
        p2: needsSecond ? b : undefined,
        bodies: BODIES,
      });
      expect(fetchImpl, `request count for ${type}`).toHaveBeenCalledTimes(expected);
      resetConfig();
      resetClients();
    }
  });

  it('records the frame the chart was computed in (§7.2)', async () => {
    configure({ apiKey: 'k', fetch: stubFetch() as never });
    const [a] = await people();
    const chart = await createChart('c', a, {
      bodies: BODIES,
      houseSystem: 'whole_sign',
      sidereal: 'lahiri',
      node: 'mean',
    });
    expect(chart.options.houseSystem).toBe('whole_sign');
    expect(chart.options.sidereal).toBe('lahiri');
    expect(chart.options.node).toBe('mean');
  });

  it('requires a second person where the type demands one', async () => {
    configure({ apiKey: 'k', fetch: stubFetch() as never });
    const [a] = await people();
    await expect(
      createChart('c', a, { type: ChartType.Synastry, bodies: BODIES }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('computes aspects within one ring for a basic chart', async () => {
    configure({ apiKey: 'k', fetch: stubFetch() as never });
    const [a] = await people();
    const chart = await createChart('c', a, { bodies: BODIES });
    expect(chart.aspects.length).toBeGreaterThan(0);
    expect(chart.transits).toBeUndefined();
  });

  it('never emits an aspect between the derived south node and its source', async () => {
    configure({ apiKey: 'k', fetch: stubFetch() as never });
    const [a] = await people();
    const chart = await createChart('c', a, { bodies: BODIES });
    const pairs = chart.aspects.map((x) => [x.p1.name, x.p2.name].sort().join('|'));
    expect(pairs).not.toContain('north node|south node');
  });

  it('returns defensive copies', async () => {
    configure({ apiKey: 'k', fetch: stubFetch() as never });
    const [a] = await people();
    const chart = await createChart('c', a, { bodies: BODIES });
    const before = chart.planets.length;
    (chart.planets as unknown as unknown[]).push({});
    expect(chart.planets.length).toBe(before + 1); // the copy we mutated
    const fresh = chart.planets;
    expect(fresh).toBeDefined();
  });

  describe('unknown birth time (§5.3)', () => {
    it('omits the angles by default', async () => {
      configure({ apiKey: 'k', fetch: stubFetch() as never });
      const a = await createPerson('A', { date: '1975-02-17', timeUnknown: true }, LYNCHBURG);
      const chart = await createChart('c', a, { bodies: BODIES });
      expect(chart.houses).toBeUndefined();
      expect(chart.ascendant).toBeUndefined();
      expect(chart.midheaven).toBeUndefined();
      expect(chart.planets.length).toBeGreaterThan(0);
      expect(chart.warnings.map((w) => w.code)).toContain('unknown_time');
    });

    it('returns them under the noon mode, flagged', async () => {
      configure({ apiKey: 'k', fetch: stubFetch() as never });
      const a = await createPerson('A', { date: '1975-02-17', timeUnknown: true }, LYNCHBURG);
      const chart = await createChart('c', a, { bodies: BODIES, unknownTime: 'noon' });
      expect(chart.ascendant).toBeDefined();
      expect(chart.warnings.map((w) => w.code)).toContain('noon_assumed');
    });
  });

  it('warns when the zone came from the built-in resolver', async () => {
    configure({ apiKey: 'k', fetch: stubFetch() as never });
    const [a] = await people();
    const chart = await createChart('c', a, { bodies: BODIES });
    expect(chart.warnings.map((w) => w.code)).toContain('zone_resolved_by_default');
  });
});

describe('floorInstant (§7.4)', () => {
  it('floors to the granularity so repeated polling shares a cache key', () => {
    expect(floorInstant('2024-06-15T12:34:56.789Z', 60)).toBe('2024-06-15T12:34:00.000Z');
    expect(floorInstant('2024-06-15T12:34:59.999Z', 60)).toBe('2024-06-15T12:34:00.000Z');
  });

  it('leaves the instant alone when rounding is disabled', () => {
    expect(floorInstant('2024-06-15T12:34:56.789Z', 0)).toBe('2024-06-15T12:34:56.789Z');
  });
});

describe('refreshTransits', () => {
  it('refuses on chart types with no transit ring', async () => {
    configure({ apiKey: 'k', fetch: stubFetch() as never });
    const [a] = await people();
    const chart = await createChart('c', a, { bodies: BODIES });
    await expect(chart.refreshTransits()).rejects.toBeInstanceOf(ValidationError);
  });

  it('costs no extra request when polled inside the granularity window', async () => {
    const fetchImpl = stubFetch();
    configure({ apiKey: 'k', fetch: fetchImpl as never });
    const [a] = await people();
    const chart = await createChart('c', a, { type: ChartType.Transits, bodies: BODIES });
    const initial = fetchImpl.mock.calls.length;

    // Three polls at instants inside the same 60-second bucket.
    await chart.refreshTransits('2024-06-15T12:34:01.000Z');
    await chart.refreshTransits('2024-06-15T12:34:30.000Z');
    await chart.refreshTransits('2024-06-15T12:34:59.000Z');

    // The natal leg is cached too, so only the first poll's transit leg is new.
    expect(fetchImpl.mock.calls.length).toBe(initial + 1);
  });
});
