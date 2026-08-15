import { readFileSync } from 'node:fs';

import { setWorldConstructor, World } from '@cucumber/cucumber';

import { configure, resetConfig } from '../../src/config.js';
import { resetClients } from '../../src/chart.js';
import type { Chart } from '../../src/chart.js';
import type { Person } from '../../src/person.js';

/**
 * Acceptance scenarios run offline, against committed wire fixtures.
 *
 * CI has no API key, and scenarios that quietly no-op there are worse than no
 * scenarios at all — they report success for work nobody did. So the ephemeris
 * is stubbed with real recorded responses and every scenario runs everywhere.
 * What the live API actually does is covered separately in `test/live/`.
 */
interface WireHouses {
  readonly cusps: readonly number[];
}

interface WirePosition {
  readonly body: string;
}

interface WireChart {
  readonly positions: readonly WirePosition[];
  readonly houses?: WireHouses;
}

/** Instant → recorded `/v1/chart` response. Both are synthetic birth data. */
const FIXTURES: ReadonlyMap<string, WireChart> = new Map([
  ['1990-06-15T13:30:00.000Z', load('greenwich-1990')],
  ['1985-12-21T02:00:00.000Z', load('tromso-1985')],
  // Noon local at Greenwich in June is 11:00Z — where an unknown birth time
  // lands, in both the omit and noon modes.
  ['1990-06-15T11:00:00.000Z', load('greenwich-1990-noon')],
]);

function load(name: string): WireChart {
  const path = new URL(`./fixtures/${name}.json`, import.meta.url);
  return JSON.parse(readFileSync(path, 'utf8')) as WireChart;
}

export class AstrologyWorld extends World {
  person?: Person;
  otherPerson?: Person;
  chart?: Chart;
  error?: unknown;
  /** Requests the stub actually served, so scenarios can assert on caching. */
  readonly requests: string[] = [];

  /**
   * Points the library at the fixtures.
   *
   * A scenario that asks for an instant with no fixture gets a 404-shaped
   * response rather than a silent empty chart, so a mistyped date fails loudly.
   */
  useFixtures(): void {
    configure({
      apiKey: 'test-key-not-a-real-credential',
      fetch: (_url: string | URL, init?: RequestInit): Promise<Response> => {
        // The client always sends a JSON string body; anything else is a bug
        // here rather than something to coerce and carry on with.
        const raw = init?.body;
        if (typeof raw !== 'string') {
          throw new TypeError(`Expected a JSON string body, received ${typeof raw}.`);
        }
        const body = JSON.parse(raw) as { datetime?: string };
        const instant = body.datetime ?? '';
        this.requests.push(instant);

        const fixture = FIXTURES.get(instant);
        if (fixture === undefined) {
          return Promise.resolve(
            jsonResponse(404, {
              errors: [
                {
                  code: 'not_found',
                  message: `No recorded fixture for ${instant}. Record one in features/support/fixtures.`,
                },
              ],
            }),
          );
        }
        return Promise.resolve(jsonResponse(200, { data: fixture }));
      },
    });
  }

  reset(): void {
    resetConfig();
    resetClients();
  }

  /** The chart under test, or a clear failure instead of a cryptic undefined. */
  requireChart(): Chart {
    if (this.chart === undefined) {
      throw new Error('No chart has been built in this scenario.');
    }
    return this.chart;
  }

  requirePerson(): Person {
    if (this.person === undefined) {
      throw new Error('No person has been created in this scenario.');
    }
    return this.person;
  }
}

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

setWorldConstructor(AstrologyWorld);
