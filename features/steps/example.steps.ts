import assert from 'node:assert/strict';

import { Given, Then, When } from '@cucumber/cucumber';

/**
 * Steps for the scaffold's `example.feature`.
 *
 * These exist so `pnpm test:bdd` is wired and green from the first commit.
 * Both the feature file and this file are replaced by real domain scenarios in
 * Phase 5 (spec §13.1).
 */
interface ExampleWorld {
  scaffolded?: boolean;
  designed?: boolean;
  input?: string;
  output?: string;
}

Given('the project has been scaffolded', function (this: ExampleWorld) {
  this.scaffolded = true;
});

When('the first real feature is designed', function (this: ExampleWorld) {
  this.designed = true;
});

Then('this file is replaced with a real feature file', function (this: ExampleWorld) {
  assert.equal(this.scaffolded, true);
  assert.equal(this.designed, true);
});

Given('the input {string}', function (this: ExampleWorld, input: string) {
  this.input = input;
});

When('the system processes it', function (this: ExampleWorld) {
  this.output = (this.input ?? '').toUpperCase();
});

Then('the output is {string}', function (this: ExampleWorld, expected: string) {
  assert.equal(this.output, expected);
});
