/**
 * Chart construction across the seven chart types.
 *
 * `createChart` is the only supported way to obtain a {@link Chart}. The
 * data-taking constructor 1.x exported is gone, which keeps the internal wire
 * shape out of the public contract so it can change without a major version
 * (§2.2, §1.6).
 */
import { aspectsBetween, aspectsWithin, type Aspect } from './aspects.js';
import {
  getConfig,
  resolveApiKey,
  resolveOptions,
  type ChartOptions,
  type ResolvedChartOptions,
} from './config.js';
import { EphemerisClient, type ChartRequest } from './ephemeris/client.js';
import {
  adaptChart,
  applyDerivations,
  type AdaptedChartData,
  type AdaptedPlanet,
  type ChartWarning,
} from './ephemeris/adapter.js';
import { ValidationError } from './errors.js';
import { geoMidpoint, instantMidpoint, longitudeMidpoint } from './midpoints.js';
import type { Person } from './person.js';
import { signDegree, signOf } from './signs.js';
import type { GeoPoint } from './time/zone.js';

/**
 * The seven chart types, carried forward from 1.x.
 *
 * An `as const` object rather than an `enum`: enums emit runtime values and
 * interact badly with `isolatedModules` (coding standards, §Types).
 */
export const ChartType = {
  Basic: 'basic',
  Transits: 'transits',
  Synastry: 'synastry',
  Combined: 'combined',
  Davison: 'davison',
  CombinedTransits: 'combined-transits',
  DavisonTransits: 'davison-transits',
} as const;

export type ChartTypeName = (typeof ChartType)[keyof typeof ChartType];

/** Chart types that require a second person. */
const NEEDS_SECOND_PERSON = new Set<ChartTypeName>([
  ChartType.Synastry,
  ChartType.Combined,
  ChartType.CombinedTransits,
  ChartType.Davison,
  ChartType.DavisonTransits,
]);

/** Chart types that carry a transit ring. */
const HAS_TRANSIT_RING = new Set<ChartTypeName>([
  ChartType.Transits,
  ChartType.CombinedTransits,
  ChartType.DavisonTransits,
]);

export interface Chart {
  readonly name: string;
  readonly type: ChartTypeName;
  /** The frame this chart was computed in. Two charts are comparable only if these match. */
  readonly options: ResolvedChartOptions;
  readonly p1: Person;
  readonly p2?: Person | undefined;
  readonly planets: readonly AdaptedPlanet[];
  readonly transits?: readonly AdaptedPlanet[] | undefined;
  readonly aspects: readonly Aspect[];
  readonly houses?: readonly number[] | undefined;
  readonly ascendant?: number | undefined;
  readonly midheaven?: number | undefined;
  readonly vertex?: number | undefined;
  readonly warnings: readonly ChartWarning[];
  /** Refetches the transit ring. Costs one credit per distinct rounded instant. */
  refreshTransits(at?: string): Promise<Chart>;
}

export interface CreateChartOptions extends ChartOptions {
  readonly apiKey?: string | undefined;
  readonly type?: ChartTypeName | undefined;
  readonly p2?: Person | undefined;
  /** Instant for the transit ring. Defaults to now. */
  readonly transitsAt?: string | undefined;
}

/**
 * One client per configuration, so the deduplication cache survives across
 * calls.
 *
 * Constructing a client per `createChart` would give every call a private empty
 * cache, which defeats deduplication entirely — including for the plainest case
 * of all, building the same chart twice in one process.
 */
const clients = new Map<string, EphemerisClient>();

function clientFor(apiKeyOverride: string | undefined): EphemerisClient {
  const config = getConfig();
  const apiKey = resolveApiKey(apiKeyOverride);
  const key = JSON.stringify([apiKey, config.baseUrl ?? null, config.cache ?? true]);
  // `fetch` is identity-compared rather than serialized; a different injected
  // fetch must not silently reuse another client's cache.
  const existing = clients.get(key);
  if (existing !== undefined && cachedFetch.get(key) === config.fetch) return existing;

  const client = new EphemerisClient({
    apiKey,
    baseUrl: config.baseUrl,
    fetch: config.fetch,
    cache: config.cache,
  });
  clients.set(key, client);
  cachedFetch.set(key, config.fetch);
  return client;
}

const cachedFetch = new Map<string, unknown>();

/** Clears the shared client cache. Intended for tests. */
export function resetClients(): void {
  clients.clear();
  cachedFetch.clear();
}

/** Floors an instant to the configured granularity so it is a stable cache key (§7.4). */
export function floorInstant(instant: string, granularitySec: number): string {
  if (granularitySec <= 0) return new Date(Date.parse(instant)).toISOString();
  const ms = granularitySec * 1000;
  return new Date(Math.floor(Date.parse(instant) / ms) * ms).toISOString();
}

function requestFor(instant: string, place: GeoPoint, options: ResolvedChartOptions): ChartRequest {
  return {
    instant,
    lat: place.lat,
    lng: place.lng,
    houseSystem: options.houseSystem,
    sidereal: options.sidereal,
    bodies: options.bodies,
    node: options.node,
  };
}

/** Combines two adapted charts by taking midpoints — the Combined chart type. */
function combine(a: AdaptedChartData, b: AdaptedChartData): AdaptedChartData {
  const byName = new Map(b.planets.map((p) => [p.name, p]));
  const warnings: ChartWarning[] = [...a.warnings, ...b.warnings];
  const planets: AdaptedPlanet[] = [];

  for (const p1 of a.planets) {
    const p2 = byName.get(p1.name);
    if (p2 === undefined) continue;
    const mid = longitudeMidpoint(p1.longitude, p2.longitude);
    if (mid.antipodal) {
      warnings.push({
        code: 'antipodal_midpoint',
        message: `${p1.name} is exactly opposite between the two charts; its midpoint is ambiguous and was resolved to the ascending arc.`,
      });
    }
    planets.push({
      ...p1,
      longitude: mid.longitude,
      latitude: (p1.latitude + p2.latitude) / 2,
      speed: (p1.speed + p2.speed) / 2,
      declination: (p1.declination + p2.declination) / 2,
      sign: signOf(mid.longitude),
      signDegree: signDegree(mid.longitude),
    });
  }

  const houses = a.houses?.map((cusp, i) => {
    const other = b.houses?.[i];
    return other === undefined ? cusp : longitudeMidpoint(cusp, other).longitude;
  });

  return {
    planets,
    houses,
    ascendant: midOrUndefined(a.ascendant, b.ascendant),
    midheaven: midOrUndefined(a.midheaven, b.midheaven),
    vertex: midOrUndefined(a.vertex, b.vertex),
    warnings,
  };
}

function midOrUndefined(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined || b === undefined) return undefined;
  return longitudeMidpoint(a, b).longitude;
}

/** Strips the time-dependent angles when the birth time was unknown and the mode says omit. */
function applyUnknownTimePolicy(
  data: AdaptedChartData,
  people: readonly Person[],
  options: ResolvedChartOptions,
): AdaptedChartData {
  const anyUnknown = people.some((p) => !p.timeKnown);
  if (!anyUnknown) return data;

  const warnings: ChartWarning[] = [
    ...data.warnings,
    {
      code: 'unknown_time',
      message:
        'The birth time was not known. Body positions are computed for noon local; the Moon ' +
        'may be up to ~13° from its true position.',
    },
  ];

  if (options.unknownTime === 'noon') {
    warnings.push({
      code: 'noon_assumed',
      message: 'Houses and angles were computed from an assumed noon local time.',
    });
    return { ...data, warnings };
  }

  // Omit: an ascendant sweeps the whole zodiac in 24 hours, so a noon value is
  // not an approximation of the true one — it is unrelated to it (§5.3).
  return {
    ...data,
    houses: undefined,
    ascendant: undefined,
    midheaven: undefined,
    vertex: undefined,
    warnings,
  };
}

function zoneWarnings(people: readonly Person[]): ChartWarning[] {
  return people
    .filter((p) => p.zoneFromDefaultResolver)
    .map((p) => ({
      code: 'zone_resolved_by_default',
      message: `The time zone for ${p.name} (${p.zone}) came from the built-in resolver, which is approximate near zone borders. Pass an explicit zone to be certain.`,
    }));
}

/**
 * Builds a chart.
 *
 * Every request composing one chart uses the same {@link ResolvedChartOptions},
 * so a chart cannot be half tropical and half sidereal (§7.2).
 */
export async function createChart(
  name: string,
  p1: Person,
  options: CreateChartOptions = {},
): Promise<Chart> {
  if (name.trim() === '') throw new ValidationError('A chart must have a name.');

  const type = options.type ?? ChartType.Basic;
  const p2 = options.p2;
  if (NEEDS_SECOND_PERSON.has(type) && p2 === undefined) {
    throw new ValidationError(`Chart type "${type}" requires a second person.`);
  }

  // Narrows p2 for the chart types that need it, without a non-null assertion.
  const requireSecond = (): Person => {
    if (p2 === undefined) {
      throw new ValidationError(`Chart type "${type}" requires a second person.`);
    }
    return p2;
  };

  const resolved = resolveOptions(options);
  const client = clientFor(options.apiKey);

  const transitInstant = floorInstant(
    options.transitsAt ?? new Date().toISOString(),
    resolved.transitGranularitySec,
  );

  const fetchAt = async (instant: string, place: GeoPoint): Promise<AdaptedChartData> => {
    const wire = await client.fetchChart(requestFor(instant, place, resolved));
    const adapted = adaptChart(wire, {
      instant,
      node: resolved.node,
      requestedBodies: resolved.bodies,
    });
    return applyDerivations(adapted, resolved.bodies);
  };

  let primary: AdaptedChartData;
  let transits: AdaptedChartData | undefined;
  const people: Person[] = [p1];

  switch (type) {
    case ChartType.Basic:
      primary = await fetchAt(p1.instant, p1.location);
      break;

    case ChartType.Transits: {
      const [natal, now] = await Promise.all([
        fetchAt(p1.instant, p1.location),
        fetchAt(transitInstant, p1.location),
      ]);
      primary = natal;
      transits = now;
      break;
    }

    case ChartType.Synastry: {
      const [a, b] = await Promise.all([
        fetchAt(p1.instant, p1.location),
        fetchAt(requireSecond().instant, requireSecond().location),
      ]);
      primary = a;
      transits = b;
      people.push(requireSecond());
      break;
    }

    case ChartType.Combined: {
      const [a, b] = await Promise.all([
        fetchAt(p1.instant, p1.location),
        fetchAt(requireSecond().instant, requireSecond().location),
      ]);
      primary = combine(a, b);
      people.push(requireSecond());
      break;
    }

    case ChartType.CombinedTransits: {
      const [a, b, now] = await Promise.all([
        fetchAt(p1.instant, p1.location),
        fetchAt(requireSecond().instant, requireSecond().location),
        fetchAt(transitInstant, p1.location),
      ]);
      primary = combine(a, b);
      transits = now;
      people.push(requireSecond());
      break;
    }

    case ChartType.Davison: {
      const place = geoMidpoint(p1.location, requireSecond().location);
      primary = await fetchAt(instantMidpoint(p1.instant, requireSecond().instant), place);
      people.push(requireSecond());
      break;
    }

    case ChartType.DavisonTransits: {
      const place = geoMidpoint(p1.location, requireSecond().location);
      const [davison, now] = await Promise.all([
        fetchAt(instantMidpoint(p1.instant, requireSecond().instant), place),
        fetchAt(transitInstant, place),
      ]);
      primary = davison;
      transits = now;
      people.push(requireSecond());
      break;
    }
  }

  const withPolicy = applyUnknownTimePolicy(primary, people, resolved);
  const warnings = [...withPolicy.warnings, ...(transits?.warnings ?? []), ...zoneWarnings(people)];
  const aspects =
    transits === undefined
      ? aspectsWithin(withPolicy.planets)
      : aspectsBetween(withPolicy.planets, transits.planets);

  return buildChart({
    name,
    type,
    options: resolved,
    p1,
    p2,
    data: withPolicy,
    transits: transits?.planets,
    aspects,
    warnings,
    createOptions: options,
  });
}

interface BuildArgs {
  readonly name: string;
  readonly type: ChartTypeName;
  readonly options: ResolvedChartOptions;
  readonly p1: Person;
  readonly p2: Person | undefined;
  readonly data: AdaptedChartData;
  readonly transits: readonly AdaptedPlanet[] | undefined;
  readonly aspects: readonly Aspect[];
  readonly warnings: readonly ChartWarning[];
  readonly createOptions: CreateChartOptions;
}

function buildChart(args: BuildArgs): Chart {
  const { data } = args;
  return {
    name: args.name,
    type: args.type,
    options: args.options,
    p1: args.p1,
    p2: args.p2,
    // Defensive copies: mutating a returned array must not mutate the chart.
    planets: [...data.planets],
    transits: args.transits === undefined ? undefined : [...args.transits],
    aspects: [...args.aspects],
    houses: data.houses === undefined ? undefined : [...data.houses],
    ascendant: data.ascendant,
    midheaven: data.midheaven,
    vertex: data.vertex,
    warnings: [...args.warnings],
    refreshTransits: async (at?: string): Promise<Chart> => {
      if (!HAS_TRANSIT_RING.has(args.type)) {
        throw new ValidationError(
          `Chart type "${args.type}" has no transit ring, so there is nothing to refresh.`,
        );
      }
      return createChart(args.name, args.p1, {
        ...args.createOptions,
        type: args.type,
        transitsAt: at ?? new Date().toISOString(),
      });
    },
  };
}
