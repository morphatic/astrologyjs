import assert from 'node:assert/strict';

import { After, Before, Given, Then, When } from '@cucumber/cucumber';

import { ChartType, createChart, type CreateChartOptions } from '../../src/chart.js';
import { createPerson } from '../../src/person.js';
import type { Planet } from '../../src/index.js';
import { AstrologyWorld } from '../support/world.js';
import { pendingBirth, secondBirth } from './person.steps.js';

/** Per-scenario chart options the Given steps accumulate. */
const options = new WeakMap<AstrologyWorld, CreateChartOptions>();

function optionsFor(world: AstrologyWorld): CreateChartOptions {
  return options.get(world) ?? {};
}

Before(function (this: AstrologyWorld) {
  options.delete(this);
});

After(function (this: AstrologyWorld) {
  this.reset();
});

Given('the ephemeris is served from recorded fixtures', function (this: AstrologyWorld) {
  this.useFixtures();
});

Given(
  'the caller opts into the noon convention for unknown times',
  function (this: AstrologyWorld) {
    options.set(this, { ...optionsFor(this), unknownTime: 'noon' });
  },
);

async function buildChart(world: AstrologyWorld, extra: CreateChartOptions = {}): Promise<void> {
  const birth = pendingBirth(world);
  try {
    world.person ??= await createPerson('Subject', birth.time, birth.place);
    world.chart = await createChart('Scenario chart', world.person, {
      ...optionsFor(world),
      ...extra,
    });
  } catch (error) {
    world.error = error;
  }
}

When('a natal chart is built', async function (this: AstrologyWorld) {
  await buildChart(this);
});

When('a natal chart is built again', async function (this: AstrologyWorld) {
  await buildChart(this);
});

When('a synastry chart is built', async function (this: AstrologyWorld) {
  const second = secondBirth(this);
  if (second === undefined) throw new Error('The scenario described only one birth.');
  this.otherPerson = await createPerson('Second subject', second.time, second.place);
  await buildChart(this, { type: ChartType.Synastry, p2: this.otherPerson });
});

function planet(world: AstrologyWorld, name: string): Planet {
  const found = world.requireChart().planets.find((p) => p.name === name);
  if (found === undefined) throw new Error(`The chart has no ${name}.`);
  return found;
}

Then('the chart has {int} bodies', function (this: AstrologyWorld, count: number) {
  assert.equal(this.requireChart().planets.length, count);
});

Then('the chart has {int} house cusps', function (this: AstrologyWorld, count: number) {
  assert.equal(this.requireChart().houses?.length, count);
});

Then('the chart has no house cusps', function (this: AstrologyWorld) {
  assert.equal(this.requireChart().houses, undefined);
});

Then('the chart has an ascendant and a midheaven', function (this: AstrologyWorld) {
  const chart = this.requireChart();
  assert.equal(typeof chart.ascendant, 'number');
  assert.equal(typeof chart.midheaven, 'number');
});

Then('the chart has no ascendant', function (this: AstrologyWorld) {
  assert.equal(this.requireChart().ascendant, undefined);
});

Then("the Sun's ecliptic latitude is near zero", function (this: AstrologyWorld) {
  assert.ok(Math.abs(planet(this, 'sun').latitude) < 0.01);
});

Then(
  "the Sun's declination is more than {int} degrees",
  function (this: AstrologyWorld, min: number) {
    assert.ok(Math.abs(planet(this, 'sun').declination) > min);
  },
);

Then(
  'the south node is exactly {int} degrees from the north node',
  function (this: AstrologyWorld, degrees: number) {
    const north = planet(this, 'north node');
    const south = planet(this, 'south node');
    const separation = (south.longitude - north.longitude + 360) % 360;
    assert.ok(Math.abs(separation - degrees) < 1e-9, `separation was ${String(separation)}`);
  },
);

Then(
  'no aspect is reported between the north node and the south node',
  function (this: AstrologyWorld) {
    // The two are 180° apart by construction, so an unfiltered engine reports a
    // perfect opposition in every chart ever produced. Spec §8.3.
    const pairs = this.requireChart().aspects.map((a) => [a.p1.name, a.p2.name].sort().join('|'));
    assert.ok(!pairs.includes('north node|south node'));
  },
);

Then('the ephemeris was called {int} time', function (this: AstrologyWorld, count: number) {
  assert.equal(this.requests.length, count);
});

Then('the chart warns that the birth time was unknown', function (this: AstrologyWorld) {
  const codes = this.requireChart().warnings.map((w) => w.code);
  assert.ok(codes.includes('unknown_time'), `warnings were ${codes.join(', ')}`);
});

Then('the chart warns that noon was assumed', function (this: AstrologyWorld) {
  const codes = this.requireChart().warnings.map((w) => w.code);
  assert.ok(codes.includes('noon_assumed'), `warnings were ${codes.join(', ')}`);
});

Then('the chart has a second ring of bodies', function (this: AstrologyWorld) {
  const transits = this.requireChart().transits;
  assert.ok(transits !== undefined && transits.length > 0);
});

Then('every aspect crosses the two rings', function (this: AstrologyWorld) {
  const chart = this.requireChart();
  const inner = new Set(chart.planets.map((p) => p.name));
  const outer = new Set((chart.transits ?? []).map((p) => p.name));
  assert.ok(chart.aspects.length > 0, 'no aspects to check');
  for (const aspect of chart.aspects) {
    assert.ok(inner.has(aspect.p1.name), `${aspect.p1.name} is not in the inner ring`);
    assert.ok(outer.has(aspect.p2.name), `${aspect.p2.name} is not in the outer ring`);
  }
});

Then('the chart reports its house system and zodiac', function (this: AstrologyWorld) {
  const chart = this.requireChart();
  assert.equal(chart.options.houseSystem, 'placidus');
  assert.equal(chart.options.sidereal, undefined); // tropical
});
