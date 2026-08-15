import assert from 'node:assert/strict';

import { Given, Then, When } from '@cucumber/cucumber';

import { AmbiguousTimeError, NonexistentTimeError, ValidationError } from '../../src/errors.js';
import { createPerson, type TimeInput } from '../../src/person.js';
import type { GeoPoint } from '../../src/time/zone.js';
import type { AstrologyWorld } from '../support/world.js';

/** Places named in the scenarios. Coordinates only — no zone is hardcoded. */
const PLACES: Readonly<Record<string, GeoPoint>> = {
  Greenwich: { lat: 51.4779, lng: 0.0015 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Kathmandu: { lat: 27.7172, lng: 85.324 },
  Adelaide: { lat: -34.9285, lng: 138.6007 },
  'New York': { lat: 40.7128, lng: -74.006 },
  Tromso: { lat: 69.6492, lng: 18.9553 },
};

export function placeNamed(name: string): GeoPoint {
  const place = PLACES[name];
  if (place === undefined) throw new Error(`No coordinates on file for ${name}.`);
  return place;
}

interface PendingBirth {
  time: TimeInput;
  place: GeoPoint;
}

/** What the scenario has described so far, before `createPerson` is called. */
const pending = new WeakMap<AstrologyWorld, PendingBirth>();
const secondPending = new WeakMap<AstrologyWorld, PendingBirth>();

export function pendingBirth(world: AstrologyWorld): PendingBirth {
  const birth = pending.get(world);
  if (birth === undefined) throw new Error('The scenario has not described a birth yet.');
  return birth;
}

export function secondBirth(world: AstrologyWorld): PendingBirth | undefined {
  return secondPending.get(world);
}

// Regex rather than {word}, because "New York" has a space in it.
Given(
  /^a birth at "([^"]*)" local time in (.+)$/,
  function (this: AstrologyWorld, local: string, place: string) {
    pending.set(this, { time: { local }, place: placeNamed(place) });
  },
);

Given(
  /^a second birth at "([^"]*)" local time in (.+)$/,
  function (this: AstrologyWorld, local: string, place: string) {
    secondPending.set(this, { time: { local }, place: placeNamed(place) });
  },
);

Given(
  /^a birth on "([^"]*)" in (.+) with the time unknown$/,
  function (this: AstrologyWorld, date: string, place: string) {
    pending.set(this, { time: { date, timeUnknown: true }, place: placeNamed(place) });
  },
);

Given(
  'the caller specifies a UTC offset of {int} minutes',
  function (this: AstrologyWorld, offsetMinutes: number) {
    const birth = pendingBirth(this);
    if (!('local' in birth.time)) {
      throw new Error('An explicit offset only applies to a local wall-clock time.');
    }
    birth.time = { local: birth.time.local, offsetMinutes };
  },
);

Given(
  'a birth time given as {string} in the local field',
  function (this: AstrologyWorld, local: string) {
    // A string carrying its own zone must be refused: the `local` field means
    // "wall clock at the place", and a Z suffix contradicts that.
    pending.set(this, { time: { local }, place: placeNamed('Greenwich') });
  },
);

When('the person is created', async function (this: AstrologyWorld) {
  const birth = pendingBirth(this);
  try {
    this.person = await createPerson('Subject', birth.time, birth.place);
  } catch (error) {
    this.error = error;
  }
});

Then('the resolved zone is {string}', function (this: AstrologyWorld, zone: string) {
  assert.equal(this.requirePerson().zone, zone);
});

Then('the resolved instant is {string}', function (this: AstrologyWorld, instant: string) {
  assert.equal(this.requirePerson().instant, instant);
});

Then('the applied UTC offset is {int} minutes', function (this: AstrologyWorld, offset: number) {
  assert.equal(this.requirePerson().utcOffsetMinutes, offset);
});

Then('the person reports which assumptions were used', function (this: AstrologyWorld) {
  const person = this.requirePerson();
  // The point is auditability: a caller can see the zone, the offset, whether
  // the time was known, and whether the library guessed the zone.
  assert.equal(typeof person.zone, 'string');
  assert.equal(typeof person.utcOffsetMinutes, 'number');
  assert.equal(typeof person.timeKnown, 'boolean');
  assert.equal(typeof person.zoneFromDefaultResolver, 'boolean');
});

Then('the person is marked as having an unknown time', function (this: AstrologyWorld) {
  assert.equal(this.requirePerson().timeKnown, false);
});

Then('the resolved instant is noon local', function (this: AstrologyWorld) {
  const person = this.requirePerson();
  const utcMinutes =
    new Date(person.instant).getUTCHours() * 60 + new Date(person.instant).getUTCMinutes();
  const localMinutes = (utcMinutes + person.utcOffsetMinutes + 1440) % 1440;
  assert.equal(localMinutes, 12 * 60);
});

Then('creating the person fails with an ambiguous time error', function (this: AstrologyWorld) {
  assert.ok(
    this.error instanceof AmbiguousTimeError,
    `Expected AmbiguousTimeError, got ${String(this.error)}`,
  );
});

Then('the error offers {int} candidate instants', function (this: AstrologyWorld, count: number) {
  assert.ok(this.error instanceof AmbiguousTimeError);
  assert.equal(this.error.candidates.length, count);
});

Then('creating the person fails with a nonexistent time error', function (this: AstrologyWorld) {
  assert.ok(
    this.error instanceof NonexistentTimeError,
    `Expected NonexistentTimeError, got ${String(this.error)}`,
  );
});

Then('creating the person fails with a validation error', function (this: AstrologyWorld) {
  assert.ok(
    this.error instanceof ValidationError,
    `Expected ValidationError, got ${String(this.error)}`,
  );
});
