/**
 * The library's error hierarchy.
 *
 * Every failure the library raises is an {@link AstrologyError} subclass, so a
 * caller can catch the situation they care about rather than switch on a string
 * code. The classes mirror the contract's §10.1 table.
 *
 * Two rules govern everything here:
 *
 * - **Distinct situations get distinct classes.** `InsufficientCreditsError`
 *   and `RateLimitError` are the motivating pair: one needs a purchase, the
 *   other needs a wait, and collapsing them forces every caller into a switch.
 * - **No secret ever reaches an error.** Messages, properties, and causes never
 *   carry an API key, a request URL, or a header. Enforced by test.
 */

/** An error detail as the Morphemeris API reports it, preserved verbatim. */
export interface UpstreamErrorDetail {
  readonly code: string;
  readonly message: string;
  /** The offending parameter, when the API identifies one. */
  readonly param?: string | undefined;
}

/** One of the two instants an ambiguous local time could mean. */
export interface InstantCandidate {
  /** UTC instant, ISO 8601. */
  readonly instant: string;
  /** Offset from UTC in minutes, east-positive. */
  readonly offsetMinutes: number;
}

export interface AstrologyErrorOptions {
  readonly cause?: unknown;
  readonly upstream?: UpstreamErrorDetail | undefined;
}

/**
 * Base class for every error this library throws.
 *
 * `code` is stable and machine-readable; `retryable` says whether repeating the
 * identical call could plausibly succeed.
 */
export class AstrologyError extends Error {
  /** Stable machine-readable identifier for this failure class. */
  readonly code: string = 'astrology_error';

  /** Whether repeating the identical request could plausibly succeed. */
  readonly retryable: boolean = false;

  /** The upstream API's own error detail, when the failure originated there. */
  readonly upstream?: UpstreamErrorDetail | undefined;

  constructor(message: string, options: AstrologyErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = new.target.name;
    this.upstream = options.upstream;
  }
}

/** Missing API key, or a string place with no geocoder configured. */
export class ConfigurationError extends AstrologyError {
  override readonly code = 'configuration';
}

/** Caller-supplied input the library rejects before doing any work. */
export class ValidationError extends AstrologyError {
  override readonly code = 'validation';
}

/**
 * A local wall-clock time that occurs twice, because a DST transition moved the
 * clock backward over it.
 *
 * The library never picks one. Both candidates travel on the error so the
 * caller can re-call with an explicit `offsetMinutes`.
 */
export class AmbiguousTimeError extends AstrologyError {
  override readonly code = 'ambiguous_time';

  readonly candidates: readonly InstantCandidate[];

  constructor(
    message: string,
    options: AstrologyErrorOptions & { readonly candidates: readonly InstantCandidate[] },
  ) {
    const detail = options.candidates.map((c) => c.instant).join(' or ');
    super(`${message} (candidates: ${detail})`, options);
    this.candidates = options.candidates;
  }
}

/**
 * A local wall-clock time that never occurred, because a DST transition moved
 * the clock forward over it.
 */
export class NonexistentTimeError extends AstrologyError {
  override readonly code = 'nonexistent_time';

  /** UTC instant at which the skipped interval begins. */
  readonly gapStart: string;

  /** UTC instant at which the skipped interval ends. */
  readonly gapEnd: string;

  constructor(
    message: string,
    options: AstrologyErrorOptions & { readonly gapStart: string; readonly gapEnd: string },
  ) {
    super(`${message} (gap: ${options.gapStart} to ${options.gapEnd})`, options);
    this.gapStart = options.gapStart;
    this.gapEnd = options.gapEnd;
  }
}

/** A body that is not in the registry — names the body rather than failing generically. */
export class UnsupportedBodyError extends AstrologyError {
  override readonly code = 'unsupported_body';

  readonly body: string;

  constructor(body: string, options: AstrologyErrorOptions = {}) {
    super(`Unsupported body: ${body}`, options);
    this.body = body;
  }
}

/** HTTP 401 — the key is missing, malformed, or revoked. */
export class AuthError extends AstrologyError {
  override readonly code = 'auth';
}

/** HTTP 403 — the request's origin is not permitted for this key. */
export class OriginError extends AstrologyError {
  override readonly code = 'origin';
}

/** HTTP 402 — the account is out of credits. Distinct from being rate limited. */
export class InsufficientCreditsError extends AstrologyError {
  override readonly code = 'insufficient_credits';
}

/** HTTP 429 — too many requests. Distinct from being out of credits. */
export class RateLimitError extends AstrologyError {
  override readonly code = 'rate_limit';
  override readonly retryable = true;

  /** Seconds to wait, when the API sends `Retry-After`. */
  readonly retryAfterSeconds?: number | undefined;

  constructor(
    message: string,
    options: AstrologyErrorOptions & { readonly retryAfterSeconds?: number | undefined } = {},
  ) {
    super(message, options);
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

/** A 4xx or 5xx the API reported that has no more specific class. */
export class UpstreamError extends AstrologyError {
  override readonly code = 'upstream';
}

/** HTTP 503 — ephemeris data could not be loaded. Worth retrying. */
export class ServiceUnavailableError extends AstrologyError {
  override readonly code = 'service_unavailable';
  override readonly retryable = true;
}

/**
 * The response was well-formed HTTP but violated an invariant the adapter
 * requires — a missing body, an absent `speed`, an out-of-range longitude.
 *
 * Never retryable: the same request would produce the same bad response.
 */
export class AdapterError extends AstrologyError {
  override readonly code = 'adapter';
}

/**
 * The request never produced a usable response: a network failure, a timeout,
 * or a body that was not JSON.
 *
 * The non-JSON case exists specifically so 1.x's `Unexpected token <` can never
 * recur. When an ephemeris endpoint starts answering with an HTML redirect
 * page, the error must say so.
 */
export class TransportError extends AstrologyError {
  override readonly code = 'transport';
  override readonly retryable = true;
}
