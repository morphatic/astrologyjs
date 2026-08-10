/**
 * Zone offset arithmetic, built on `Intl.DateTimeFormat`.
 *
 * The platform already ships a complete IANA tzdb and exposes it through
 * `Intl`. Reading offsets out of it costs no dependency and inherits every
 * historical rule the platform knows — local mean time before standard time was
 * adopted, wartime shifts, the United States' year-round DST in 1974, and the
 * half- and quarter-hour zones.
 *
 * See the rationale's "Why `tz-lookup` + hand-rolled `Intl`" for why this is
 * hand-rolled rather than delegated to Temporal or Luxon.
 */

/** A wall-clock reading with no zone attached. */
export interface WallClock {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

const MS_PER_MINUTE = 60_000;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(zone: string): Intl.DateTimeFormat {
  let dtf = formatterCache.get(zone);
  if (dtf === undefined) {
    dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      // h23 rather than hour12:false — the latter renders midnight as hour 24
      // in some locales, which would silently shift a chart by a day.
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(zone, dtf);
  }
  return dtf;
}

/** The wall clock a zone displays at a given UTC instant. */
export function localPartsAt(instantMs: number, zone: string): WallClock {
  const parts = formatterFor(zone).formatToParts(new Date(instantMs));
  const lookup: Record<string, string> = {};
  for (const part of parts) lookup[part.type] = part.value;
  return {
    year: Number(lookup['year']),
    month: Number(lookup['month']),
    day: Number(lookup['day']),
    hour: Number(lookup['hour']),
    minute: Number(lookup['minute']),
    second: Number(lookup['second']),
  };
}

/** Milliseconds since the epoch for a wall clock read as if it were UTC. */
export function wallClockAsUtcMs(wc: WallClock): number {
  // Date.UTC maps years 0-99 into 1900-1999; setUTCFullYear does not. Birth
  // years in that range are rare but real.
  const d = new Date(0);
  d.setUTCFullYear(wc.year, wc.month - 1, wc.day);
  d.setUTCHours(wc.hour, wc.minute, wc.second, 0);
  return d.getTime();
}

/**
 * A zone's offset from UTC at a given instant, in minutes, east-positive.
 *
 * May be fractional: local mean time offsets carry seconds, so New York before
 * 1883 is -296.0333 minutes (-4:56:02).
 */
export function offsetMinutesAt(instantMs: number, zone: string): number {
  // Floor to the whole second first. `localPartsAt` resolves only to seconds,
  // so a probe instant carrying milliseconds would otherwise contribute them to
  // the difference and yield -300.0000109 where the offset is exactly -300.
  // Offsets are compared for equality in findTransition, and that jitter made
  // the search terminate several minutes early.
  const whole = Math.floor(instantMs / 1000) * 1000;
  return (wallClockAsUtcMs(localPartsAt(whole, zone)) - whole) / MS_PER_MINUTE;
}

/**
 * The instant at which a zone's offset changes, by binary search.
 *
 * @param lo - An instant before the transition.
 * @param hi - An instant after it. The offsets at `lo` and `hi` must differ.
 * @returns The first instant, to the second, at which the new offset applies.
 */
export function findTransition(zone: string, lo: number, hi: number): number {
  const offsetAtLo = offsetMinutesAt(lo, zone);
  let low = lo;
  let high = hi;
  while (high - low > 1000) {
    const mid = low + Math.floor((high - low) / 2);
    if (offsetMinutesAt(mid, zone) === offsetAtLo) low = mid;
    else high = mid;
  }
  // The loop leaves `high` within a second above the transition and `low`
  // below it. Zone offsets change on whole-second boundaries, so flooring
  // recovers the transition exactly rather than approximately.
  return Math.floor(high / 1000) * 1000;
}

/** Whether two wall clocks denote the same reading. */
export function sameWallClock(a: WallClock, b: WallClock): boolean {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute &&
    a.second === b.second
  );
}
