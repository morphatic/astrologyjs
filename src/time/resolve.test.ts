import { describe, expect, it } from 'vitest';

import { AmbiguousTimeError, NonexistentTimeError, ValidationError } from '../errors.js';
import { parseLocalWallClock, resolveInstant } from './resolve.js';

describe('parseLocalWallClock', () => {
  it('accepts an ISO-like local date and time', () => {
    expect(parseLocalWallClock('1980-05-15T14:30')).toEqual({
      year: 1980,
      month: 5,
      day: 15,
      hour: 14,
      minute: 30,
      second: 0,
    });
  });

  it('accepts seconds and a space separator', () => {
    expect(parseLocalWallClock('1980-05-15 14:30:45').second).toBe(45);
  });

  it('rejects a value carrying a zone, which is not a local wall clock', () => {
    // A string with Z or an offset is an instant. Accepting it here would let a
    // caller pass an instant where a local time is meant and get a double shift.
    expect(() => parseLocalWallClock('1980-05-15T14:30Z')).toThrow(ValidationError);
    expect(() => parseLocalWallClock('1980-05-15T14:30+02:00')).toThrow(ValidationError);
  });

  it('rejects an unparseable value rather than guessing', () => {
    expect(() => parseLocalWallClock('May 15 1980')).toThrow(ValidationError);
    expect(() => parseLocalWallClock('')).toThrow(ValidationError);
  });

  it('rejects an impossible calendar date', () => {
    expect(() => parseLocalWallClock('1980-02-30T12:00')).toThrow(ValidationError);
    expect(() => parseLocalWallClock('1980-13-01T12:00')).toThrow(ValidationError);
    expect(() => parseLocalWallClock('1980-05-15T25:00')).toThrow(ValidationError);
  });
});

describe('resolveInstant', () => {
  it('converts an ordinary local time using the offset in force that day', () => {
    const r = resolveInstant(parseLocalWallClock('1975-02-17T18:30'), 'America/New_York');
    expect(r.instant).toBe('1975-02-17T23:30:00.000Z');
    expect(r.offsetMinutes).toBe(-300);
  });

  it('uses year-round DST for a February 1974 US birth', () => {
    // 18:30 local is 22:30Z, not 23:30Z. Assuming EST here loses an hour.
    const r = resolveInstant(parseLocalWallClock('1974-02-17T18:30'), 'America/New_York');
    expect(r.instant).toBe('1974-02-17T22:30:00.000Z');
    expect(r.offsetMinutes).toBe(-240);
  });

  it('resolves half- and quarter-hour zones', () => {
    expect(resolveInstant(parseLocalWallClock('1980-05-15T17:30'), 'Asia/Kolkata').instant).toBe(
      '1980-05-15T12:00:00.000Z',
    );
    expect(resolveInstant(parseLocalWallClock('1990-05-15T17:45'), 'Asia/Kathmandu').instant).toBe(
      '1990-05-15T12:00:00.000Z',
    );
  });

  it('resolves a pre-standard-time date against local mean time', () => {
    const r = resolveInstant(parseLocalWallClock('1880-06-15T12:00'), 'America/New_York');
    expect(r.instant).toBe('1880-06-15T16:56:02.000Z');
    expect(r.offsetMinutes).toBeCloseTo(-296.0333, 3);
  });

  it('resolves a southern-hemisphere date, where the transitions run mid-year', () => {
    const r = resolveInstant(parseLocalWallClock('2024-06-15T12:00'), 'Australia/Sydney');
    expect(r.instant).toBe('2024-06-15T02:00:00.000Z');
    expect(r.offsetMinutes).toBe(600);
  });

  describe('when the local time occurs twice', () => {
    it('throws rather than choosing, and carries both candidates', () => {
      let thrown: AmbiguousTimeError | undefined;
      try {
        resolveInstant(parseLocalWallClock('2024-11-03T01:30'), 'America/New_York');
      } catch (err) {
        thrown = err as AmbiguousTimeError;
      }
      expect(thrown).toBeInstanceOf(AmbiguousTimeError);
      expect(thrown?.candidates.map((c) => c.instant)).toEqual([
        '2024-11-03T05:30:00.000Z',
        '2024-11-03T06:30:00.000Z',
      ]);
      expect(thrown?.candidates.map((c) => c.offsetMinutes)).toEqual([-240, -300]);
    });

    it('detects a thirty-minute ambiguity, not just hour-long ones', () => {
      let thrown: AmbiguousTimeError | undefined;
      try {
        resolveInstant(parseLocalWallClock('2024-04-07T01:45'), 'Australia/Lord_Howe');
      } catch (err) {
        thrown = err as AmbiguousTimeError;
      }
      expect(thrown).toBeInstanceOf(AmbiguousTimeError);
      expect(thrown?.candidates.map((c) => c.instant)).toEqual([
        '2024-04-06T14:45:00.000Z',
        '2024-04-06T15:15:00.000Z',
      ]);
    });

    it('is resolved by supplying the offset explicitly', () => {
      const r = resolveInstant(parseLocalWallClock('2024-11-03T01:30'), 'America/New_York', -300);
      expect(r.instant).toBe('2024-11-03T06:30:00.000Z');
      expect(r.offsetMinutes).toBe(-300);
    });
  });

  describe('when the local time never occurred', () => {
    it('throws and carries the gap boundaries', () => {
      let thrown: NonexistentTimeError | undefined;
      try {
        resolveInstant(parseLocalWallClock('2024-03-10T02:30'), 'America/New_York');
      } catch (err) {
        thrown = err as NonexistentTimeError;
      }
      expect(thrown).toBeInstanceOf(NonexistentTimeError);
      expect(thrown?.gapStart).toBe('2024-03-10T07:00:00.000Z');
      expect(thrown?.gapEnd).toBe('2024-03-10T08:00:00.000Z');
    });

    it('is resolved by supplying the offset explicitly', () => {
      const r = resolveInstant(parseLocalWallClock('2024-03-10T02:30'), 'America/New_York', -300);
      expect(r.instant).toBe('2024-03-10T07:30:00.000Z');
    });
  });

  it('never consults the host timezone', () => {
    // The same wall clock and zone must produce the same instant regardless of
    // what TZ the process happens to be running under. This is the structural
    // failure in 1.x: Person.create() accepted a Date, which imports the host
    // zone silently.
    const saved = process.env['TZ'];
    try {
      const inUtc = (() => {
        process.env['TZ'] = 'UTC';
        return resolveInstant(parseLocalWallClock('1980-05-15T14:30'), 'America/New_York').instant;
      })();
      const inTokyo = (() => {
        process.env['TZ'] = 'Asia/Tokyo';
        return resolveInstant(parseLocalWallClock('1980-05-15T14:30'), 'America/New_York').instant;
      })();
      expect(inUtc).toBe(inTokyo);
    } finally {
      if (saved === undefined) Reflect.deleteProperty(process.env, 'TZ');
      else process.env['TZ'] = saved;
    }
  });
});
