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
 * disagreement between the two is evidence of a bug in ours — but only where
 * both are reading the same time-zone data, which for historical dates they
 * sometimes are not. See {@link sameZoneData}.
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

/**
 * The platform's own UTC offset for an instant, read straight from `Intl`.
 *
 * Deliberately not the library's `offsetMinutesAt` — this is used to decide
 * whether the *oracle* is trustworthy, so it must not depend on the code the
 * oracle is judging.
 */
function platformOffsetMinutes(instantMs: number, zone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instantMs));
  const field = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');
  const asUtc = Date.UTC(
    field('year'),
    field('month') - 1,
    field('day'),
    field('hour') % 24,
    field('minute'),
    field('second'),
  );
  return Math.round((asUtc - Math.floor(instantMs / 1000) * 1000) / 60_000);
}

function temporalOffsetMinutes(instantMs: number, zone: string): number {
  return (
    Temporal.Instant.fromEpochMilliseconds(instantMs).toZonedDateTimeISO(zone).offsetNanoseconds /
    60_000_000_000
  );
}

/**
 * Whether both implementations are reading the same time-zone data here.
 *
 * `temporal-polyfill` does not always agree with the platform's tzdb on
 * historical offsets. Around 1947-06-01 it puts `Europe/Oslo` at +02:00 while
 * the platform says +03:00, and there the two are not describing the same
 * world: an instant one of them calls midnight, the other calls 01:00. This
 * library is defined in terms of the platform's `Intl` — that is the whole
 * point of not bundling a timezone database — so where the oracle contradicts
 * the platform it cannot adjudicate, and comparing them measures the
 * disagreement between two tzdb vintages rather than a defect in either.
 *
 * The guard is deliberately narrow: it declines to compare only when the two
 * disagree about the offset itself, which is checkable, rather than excluding
 * whole date ranges on suspicion. See the sibling test for the cases this
 * excludes and what the library does with them.
 */
function sameZoneData(local: string, zone: string): boolean {
  const naive = Date.parse(`${local}Z`);
  const day = 86_400_000;
  for (const probe of [naive - day, naive, naive + day]) {
    if (platformOffsetMinutes(probe, zone) !== temporalOffsetMinutes(probe, zone)) return false;
  }
  return true;
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
          fc.pre(sameZoneData(local, zone));
          const mine = viaLibrary(local, zone);
          const theirs = viaTemporal(local, zone);
          expect({ local, zone, ...mine }).toEqual({ local, zone, ...theirs });
        },
      ),
      { numRuns: 750 },
    );
  });

  describe('where the two disagree about the time-zone data itself', () => {
    /**
     * Every case the property test surfaced before the guard existed.
     *
     * All four are historical midnight transitions, and in all four the
     * platform's tzdb and `temporal-polyfill` place the zone at different
     * offsets. These are not near-misses to be tolerated: they are cases where
     * the oracle is describing a different history.
     */
    const DIVERGENT: readonly (readonly [string, string])[] = [
      ['1947-06-01T00:00:00', 'Europe/Oslo'],
      ['1946-07-15T00:00:00', 'America/Santiago'],
      ['2010-09-01T00:00:00', 'Africa/Cairo'],
      ['2014-06-01T00:00:00', 'Africa/Cairo'],
    ];

    /** The wall clock the platform reports for an instant, as an ISO local string. */
    function platformLocal(instant: string, zone: string): string {
      const ms = Date.parse(instant);
      return new Date(ms + platformOffsetMinutes(ms, zone) * 60_000).toISOString().slice(0, 19);
    }

    for (const [local, zone] of DIVERGENT) {
      it(`excludes ${zone} at ${local}, and the library still round-trips`, () => {
        // The guard must actually catch it, or the property test stays flaky.
        expect(sameZoneData(local, zone), 'guard did not fire').toBe(false);

        const mine = viaLibrary(local, zone);
        if (mine.kind === 'ok' && mine.instant !== undefined) {
          // The library's answer is correct by the only standard that applies:
          // fed back through the platform's own formatter, it is the wall clock
          // that was asked for.
          expect(platformLocal(mine.instant, zone)).toBe(local);
        } else {
          // Or it refused, which is the other honest outcome. What it must never
          // do is return an instant that is not the requested wall clock.
          expect(['ambiguous', 'nonexistent']).toContain(mine.kind);
        }
      });
    }

    it('is the oracle that fails the round-trip, not the library', () => {
      // Stated as an assertion rather than a comment so it stops being true
      // loudly, if a future temporal-polyfill adopts the platform's tzdb.
      const mismatched = DIVERGENT.filter(([local, zone]) => {
        const theirs = viaTemporal(local, zone);
        return theirs.kind === 'ok' && theirs.instant !== undefined
          ? platformLocal(theirs.instant, zone) !== local
          : false;
      });
      expect(mismatched.length).toBeGreaterThan(0);
    });
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
