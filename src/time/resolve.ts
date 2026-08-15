/**
 * Local wall-clock to UTC instant resolution.
 *
 * This module owns the failure mode the contract ranks most severe: a chart
 * computed for the wrong moment, which renders perfectly and is silently an
 * hour out. Every rule here exists to make that impossible rather than
 * unlikely. See spec §5.
 */
import { AmbiguousTimeError, NonexistentTimeError, ValidationError } from '../errors.js';
import {
  findTransition,
  localPartsAt,
  offsetMinutesAt,
  sameWallClock,
  wallClockAsUtcMs,
  type WallClock,
} from './offset.js';

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

/** A wall clock resolved to a unique instant, with the offset that produced it. */
export interface ResolvedInstant {
  /** UTC instant, ISO 8601 with milliseconds. */
  readonly instant: string;
  /** The offset applied, in minutes east of UTC. May be fractional (LMT). */
  readonly offsetMinutes: number;
}

const LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?$/u;

/**
 * Parses a local wall-clock string.
 *
 * Accepts `YYYY-MM-DDTHH:mm`, `YYYY-MM-DD HH:mm`, and either with seconds.
 * Rejects anything carrying `Z` or a numeric offset: that is an instant, not a
 * wall clock, and accepting it here would shift the result twice.
 */
export function parseLocalWallClock(value: string): WallClock {
  const match = LOCAL_PATTERN.exec(value.trim());
  if (match === null) {
    throw new ValidationError(
      `Local time must look like "1980-05-15T14:30" (optionally with seconds) and must not ` +
        `carry a zone or offset; received ${JSON.stringify(value)}. ` +
        'Supply an instant via { utc } if the value is already UTC.',
    );
  }
  const [, y, mo, d, h, mi, s] = match;
  const wc: WallClock = {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hour: Number(h),
    minute: Number(mi),
    second: s === undefined ? 0 : Math.floor(Number(s)),
  };

  // Round-trip through the calendar to reject 2024-02-30 and 25:00, which the
  // pattern admits but the calendar does not.
  const probe = new Date(0);
  probe.setUTCFullYear(wc.year, wc.month - 1, wc.day);
  probe.setUTCHours(wc.hour, wc.minute, wc.second, 0);
  if (
    probe.getUTCFullYear() !== wc.year ||
    probe.getUTCMonth() !== wc.month - 1 ||
    probe.getUTCDate() !== wc.day ||
    probe.getUTCHours() !== wc.hour ||
    probe.getUTCMinutes() !== wc.minute
  ) {
    throw new ValidationError(`Not a valid calendar date and time: ${JSON.stringify(value)}`);
  }
  return wc;
}

/**
 * Resolves a wall clock in a zone to a unique UTC instant.
 *
 * @param explicitOffsetMinutes - When supplied, it is authoritative: no zone
 * lookup happens and neither ambiguity error can arise. This is how a caller
 * answers an {@link AmbiguousTimeError}.
 *
 * @throws AmbiguousTimeError when the wall clock occurs twice, carrying both
 * candidates. The library never picks one.
 * @throws NonexistentTimeError when the wall clock never occurred, carrying the
 * boundaries of the skipped interval.
 */
export function resolveInstant(
  wallClock: WallClock,
  zone: string,
  explicitOffsetMinutes?: number,
): ResolvedInstant {
  const asUtc = wallClockAsUtcMs(wallClock);

  if (explicitOffsetMinutes !== undefined) {
    return {
      instant: new Date(asUtc - explicitOffsetMinutes * MS_PER_MINUTE).toISOString(),
      offsetMinutes: explicitOffsetMinutes,
    };
  }

  // Sample the offset a day either side as well as at the naive guess. A
  // transition within that window yields two distinct offsets, which is what
  // makes both the repeated hour and the skipped hour discoverable. Probing
  // only at the guess finds one offset and would miss the second candidate.
  const sampled = [
    offsetMinutesAt(asUtc - MS_PER_DAY, zone),
    offsetMinutesAt(asUtc, zone),
    offsetMinutesAt(asUtc + MS_PER_DAY, zone),
  ];
  const offsets = [...new Set(sampled)];

  const valid: { instant: number; offsetMinutes: number }[] = [];
  for (const offsetMinutes of offsets) {
    const candidate = asUtc - offsetMinutes * MS_PER_MINUTE;
    // A candidate is real only if reading the zone back at that instant
    // reproduces the wall clock we were asked for.
    if (sameWallClock(localPartsAt(candidate, zone), wallClock)) {
      valid.push({ instant: candidate, offsetMinutes });
    }
  }
  valid.sort((a, b) => a.instant - b.instant);

  if (valid.length === 1) {
    const only = valid[0];
    if (only !== undefined) {
      return { instant: new Date(only.instant).toISOString(), offsetMinutes: only.offsetMinutes };
    }
  }

  if (valid.length > 1) {
    throw new AmbiguousTimeError(
      `Local time ${formatWallClock(wallClock)} occurs twice in ${zone}; ` +
        'pass an explicit offset to choose',
      {
        candidates: valid.map((c) => ({
          instant: new Date(c.instant).toISOString(),
          offsetMinutes: c.offsetMinutes,
        })),
      },
    );
  }

  // No valid candidate: the clock jumped over this wall time.
  const transition = findTransition(zone, asUtc - MS_PER_DAY, asUtc + MS_PER_DAY);
  const before = offsetMinutesAt(transition - 1000, zone);
  const after = offsetMinutesAt(transition, zone);
  throw new NonexistentTimeError(
    `Local time ${formatWallClock(wallClock)} never occurred in ${zone}; ` +
      'the clock jumped forward over it. Pass an explicit offset to choose a side',
    {
      gapStart: new Date(transition).toISOString(),
      gapEnd: new Date(transition + (after - before) * MS_PER_MINUTE).toISOString(),
    },
  );
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

function formatWallClock(wc: WallClock): string {
  return (
    `${pad(wc.year, 4)}-${pad(wc.month)}-${pad(wc.day)} ` +
    `${pad(wc.hour)}:${pad(wc.minute)}:${pad(wc.second)}`
  );
}
