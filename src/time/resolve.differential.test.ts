import fc from 'fast-check';
import { Temporal } from 'temporal-polyfill';
import { describe, expect, it } from 'vitest';

import { AmbiguousTimeError, NonexistentTimeError } from '../errors.js';
import { parseLocalWallClock, resolveInstant } from './resolve.js';

/**
 * Differential test of the hand-rolled conversion against `temporal-polyfill`.
 *
 * `temporal-polyfill` is a **devDependency only** — it never ships. It is here
 * because the completeness audit flagged that the `Intl` conversion is the
 * riskiest code in the library and has no upstream maintainer to inherit edge
 * cases from. TC39 solved the same problem independently, and its
 * `disambiguation: 'reject'` is exactly the semantics §5.5 specifies, so
 * disagreement between the two is evidence of a bug in ours.
 */

const ZONES = [
  'America/New_York',
  'Europe/London',
  'Europe/Oslo',
  'Australia/Sydney',
  'Australia/Lord_Howe',
  'Asia/Kolkata',
  'Asia/Kathmandu',
  'Pacific/Chatham',
  'America/Santiago',
  'Africa/Cairo',
  'UTC',
] as const;

interface TemporalOutcome {
  readonly kind: 'ok' | 'ambiguous' | 'nonexistent';
  readonly instant?: string;
}

function viaTemporal(local: string, zone: string): TemporalOutcome {
  const plain = Temporal.PlainDateTime.from(local);
  try {
    const zoned = plain.toZonedDateTime(zone, { disambiguation: 'reject' });
    return { kind: 'ok', instant: zoned.toInstant().toString({ smallestUnit: 'millisecond' }) };
  } catch {
    // Temporal rejects both cases with the same RangeError, and 'earlier' and
    // 'later' produce different instants in both — so comparing them cannot
    // tell the cases apart. What distinguishes them is whether the wall clock
    // exists at all: for a repeated hour the resolved instant reads back as the
    // requested wall clock, and for a skipped one it cannot.
    const resolved = plain.toZonedDateTime(zone, { disambiguation: 'earlier' });
    return { kind: resolved.toPlainDateTime().equals(plain) ? 'ambiguous' : 'nonexistent' };
  }
}

function viaLibrary(local: string, zone: string): TemporalOutcome {
  try {
    return { kind: 'ok', instant: resolveInstant(parseLocalWallClock(local), zone).instant };
  } catch (err) {
    if (err instanceof AmbiguousTimeError) return { kind: 'ambiguous' };
    if (err instanceof NonexistentTimeError) return { kind: 'nonexistent' };
    throw err;
  }
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

describe('agreement with temporal-polyfill', () => {
  it('agrees on the documented hard cases', () => {
    const cases: [string, string][] = [
      ['2024-11-03T01:30:00', 'America/New_York'], // ambiguous
      ['2024-03-10T02:30:00', 'America/New_York'], // nonexistent
      ['2024-04-07T01:45:00', 'Australia/Lord_Howe'], // ambiguous, 30 minutes
      ['2024-10-06T02:15:00', 'Australia/Lord_Howe'], // nonexistent, 30 minutes
      ['1974-02-17T18:30:00', 'America/New_York'], // year-round DST
      ['1980-05-15T17:30:00', 'Asia/Kolkata'],
      ['1990-05-15T17:45:00', 'Asia/Kathmandu'],
      ['2024-06-15T12:00:00', 'Australia/Sydney'],
      ['2024-09-08T02:30:00', 'Pacific/Chatham'], // 45-minute offset zone
    ];
    for (const [local, zone] of cases) {
      expect({ local, zone, ...viaLibrary(local, zone) }).toEqual({
        local,
        zone,
        ...viaTemporal(local, zone),
      });
    }
  });

  it('agrees on arbitrary dates across a range of zones', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1900, max: 2100 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }),
        fc.integer({ min: 0, max: 23 }),
        fc.constantFrom(0, 15, 30, 45),
        fc.constantFrom(...ZONES),
        (year, month, day, hour, minute, zone) => {
          const local = `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;
          const mine = viaLibrary(local, zone);
          const theirs = viaTemporal(local, zone);
          expect({ local, zone, ...mine }).toEqual({ local, zone, ...theirs });
        },
      ),
      { numRuns: 750 },
    );
  });

  it('agrees around DST transitions specifically, where disagreement is likeliest', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '2024-03-10',
          '2024-11-03',
          '2024-04-07',
          '2024-10-06',
          '2024-03-31',
          '2024-10-27',
          '2024-09-08',
          '2024-04-06',
        ),
        fc.integer({ min: 0, max: 5 }),
        fc.constantFrom(0, 15, 30, 45),
        fc.constantFrom(...ZONES),
        (date, hour, minute, zone) => {
          const local = `${date}T${pad(hour)}:${pad(minute)}:00`;
          expect({ local, zone, ...viaLibrary(local, zone) }).toEqual({
            local,
            zone,
            ...viaTemporal(local, zone),
          });
        },
      ),
      { numRuns: 600 },
    );
  });
});
