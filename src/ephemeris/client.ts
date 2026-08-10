/**
 * The Morphemeris HTTP client.
 *
 * Owns auth, transport, retry, request deduplication, and the mapping from HTTP
 * status and upstream error code onto the library's typed errors. It is the
 * only module that performs I/O.
 */
import { requestedApiIds, type NodeChoice } from '../bodies.js';
import { DEFAULT_BASE_URL, type FetchLike } from '../config.js';
import {
  AdapterError,
  AuthError,
  InsufficientCreditsError,
  OriginError,
  RateLimitError,
  ServiceUnavailableError,
  TransportError,
  UpstreamError,
  type AstrologyError,
  type UpstreamErrorDetail,
} from '../errors.js';
import type { WireChartData, WireEnvelope } from './types.js';

export interface ChartRequest {
  /** UTC instant, ISO 8601. */
  readonly instant: string;
  readonly lat: number;
  readonly lng: number;
  readonly houseSystem: string;
  readonly sidereal?: string | undefined;
  /** Library body names. */
  readonly bodies: readonly string[];
  readonly node: NodeChoice;
}

export interface EphemerisClientConfig {
  readonly apiKey: string;
  readonly baseUrl?: string | undefined;
  readonly fetch?: FetchLike | undefined;
  readonly cache?: boolean | undefined;
  /** Attempts including the first. Default 3. */
  readonly maxAttempts?: number | undefined;
  /** Base backoff in ms. Default 1000; set to 0 in tests. */
  readonly retryBaseMs?: number | undefined;
}

const RETRYABLE_STATUSES = new Set([429, 503]);

export class EphemerisClient {
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #fetch: FetchLike;
  readonly #cacheEnabled: boolean;
  readonly #maxAttempts: number;
  readonly #retryBaseMs: number;

  /**
   * Keyed on the complete request tuple, and holding the **in-flight promise**
   * rather than the resolved value.
   *
   * Storing promises is what makes concurrent identical requests share one
   * credit. A resolved-value cache coalesces nothing when two calls race,
   * because both miss before either stores — which is exactly what a Synastry
   * chart for two people born in the same place at the same instant does.
   */
  readonly #inFlight = new Map<string, Promise<WireChartData>>();

  constructor(config: EphemerisClientConfig) {
    this.#apiKey = config.apiKey;
    this.#baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.#fetch = config.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.#cacheEnabled = config.cache ?? true;
    this.#maxAttempts = config.maxAttempts ?? 3;
    this.#retryBaseMs = config.retryBaseMs ?? 1000;
  }

  /** Ephemeris data for one moment and place. Costs one credit on a cache miss. */
  async fetchChart(request: ChartRequest): Promise<WireChartData> {
    const key = cacheKey(request);
    if (this.#cacheEnabled) {
      const existing = this.#inFlight.get(key);
      if (existing !== undefined) return existing;
    }

    const promise = this.#fetchChartUncached(request);
    if (this.#cacheEnabled) {
      this.#inFlight.set(key, promise);
      // Evict on rejection, or the first transient network failure caches
      // itself forever and every later call replays the same error.
      promise.catch(() => this.#inFlight.delete(key));
    }
    return promise;
  }

  async #fetchChartUncached(request: ChartRequest): Promise<WireChartData> {
    const body: Record<string, string | number | boolean> = {
      datetime: request.instant,
      lat: request.lat,
      lon: request.lng,
      system: request.houseSystem,
      bodies: requestedApiIds(request.bodies, request.node).join(','),
      speed: true,
    };
    if (request.sidereal !== undefined) body['sidereal'] = request.sidereal;

    let lastError: AstrologyError | undefined;
    for (let attempt = 1; attempt <= this.#maxAttempts; attempt += 1) {
      let response: Response;
      try {
        response = await this.#fetch(`${this.#baseUrl}/chart`, {
          method: 'POST',
          headers: {
            // Key travels in the header only, never in the query string.
            authorization: `Bearer ${this.#apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      } catch (cause) {
        lastError = new TransportError(
          'The ephemeris request could not be completed (network failure or timeout).',
          { cause },
        );
        if (attempt < this.#maxAttempts) {
          await this.#backoff(attempt, undefined);
          continue;
        }
        throw lastError;
      }

      const text = await response.text();
      let envelope: WireEnvelope<WireChartData>;
      try {
        envelope = JSON.parse(text) as WireEnvelope<WireChartData>;
      } catch (cause) {
        // The 1.x failure, named properly. An HTTP redirect page parsed as JSON
        // produced `Unexpected token <` and six years of confused issues.
        throw new TransportError(
          `The ephemeris endpoint returned a body that is not JSON (HTTP ${String(
            response.status,
          )}, content-type ${response.headers.get('content-type') ?? 'unknown'}). ` +
            'This usually means the request did not reach the API. First bytes: ' +
            JSON.stringify(text.slice(0, 120)),
          { cause },
        );
      }

      if (response.ok && envelope.data !== undefined) return envelope.data;

      if (response.ok) {
        throw new AdapterError(
          'The ephemeris endpoint returned a success status with no chart data in the envelope.',
        );
      }

      lastError = mapError(response.status, envelope.errors?.[0], response.headers);
      if (RETRYABLE_STATUSES.has(response.status) && attempt < this.#maxAttempts) {
        await this.#backoff(attempt, response.headers.get('retry-after'));
        continue;
      }
      throw lastError;
    }

    throw lastError ?? new TransportError('The ephemeris request failed for an unknown reason.');
  }

  async #backoff(attempt: number, retryAfter: string | null | undefined): Promise<void> {
    const fromHeader = retryAfter === null || retryAfter === undefined ? NaN : Number(retryAfter);
    const ms = Number.isFinite(fromHeader)
      ? fromHeader * 1000
      : this.#retryBaseMs * 2 ** (attempt - 1);
    if (ms <= 0) return;
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * The cache key: every input that can change the result.
 *
 * Bodies are sorted because ordering does not change the response, and a
 * partial key that collided across house systems or ayanamshas would hand back
 * a chart in the wrong frame.
 */
function cacheKey(r: ChartRequest): string {
  return JSON.stringify([
    r.instant,
    r.lat,
    r.lng,
    r.houseSystem,
    r.sidereal ?? null,
    r.node,
    [...r.bodies].sort(),
  ]);
}

function mapError(
  status: number,
  detail: UpstreamErrorDetail | undefined,
  headers: Headers,
): AstrologyError {
  const message = detail?.message ?? `The ephemeris API returned HTTP ${String(status)}.`;
  const options = { upstream: detail };

  switch (status) {
    case 401:
      return new AuthError(`${message} Check the key in the Morphemeris dashboard.`, options);
    case 403:
      return new OriginError(message, options);
    case 402:
      return new InsufficientCreditsError(
        `${message} Add credits in the Morphemeris dashboard.`,
        options,
      );
    case 429: {
      const retryAfter = Number(headers.get('retry-after'));
      return new RateLimitError(message, {
        ...options,
        retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : undefined,
      });
    }
    case 503:
      return new ServiceUnavailableError(message, options);
    default:
      return new UpstreamError(message, options);
  }
}
