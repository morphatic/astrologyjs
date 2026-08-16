import { describe, expect, it } from 'vitest';

import {
  Aspect,
  Chart,
  ChartFactory,
  ChartType,
  Person,
  Planet,
  RETIREMENT_NOTICE,
} from '../src/astrologyjs';

/**
 * 1.3.2 is a tombstone. Its entire job is to replace a cryptic failure with an
 * explicit one, so these tests are about the message and about the guarantee
 * that there is no way through the package that avoids it.
 */

/** Every entry point must produce this, so it is asserted in one place. */
function expectTheNotice(error: unknown): void {
  expect(error).toBeInstanceOf(Error);
  const err = error as Error & { code?: string };
  expect(err.message).toBe(RETIREMENT_NOTICE);
  expect(err.code).toBe('ASTROLOGYJS_1X_RETIRED');
}

describe('the retirement notice', () => {
  it('says the backend is gone, and names it', () => {
    expect(RETIREMENT_NOTICE).toContain('morphemeris.com/ephemeris.php');
    expect(RETIREMENT_NOTICE).toMatch(/no longer works/);
  });

  it('says the results 1.x did produce were unreliable, with a concrete example', () => {
    // The spec's definition of done requires both halves: that the service is
    // gone, and that what it returned before it went was not to be trusted.
    // Vague regret would let someone conclude their old output was fine.
    expect(RETIREMENT_NOTICE).toMatch(/should not be trusted/);
    expect(RETIREMENT_NOTICE).toContain('118.5');
  });

  it('names the replacement and how to get it', () => {
    expect(RETIREMENT_NOTICE).toContain('astrologyjs 2.x');
    expect(RETIREMENT_NOTICE).toContain('npm install astrologyjs@^2');
    expect(RETIREMENT_NOTICE).toContain('github.com/morphatic/astrologyjs');
  });

  it('says an API key is now required, which is the one blocking difference', () => {
    expect(RETIREMENT_NOTICE).toMatch(/API key/);
  });

  it('carries no credential of any kind', () => {
    // 1.x shipped a Google API key in the bundle. Nothing in 1.3.2 should.
    expect(RETIREMENT_NOTICE).not.toMatch(/AIza/);
  });
});

describe('importing the package', () => {
  it('does not throw, so a bundler or a side-effect import still loads', () => {
    // The throw belongs at the call site, where `Unexpected token <` used to
    // appear. Throwing at import would break consumers at a different point
    // than the one they are debugging.
    expect(typeof Person).toBe('function');
    expect(typeof Chart).toBe('function');
    expect(typeof ChartFactory).toBe('function');
  });

  it('still exports ChartType with its original members, so imports resolve', () => {
    expect(ChartType.Basic).toBe(0);
    expect(ChartType.Transits).toBe(1);
    expect(ChartType.Synastry).toBe(2);
    expect(ChartType.Combined).toBe(3);
    expect(ChartType.Davison).toBe(4);
    expect(ChartType.CombinedTransits).toBe(5);
    expect(ChartType.DavisonTransits).toBe(6);
  });
});

describe('Person', () => {
  it('rejects from create()', async () => {
    await expect(
      Person.create('Test', '2000-01-01T00:00Z', { lat: 0, lng: 0 }),
    ).rejects.toSatisfy((e) => {
      expectTheNotice(e);
      return true;
    });
  });

  it('throws from the constructor', () => {
    expect(() => new Person('Test', '2000-01-01T00:00Z', { lat: 0, lng: 0 })).toThrow(
      RETIREMENT_NOTICE,
    );
  });

  it('rejects from getLatLon(), which used a Google key that is also gone', async () => {
    await expect(Person.getLatLon('New York, NY')).rejects.toThrow(RETIREMENT_NOTICE);
  });

  it('rejects from getTimezone()', async () => {
    await expect(Person.getTimezone({ lat: 0, lng: 0 })).rejects.toThrow(RETIREMENT_NOTICE);
  });
});

describe('Chart', () => {
  it('rejects from getChartData(), which is where the HTML error page arrived', async () => {
    await expect(Chart.getChartData('2000-01-01T00:00Z', { lat: 0, lng: 0 })).rejects.toSatisfy(
      (e) => {
        expectTheNotice(e);
        return true;
      },
    );
  });

  it('throws from the constructor', () => {
    expect(() => new Chart('test', null as never, [] as never)).toThrow(RETIREMENT_NOTICE);
  });
});

describe('ChartFactory', () => {
  it('rejects from create(), the documented entry point', async () => {
    await expect(ChartFactory.create('test', null as never)).rejects.toSatisfy((e) => {
      expectTheNotice(e);
      return true;
    });
  });

  it('throws from the pure geometry helpers too', () => {
    // These do not need the network and would still compute. They throw anyway:
    // a tombstone with working parts invites "but this bit is fine", and the
    // whole point of the notice is that nothing here should be relied on.
    expect(() => ChartFactory.getGeoMidpoint({ lat: 0, lng: 0 }, { lat: 1, lng: 1 })).toThrow(
      RETIREMENT_NOTICE,
    );
    expect(() =>
      ChartFactory.getDatetimeMidpoint('2000-01-01T00:00Z', '2001-01-01T00:00Z'),
    ).toThrow(RETIREMENT_NOTICE);
    expect(() => ChartFactory.toRadians(180)).toThrow(RETIREMENT_NOTICE);
    expect(() => ChartFactory.toDegrees(Math.PI)).toThrow(RETIREMENT_NOTICE);
  });
});

describe('Planet and Aspect', () => {
  it('throw from their constructors', () => {
    expect(() => new Planet('sun', 0, 0, 1)).toThrow(RETIREMENT_NOTICE);
    expect(() => new Aspect(null as never, null as never)).toThrow(RETIREMENT_NOTICE);
  });
});
