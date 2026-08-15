/**
 * A person or event: a name, a moment, and a place.
 *
 * The whole point of this module is that `instant` is never ambiguous and every
 * assumption behind it is inspectable. 1.x accepted a `Date`, which silently
 * imported the host process's timezone — the same source code produced a
 * different chart on a laptop than in a UTC container, with no error either
 * time. See spec §5.
 */
import { getConfig, type Geocoder, type ZoneResolver } from './config.js';
import { ConfigurationError, ValidationError } from './errors.js';
import { parseLocalWallClock, resolveInstant } from './time/resolve.js';
import { resolveZone, type GeoPoint } from './time/zone.js';

/**
 * How the moment is supplied. Exactly one form.
 *
 * There is deliberately no way to pass a `Date` or a bare date-time string:
 * both carry an implicit zone, and every chart cast from one is a coin flip.
 */
export type TimeInput =
  /** An unambiguous UTC instant. */
  | { readonly utc: string }
  /**
   * A local wall clock at the place. `offsetMinutes`, when given, is
   * authoritative — no zone lookup happens and no ambiguity can arise. It is
   * how a caller answers an `AmbiguousTimeError`.
   */
  | { readonly local: string; readonly offsetMinutes?: number | undefined }
  /**
   * The date is known but the time is not — very common in real birth data.
   *
   * Resolves against noon local at the place. Whether the time-dependent angles
   * are returned at all is governed by `ChartOptions.unknownTime` (§5.3), which
   * defaults to omitting them.
   */
  | { readonly date: string; readonly timeUnknown: true };

export interface PersonOptions {
  /** An explicit IANA zone, bypassing coordinate lookup entirely. */
  readonly zone?: string | undefined;
  readonly zoneResolver?: ZoneResolver | undefined;
  readonly geocoder?: Geocoder | undefined;
}

export interface Person {
  readonly name: string;
  readonly location: GeoPoint;
  /** Resolved UTC instant. Always present. */
  readonly instant: string;
  /** Resolved IANA zone. Always present. */
  readonly zone: string;
  /**
   * The offset applied, in minutes east of UTC. Inspectable so a caller can
   * audit what the library assumed — the single most useful auditable value
   * here, and may be fractional for local mean time.
   */
  readonly utcOffsetMinutes: number;
  /** False when the caller said the time was unknown. */
  readonly timeKnown: boolean;
  /** True when the built-in resolver supplied the zone rather than the caller. */
  readonly zoneFromDefaultResolver: boolean;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/u;

async function resolveLocation(
  place: GeoPoint | string,
  options: PersonOptions,
): Promise<GeoPoint> {
  if (typeof place !== 'string') return place;

  const geocoder = options.geocoder ?? getConfig().geocoder;
  if (geocoder === undefined) {
    throw new ConfigurationError(
      `A place was given as text (${JSON.stringify(place)}) but no geocoder is configured. ` +
        'Pass { geocoder } here or via configure({ geocoder }), or supply { lat, lng } ' +
        'directly. The library ships no default geocoder and needs no Google Maps key.',
    );
  }
  return geocoder(place);
}

/**
 * Creates a {@link Person}, resolving the zone and the instant.
 *
 * @throws AmbiguousTimeError when a local time occurs twice. The error carries
 * both candidate instants; re-call with `offsetMinutes` to choose.
 * @throws NonexistentTimeError when a local time never occurred.
 */
export async function createPerson(
  name: string,
  time: TimeInput,
  place: GeoPoint | string,
  options: PersonOptions = {},
): Promise<Person> {
  if (name.trim() === '') {
    throw new ValidationError('A person or event must have a name.');
  }

  const location = await resolveLocation(place, options);
  const config = getConfig();
  const { zone, fromDefaultResolver } = resolveZone(location, {
    zone: options.zone,
    zoneResolver: options.zoneResolver ?? config.zoneResolver,
  });

  const base = { name, location, zone, zoneFromDefaultResolver: fromDefaultResolver };

  if ('utc' in time) {
    const parsed = Date.parse(time.utc);
    if (Number.isNaN(parsed)) {
      throw new ValidationError(`Not a valid UTC instant: ${JSON.stringify(time.utc)}`);
    }
    return {
      ...base,
      instant: new Date(parsed).toISOString(),
      utcOffsetMinutes: 0,
      timeKnown: true,
    };
  }

  if ('timeUnknown' in time) {
    if (!DATE_ONLY.test(time.date.trim())) {
      throw new ValidationError(
        `An unknown-time person still needs a date as YYYY-MM-DD; received ` +
          `${JSON.stringify(time.date)}.`,
      );
    }
    // Noon local at the birthplace. Both unknownTime modes share this instant;
    // the mode decides only whether the angles are returned (§5.3).
    const resolved = resolveInstant(parseLocalWallClock(`${time.date.trim()}T12:00`), zone);
    return {
      ...base,
      instant: resolved.instant,
      utcOffsetMinutes: resolved.offsetMinutes,
      timeKnown: false,
    };
  }

  const resolved = resolveInstant(parseLocalWallClock(time.local), zone, time.offsetMinutes);
  return {
    ...base,
    instant: resolved.instant,
    utcOffsetMinutes: resolved.offsetMinutes,
    timeKnown: true,
  };
}
