/**
 * Configuration, API key resolution, and chart-option defaults.
 *
 * Key resolution order is call option, then {@link configure}, then the
 * environment — and the environment is read **only under Node**, so a browser
 * bundler never inlines a key into client-side output. See spec §4.1 and §11.
 */
import { allBodyNames, type NodeChoice } from './bodies.js';
import { ConfigurationError } from './errors.js';

const ENV_VAR = 'MORPHEMERIS_API_KEY';

/** A function that resolves an IANA zone name from coordinates. */
export type ZoneResolver = (lat: number, lng: number) => string;

/** A function that resolves a free-text place to coordinates. */
export type Geocoder = (query: string) => Promise<{ lat: number; lng: number }>;

/** Minimal shape of the global `fetch` the client needs. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface AstrologyConfig {
  readonly apiKey?: string | undefined;
  readonly baseUrl?: string | undefined;
  readonly fetch?: FetchLike | undefined;
  readonly zoneResolver?: ZoneResolver | undefined;
  readonly geocoder?: Geocoder | undefined;
  /** Request deduplication. Default true. */
  readonly cache?: boolean | undefined;
}

/**
 * The frame a chart is computed in.
 *
 * Two charts are comparable only if their frames match; see spec §7.2.
 */
export interface ChartOptions {
  readonly houseSystem?: string | undefined;
  /** Ayanamsha name. Absent means tropical. */
  readonly sidereal?: string | undefined;
  readonly node?: NodeChoice | undefined;
  readonly bodies?: readonly string[] | undefined;
  readonly unknownTime?: 'omit' | 'noon' | undefined;
  /**
   * Seconds to floor transit instants to. `0` disables rounding.
   *
   * The default of 60 keeps a polling caller from being billed per call while
   * costing at most ~0.5 arcminutes on the Moon, the fastest body. See §7.4.
   */
  readonly transitGranularitySec?: number | undefined;
}

/** {@link ChartOptions} with every default filled in. */
export interface ResolvedChartOptions {
  readonly houseSystem: string;
  readonly sidereal: string | undefined;
  readonly node: NodeChoice;
  readonly bodies: readonly string[];
  readonly unknownTime: 'omit' | 'noon';
  readonly transitGranularitySec: number;
}

export const DEFAULT_BASE_URL = 'https://api.morphemeris.com/v1';

let moduleConfig: AstrologyConfig = {};

/** Sets module-level configuration. Merges with any previous call. */
export function configure(config: AstrologyConfig): void {
  moduleConfig = { ...moduleConfig, ...config };
}

/** Current module-level configuration. */
export function getConfig(): AstrologyConfig {
  return moduleConfig;
}

/** Clears module-level configuration. Intended for tests. */
export function resetConfig(): void {
  moduleConfig = {};
}

/**
 * Reads the environment variable, but only under Node.
 *
 * Written so a bundler targeting the browser cannot statically inline
 * `process.env.MORPHEMERIS_API_KEY` — the property access is guarded by a
 * runtime check that a browser build fails.
 */
function keyFromEnvironment(): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.[ENV_VAR];
}

function firstNonBlank(...candidates: readonly (string | undefined)[]): string | undefined {
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate.trim() !== '') return candidate.trim();
  }
  return undefined;
}

/**
 * Resolves the Morphemeris API key.
 *
 * @throws ConfigurationError before any network call is attempted, naming every
 * configuration path so the fix is obvious. The message never contains a key.
 */
export function resolveApiKey(callOption?: string): string {
  const key = firstNonBlank(callOption, moduleConfig.apiKey, keyFromEnvironment());
  if (key !== undefined) return key;
  throw new ConfigurationError(
    'No Morphemeris API key configured. Pass `apiKey` to the call, call ' +
      `configure({ apiKey }), or set the ${ENV_VAR} environment variable. ` +
      'Create a key at https://morphemeris.com.',
  );
}

/** Fills in chart-option defaults. */
export function resolveOptions(options: ChartOptions = {}): ResolvedChartOptions {
  const granularity = options.transitGranularitySec ?? 60;
  if (!Number.isFinite(granularity) || granularity < 0) {
    throw new ConfigurationError(
      `transitGranularitySec must be a non-negative number of seconds; received ${String(
        options.transitGranularitySec,
      )}. Use 0 to disable transit rounding.`,
    );
  }
  return {
    houseSystem: options.houseSystem ?? 'placidus',
    sidereal: options.sidereal,
    node: options.node ?? 'true',
    bodies: options.bodies ?? allBodyNames(),
    unknownTime: options.unknownTime ?? 'omit',
    transitGranularitySec: granularity,
  };
}
