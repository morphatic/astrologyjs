import { afterEach, describe, expect, it } from 'vitest';

import { resetConfig } from './config.js';
import { AmbiguousTimeError, ConfigurationError, ValidationError } from './errors.js';
import { createPerson } from './person.js';

const LYNCHBURG = { lat: 37.4381927, lng: -79.18932 };

afterEach(() => {
  resetConfig();
});

describe('createPerson', () => {
  it('resolves a local wall clock against the zone at the coordinates', async () => {
    const p = await createPerson('Test', { local: '1975-02-17T18:30' }, LYNCHBURG);
    expect(p.instant).toBe('1975-02-17T23:30:00.000Z');
    expect(p.zone).toBe('America/New_York');
    expect(p.utcOffsetMinutes).toBe(-300);
    expect(p.timeKnown).toBe(true);
  });

  it('accepts an explicit UTC instant', async () => {
    const p = await createPerson('Test', { utc: '1975-02-17T23:30:00Z' }, LYNCHBURG);
    expect(p.instant).toBe('1975-02-17T23:30:00.000Z');
    expect(p.utcOffsetMinutes).toBe(0);
  });

  it('records the offset it applied, so the assumption is auditable', async () => {
    // February 1974 in the US is EDT, not EST — year-round DST after the oil
    // crisis. A caller who doubts the result can read the offset and check.
    const p = await createPerson('Test', { local: '1974-02-17T18:30' }, LYNCHBURG);
    expect(p.utcOffsetMinutes).toBe(-240);
    expect(p.instant).toBe('1974-02-17T22:30:00.000Z');
  });

  it('flags that the zone came from the built-in resolver', async () => {
    const p = await createPerson('Test', { local: '1975-02-17T18:30' }, LYNCHBURG);
    expect(p.zoneFromDefaultResolver).toBe(true);
  });

  it('lets an explicit zone bypass coordinate lookup', async () => {
    const p = await createPerson('Test', { local: '1975-02-17T18:30' }, LYNCHBURG, {
      zone: 'UTC',
    });
    expect(p.zone).toBe('UTC');
    expect(p.zoneFromDefaultResolver).toBe(false);
    expect(p.instant).toBe('1975-02-17T18:30:00.000Z');
  });

  describe('unknown birth time', () => {
    it('resolves to noon local and records that the time is unknown', async () => {
      const p = await createPerson('Test', { date: '1975-02-17', timeUnknown: true }, LYNCHBURG);
      expect(p.timeKnown).toBe(false);
      expect(p.instant).toBe('1975-02-17T17:00:00.000Z'); // noon EST
    });

    it('still requires the date, which is always known even when the time is not', async () => {
      await expect(
        createPerson('Test', { date: 'sometime in 1975', timeUnknown: true }, LYNCHBURG),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('rejections', () => {
    it('refuses an ambiguous local time and offers both candidates', async () => {
      await expect(
        createPerson('Test', { local: '2024-11-03T01:30' }, LYNCHBURG),
      ).rejects.toBeInstanceOf(AmbiguousTimeError);
    });

    it('accepts the same time once the caller supplies the offset', async () => {
      const p = await createPerson(
        'Test',
        { local: '2024-11-03T01:30', offsetMinutes: -300 },
        LYNCHBURG,
      );
      expect(p.instant).toBe('2024-11-03T06:30:00.000Z');
    });

    it('refuses a text place with no geocoder, naming the fix', async () => {
      const promise = createPerson('Test', { local: '1975-02-17T18:30' }, 'Lynchburg, VA');
      await expect(promise).rejects.toBeInstanceOf(ConfigurationError);
      await expect(promise).rejects.toThrow(/geocoder/i);
    });

    it('uses a supplied geocoder when there is one', async () => {
      const p = await createPerson('Test', { local: '1975-02-17T18:30' }, 'Lynchburg, VA', {
        geocoder: () => Promise.resolve(LYNCHBURG),
      });
      expect(p.location).toEqual(LYNCHBURG);
    });

    it('requires a name', async () => {
      await expect(
        createPerson('  ', { local: '1975-02-17T18:30' }, LYNCHBURG),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('rejects out-of-range coordinates', async () => {
      await expect(
        createPerson('Test', { local: '1975-02-17T18:30' }, { lat: 91, lng: 0 }),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });
});
