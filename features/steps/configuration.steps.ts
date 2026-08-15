import assert from 'node:assert/strict';

import { Given, Then, When } from '@cucumber/cucumber';

import { resetClients } from '../../src/chart.js';
import { configure, resetConfig } from '../../src/config.js';
import {
  AuthError,
  ConfigurationError,
  InsufficientCreditsError,
  OriginError,
  RateLimitError,
  TransportError,
} from '../../src/errors.js';
import { createPerson } from '../../src/person.js';
import type { AstrologyWorld } from '../support/world.js';

/** Error classes by the plain-English names the scenarios use. */
const ERROR_TYPES: Readonly<Record<string, new (...args: never[]) => Error>> = {
  'authentication error': AuthError,
  'insufficient credits error': InsufficientCreditsError,
  'origin error': OriginError,
  'rate limit error': RateLimitError,
  'configuration error': ConfigurationError,
  'transport error': TransportError,
};

function respondWith(status: number, body: string, contentType: string): void {
  configure({
    apiKey: 'test-key-not-a-real-credential',
    fetch: (): Promise<Response> =>
      Promise.resolve(
        new Response(body, {
          status,
          headers: {
            'content-type': contentType,
            // Zero means "retry immediately", so the retry path is exercised
            // without adding seconds of backoff to the suite.
            'retry-after': '0',
          },
        }),
      ),
  });
}

Given('no API key is configured', function (this: AstrologyWorld) {
  resetConfig();
  resetClients();
  // The library also reads the environment, so a key exported in the developer's
  // shell would otherwise make this scenario pass for the wrong reason.
  Reflect.deleteProperty(process.env, 'MORPHEMERIS_API_KEY');
});

Given('no geocoder is configured', function (this: AstrologyWorld) {
  resetConfig();
  resetClients();
});

Given('the ephemeris endpoint returns an HTML redirect page', function (this: AstrologyWorld) {
  // Byte-for-byte the shape of the 1.x failure: nginx answering a dead host.
  respondWith(
    301,
    '<html>\r\n<head><title>301 Moved Permanently</title></head>\r\n<body>\r\n<center><h1>301 Moved Permanently</h1></center>\r\n<hr><center>nginx</center>\r\n</body>\r\n</html>',
    'text/html',
  );
});

Given('the ephemeris endpoint returns HTTP {int}', function (this: AstrologyWorld, status: number) {
  respondWith(
    status,
    JSON.stringify({ errors: [{ code: 'upstream', message: 'Simulated failure.' }] }),
    'application/json',
  );
});

When('a person is created with the place given as text', async function (this: AstrologyWorld) {
  try {
    this.person = await createPerson('Subject', { utc: '1990-06-15T13:30:00Z' }, 'Greenwich, UK');
  } catch (error) {
    this.error = error;
  }
});

Then(/^it fails with an? (.+)$/, function (this: AstrologyWorld, name: string) {
  const expected = ERROR_TYPES[name];
  if (expected === undefined) throw new Error(`No error class is mapped to "${name}".`);
  assert.ok(this.error instanceof expected, `Expected ${expected.name}, got ${String(this.error)}`);
});

/** The message of whatever error the scenario captured. */
function message(world: AstrologyWorld): string {
  if (!(world.error instanceof Error)) {
    throw new Error(`The scenario captured no error, only ${String(world.error)}.`);
  }
  return world.error.message;
}

Then('the message mentions how to obtain an API key', function (this: AstrologyWorld) {
  assert.match(message(this), /morphemeris\.com/u);
});

Then('the message says the library ships no geocoder', function (this: AstrologyWorld) {
  assert.match(message(this), /no default geocoder|no geocoder is configured/u);
});

Then('the message does not say {string}', function (this: AstrologyWorld, forbidden: string) {
  // The six-year-old symptom. If this string is ever back in a user-facing
  // message, the diagnosis has been lost again.
  assert.ok(!message(this).includes(forbidden));
});

Then('the message includes the first bytes of what came back', function (this: AstrologyWorld) {
  assert.match(message(this), /301 Moved Permanently/u);
});
