/**
 * Morphemeris wire types.
 *
 * Transcribed from `morphemeris-api.nlspec.md` §3, which is authoritative, and
 * confirmed against a live `POST /v1/chart` on 2026-08-10.
 *
 * Note what is deliberately marked optional-and-ignored: `sign`, `sign_degree`,
 * `declination`, and `out_of_bounds` all arrive on the wire and none is read.
 * The first two are tropical-only. The last two were upstream-wrong when this
 * was written and are correct now (morphemeris#83), but the library still
 * derives them, because a value it computes is one it can prove (§6.5).
 */

export interface WireBodyPosition {
  readonly body: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly distance: number;
  /** Required in practice — the adapter rejects a position without it. */
  speed?: number | undefined;
  /** Present on the wire; ignored. Tropical only. */
  sign?: string | undefined;
  /** Present on the wire; ignored. Tropical only. */
  sign_degree?: number | undefined;
  /** Present on the wire; ignored. Derived from speed instead. */
  readonly retrograde?: boolean | undefined;
  /** Present on the wire; ignored. Derived locally instead — see §6.5. */
  declination?: number | undefined;
  /** Present on the wire; ignored. Derived locally instead — see §6.5. */
  readonly out_of_bounds?: boolean | undefined;
}

export interface WireHouseCusps {
  readonly system: string;
  cusps: readonly number[];
  readonly ascendant: number;
  readonly midheaven: number;
  readonly armc: number;
  readonly vertex: number;
  warnings?: readonly string[] | undefined;
}

export interface WireChartData {
  readonly positions: WireBodyPosition[];
  readonly houses: WireHouseCusps;
  readonly ayanamsha?: number | undefined;
}

export interface WireErrorDetail {
  readonly code: string;
  readonly message: string;
  readonly param?: string | undefined;
}

export interface WireMeta {
  readonly request_id?: string;
  readonly timestamp?: string;
  readonly credits_used?: number;
  readonly credits_remaining?: number;
  readonly computation_ms?: number;
}

/** The envelope every endpoint responds with. */
export interface WireEnvelope<T> {
  readonly data?: T;
  readonly meta?: WireMeta;
  readonly errors?: readonly WireErrorDetail[];
  readonly warnings?: readonly string[];
}
