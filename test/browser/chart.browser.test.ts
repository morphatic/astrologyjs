import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { build } from 'esbuild';
import { chromium, type Browser, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ChartType, createChart } from '../../src/chart.js';
import { configure, resetConfig } from '../../src/config.js';
import { createPerson } from '../../src/person.js';

/**
 * Casts a chart in a real browser.
 *
 * Everything else in this suite runs under Node, and the browser claim had only
 * ever been argued from the build configuration: no `node:` imports, one
 * runtime dependency that is isomorphic, `platform: 'neutral'`. All true, and
 * none of it evidence. A browser can still fail on module resolution, on CORS,
 * on a bundler inlining something it should not, or on a timezone database
 * differing from Node's — and the README tells people this works.
 *
 * So this bundles the library the way a consumer's bundler would, serves it
 * from a real HTTP origin, drives Chromium, and casts a chart against the live
 * API. Then it casts the same chart under Node and requires the two to agree,
 * because "it ran" is a much weaker claim than "it produced the same numbers".
 *
 * Gated on `MORPHEMERIS_API_KEY` like the other live tests, so it no-ops in CI.
 * The key is passed into the page as a call argument and never written to disk
 * or into the served bundle.
 */
const apiKey = process.env['MORPHEMERIS_API_KEY'];
const live = describe.runIf(apiKey !== undefined && apiKey.trim() !== '');

/** Greenwich, so the reference frame is uncontroversial. Matches the Node live test. */
const GREENWICH = { lat: 51.4779, lng: 0.0015 };
const BIRTH_LOCAL = '1990-06-15T14:30';

/**
 * The entry a consumer would write.
 *
 * Imported from source rather than `dist/`, so the test does not depend on a
 * build having been run first; esbuild resolves the same module graph a real
 * bundler would.
 */
const ENTRY = `
  import { configure, createPerson, createChart, ChartType } from '../../src/index.js';

  globalThis.castChart = async (apiKey) => {
    configure({ apiKey });
    const person = await createPerson('Subject A', { local: '${BIRTH_LOCAL}' }, {
      lat: ${String(GREENWICH.lat)}, lng: ${String(GREENWICH.lng)},
    });
    const chart = await createChart('natal', person, { type: ChartType.Basic });
    return {
      zone: person.zone,
      utcOffsetMinutes: person.utcOffsetMinutes,
      instant: person.instant,
      ascendant: chart.ascendant,
      houses: chart.houses,
      planets: chart.planets.map((p) => ({
        name: p.name,
        longitude: p.longitude,
        latitude: p.latitude,
        speed: p.speed,
        declination: p.declination,
        outOfBounds: p.outOfBounds,
      })),
      aspectCount: chart.aspects.length,
    };
  };

  // With no key configured anywhere. Under Node this falls through to
  // process.env; in a browser there is no process binding at all, and what
  // comes back is the difference between a guarded lookup and an unguarded one.
  globalThis.castWithoutKey = async () => {
    const person = await createPerson('Subject A', { local: '${BIRTH_LOCAL}' }, {
      lat: ${String(GREENWICH.lat)}, lng: ${String(GREENWICH.lng)},
    });
    try {
      await createChart('natal', person);
      return { threw: false };
    } catch (error) {
      return {
        threw: true,
        name: error && error.name ? error.name : typeof error,
        message: error && error.message ? error.message : '',
        isReferenceError: error instanceof ReferenceError,
      };
    }
  };

  globalThis.moduleLoaded = true;
`;

interface BrowserChart {
  readonly zone: string;
  readonly utcOffsetMinutes: number;
  readonly instant: string;
  readonly ascendant: number;
  readonly houses: readonly number[];
  readonly planets: readonly {
    readonly name: string;
    readonly longitude: number;
    readonly latitude: number;
    readonly speed: number;
    readonly declination: number;
    readonly outOfBounds: boolean;
  }[];
  readonly aspectCount: number;
}

interface MissingKeyOutcome {
  readonly threw: boolean;
  readonly name?: string;
  readonly message?: string;
  readonly isReferenceError?: boolean;
}

/**
 * What the entry above hangs off the page's global.
 *
 * Declared as a plain interface rather than by augmenting `Window`, because
 * this project's tsconfig deliberately omits the `DOM` lib — `window` is not a
 * name `src/` should ever be able to reach for. Page callbacks reach it through
 * an explicit cast instead, which keeps the omission intact.
 */
interface BrowserApi {
  castChart: (apiKey: string) => Promise<BrowserChart>;
  castWithoutKey: () => Promise<MissingKeyOutcome>;
  /** Undefined until the module has evaluated, which is the point of waiting on it. */
  moduleLoaded?: boolean;
}

/** Fails loudly rather than with a non-null assertion, which the lint config bans. */
function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`Expected ${what} to be present.`);
  return value;
}

live('cast in a real browser', () => {
  let bundle: string;
  let server: Server;
  let origin: string;
  let browser: Browser;
  /** Anything the page threw or logged as an error, so a silent failure cannot pass. */
  const pageErrors: string[] = [];

  beforeAll(async () => {
    // `platform: 'browser'` is the claim under test. If the library reached for
    // a Node builtin, esbuild fails here rather than at runtime.
    const result = await build({
      stdin: {
        contents: ENTRY,
        resolveDir: import.meta.dirname,
        sourcefile: 'consumer-entry.js',
        loader: 'js',
      },
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2022',
      write: false,
    });

    const output = result.outputFiles[0];
    if (output === undefined) throw new Error('esbuild produced no output.');
    bundle = output.text;

    server = createServer((request, response) => {
      if (request.url === '/bundle.js') {
        response.writeHead(200, { 'content-type': 'text/javascript' });
        response.end(bundle);
        return;
      }
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(
        '<!doctype html><meta charset="utf-8"><script type="module" src="/bundle.js"></script>',
      );
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as AddressInfo;
    // A real origin rather than file://, so requests to api.morphemeris.com are
    // genuinely cross-origin and the browser enforces CORS properly.
    origin = `http://127.0.0.1:${String(address.port)}`;

    // pnpm's `onlyBuiltDependencies` blocks playwright's postinstall, so the
    // browser binary is a deliberate one-off step rather than something every
    // `pnpm install` pays for — including in CI, where this suite never runs.
    // The cost of that choice is this error message.
    try {
      browser = await chromium.launch();
    } catch (error) {
      throw new Error(
        'Could not launch Chromium. Install it once with:\n\n' +
          '    pnpm exec playwright install chromium',
        { cause: error },
      );
    }
  }, 120_000);

  afterAll(async () => {
    await browser.close();
    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
    resetConfig();
  });

  /**
   * Runs against a freshly loaded page.
   *
   * Module state is per-realm, so a new page is the cheapest way to get a
   * library instance that has never been configured.
   */
  async function inFreshPage<T>(body: (page: Page) => Promise<T>): Promise<T> {
    const page = await browser.newPage();
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') pageErrors.push(message.text());
    });

    await page.goto(origin);
    await page.waitForFunction(
      () => (globalThis as unknown as BrowserApi).moduleLoaded === true,
      undefined,
      { timeout: 30_000 },
    );

    const result = await body(page);
    await page.close();
    return result;
  }

  it('bundles for the browser without pulling in a Node builtin', () => {
    // esbuild would have failed in beforeAll, so reaching here is most of the
    // assertion. The rest guards against a builtin surviving as a bare import.
    expect(bundle.length).toBeGreaterThan(1000);
    expect(bundle).not.toMatch(/require\(["']node:/);
    expect(bundle).not.toMatch(/from\s*["']node:/);
  });

  it('reaches process only through globalThis, so a bundler cannot inline the key', () => {
    // `process.env.MORPHEMERIS_API_KEY` written plainly is a static expression,
    // and static expressions are what a bundler's `define` substitutions
    // replace — which is how a key ends up shipped to browsers. config.ts
    // routes the lookup through `globalThis.process` for exactly this reason.
    // Asserting the shape of the emitted bundle is what makes that a guarantee
    // rather than a comment.
    expect(bundle).not.toMatch(/process\s*\.\s*env\s*\.\s*MORPHEMERIS_API_KEY/);
    for (const line of bundle.split('\n')) {
      if (line.includes('process')) expect(line, line.trim()).toContain('globalThis.process');
    }
    expect(apiKey).toBeDefined();
    expect(bundle).not.toContain(apiKey ?? ' never');
  });

  it('reports a missing key as a ConfigurationError, not a crash on undefined process', async () => {
    // The guard, executed. In a browser there is no `process` binding, so an
    // unguarded `process.env.X` throws `ReferenceError: process is not defined`
    // from inside a library, several frames from the actual problem — which is
    // the genre of failure this package exists to have stopped producing.
    const outcome = await inFreshPage(async (page) =>
      page.evaluate<MissingKeyOutcome>(async () =>
        (globalThis as unknown as BrowserApi).castWithoutKey(),
      ),
    );

    expect(outcome.threw).toBe(true);
    expect(outcome.isReferenceError).toBe(false);
    expect(outcome.name).toBe('ConfigurationError');
    // The message has to be actionable in a browser, where the environment
    // variable it can mention is not even an option.
    expect(outcome.message).toMatch(/api ?key/i);
  }, 60_000);

  it('casts a natal chart from the browser and gets the same answer as Node', async () => {
    const fromBrowser = await inFreshPage(async (page) =>
      // The key is a call argument, never part of the served bundle.
      page.evaluate<BrowserChart, string>(
        async (key) => (globalThis as unknown as BrowserApi).castChart(key),
        apiKey ?? '',
      ),
    );

    configure({ apiKey });
    const person = await createPerson('Subject A', { local: BIRTH_LOCAL }, GREENWICH);
    const fromNode = await createChart('natal', person, { type: ChartType.Basic });

    // Time resolution first: `tz-lookup` reads the same embedded database in
    // both runtimes, but Node also has a system tzdb and a browser does not. A
    // divergence here would mean the resolver quietly fell back to a host
    // facility — 1.x's defining bug, in a new place.
    expect(fromBrowser.zone).toBe(person.zone);
    expect(fromBrowser.utcOffsetMinutes).toBe(person.utcOffsetMinutes);
    expect(fromBrowser.instant).toBe(person.instant);

    expect(fromBrowser.planets.length).toBe(fromNode.planets.length);
    expect(fromBrowser.aspectCount).toBe(fromNode.aspects.length);
    // Both are optional on `Chart` because Placidus is undefined above the
    // Arctic Circle. Greenwich is not, so their absence would itself be a bug.
    expect(fromBrowser.houses).toEqual(required(fromNode.houses, 'houses'));
    expect(fromBrowser.ascendant).toBeCloseTo(required(fromNode.ascendant, 'ascendant'), 10);

    const nodeByName = new Map(fromNode.planets.map((p) => [p.name, p]));
    for (const theirs of fromBrowser.planets) {
      const ours = nodeByName.get(theirs.name);
      expect(ours, theirs.name).toBeDefined();
      if (ours === undefined) continue;
      // Identical inputs through identical code in two engines: these are the
      // same float, so the tolerance covers JSON round-tripping and nothing else.
      expect(theirs.longitude, `${theirs.name} longitude`).toBeCloseTo(ours.longitude, 10);
      expect(theirs.latitude, `${theirs.name} latitude`).toBeCloseTo(ours.latitude, 10);
      expect(theirs.speed, `${theirs.name} speed`).toBeCloseTo(ours.speed, 10);
      // Declination is derived locally from true obliquity rather than read off
      // the response, so agreement here exercises this library's own math in a
      // second JavaScript engine rather than just re-reading the same payload.
      expect(theirs.declination, `${theirs.name} declination`).toBeCloseTo(ours.declination, 10);
      expect(theirs.outOfBounds, `${theirs.name} outOfBounds`).toBe(ours.outOfBounds);
    }
  }, 120_000);

  it('reached the API cross-origin without a CORS failure', () => {
    // A CORS rejection surfaces as a console error and a rejected fetch rather
    // than an exception the library can catch and label, so sweeping the page's
    // errors is the only thing that reliably catches it. Issue #4, in 2017, was
    // exactly this failure against the old backend.
    expect(pageErrors).toEqual([]);
  });
});
