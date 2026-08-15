import assert from 'node:assert/strict';

import { Given, Then, When } from '@cucumber/cucumber';

import { findAspect, separation, type Aspect } from '../../src/aspects.js';
import type { Planet } from '../../src/index.js';
import type { AstrologyWorld } from '../support/world.js';

interface AspectScenario {
  first: number;
  second: number;
  aspect?: Aspect | undefined;
  separation?: number;
}

const scenarios = new WeakMap<AstrologyWorld, AspectScenario>();

function current(world: AstrologyWorld): AspectScenario {
  const scenario = scenarios.get(world);
  if (scenario === undefined) throw new Error('No bodies have been placed in this scenario.');
  return scenario;
}

/** A body that exists only to carry a longitude. Speed zero, so nothing applies. */
function bodyAt(name: string, longitude: number): Planet {
  return {
    name,
    longitude,
    latitude: 0,
    speed: 0,
    distance: 1,
    declination: 0,
    outOfBounds: false,
    sign: 'aries',
    signDegree: 0,
    derived: false,
  };
}

Given(
  /^two bodies at ([\d.]+) and ([\d.]+) degrees$/,
  function (this: AstrologyWorld, first: string, second: string) {
    scenarios.set(this, { first: Number(first), second: Number(second) });
  },
);

When('the aspect between them is calculated', function (this: AstrologyWorld) {
  const scenario = current(this);
  scenario.aspect = findAspect(bodyAt('a', scenario.first), bodyAt('b', scenario.second));
});

When('their separation is calculated', function (this: AstrologyWorld) {
  const scenario = current(this);
  scenario.separation = separation(scenario.first, scenario.second);
});

Then('the aspect is a {word}', function (this: AstrologyWorld, type: string) {
  const aspect = current(this).aspect;
  assert.ok(aspect !== undefined, 'no aspect was found');
  assert.equal(aspect.type, type);
});

Then(/^the orb is ([\d.]+) degrees$/, function (this: AstrologyWorld, orb: string) {
  const aspect = current(this).aspect;
  assert.ok(aspect !== undefined, 'no aspect was found');
  assert.ok(
    Math.abs(aspect.orb - Number(orb)) < 1e-9,
    `orb was ${String(aspect.orb)}, expected ${orb}`,
  );
});

Then('there is no aspect between them', function (this: AstrologyWorld) {
  // Absence is a value, not an exception. Spec §8.
  assert.equal(current(this).aspect, undefined);
});

Then(/^the separation is ([\d.]+) degrees$/, function (this: AstrologyWorld, expected: string) {
  const actual = current(this).separation;
  assert.ok(actual !== undefined, 'separation was never calculated');
  assert.ok(Math.abs(actual - Number(expected)) < 1e-9, `separation was ${String(actual)}`);
});
