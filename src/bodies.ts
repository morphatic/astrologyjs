/**
 * The body registry.
 *
 * This is a **runtime data table**, not a union of literal types with a switch
 * somewhere. The contract requires that adding a body — when Morphemeris starts
 * carrying Eris, say — is a table entry and a minor release, with no type
 * change and no control-flow edit anywhere. See spec §6.2 and §1.6.
 *
 * API identifiers were verified against `list_available_values` on 2026-08-10.
 * Two are easy to get wrong from the spec alone: the osculating apogee is
 * `osc_apogee` (not `osculating_apogee`), and the API's `planets` group already
 * contains `mean_node`, so the true node must always be requested by name.
 */
import { UnsupportedBodyError } from './errors.js';

/** Which lunar node the chart uses. Mirrors `ChartOptions.node`. */
export type NodeChoice = 'true' | 'mean';

/** How a body's position is obtained. */
export type BodySource =
  /** Fetched from the API under a fixed identifier. */
  | { readonly kind: 'api'; readonly id: string }
  /** Fetched from the API, but which identifier depends on the node choice. */
  | { readonly kind: 'api-node'; readonly true: string; readonly mean: string }
  /** Computed from another body rather than fetched. */
  | { readonly kind: 'derived'; readonly from: string; readonly transform: 'opposite' };

export interface BodyDefinition {
  /** Canonical lowercase name, as it appears on `Planet.name`. */
  readonly name: string;
  /** Whether this is one of the bodies a chart reading normally shows. */
  readonly major: boolean;
  readonly source: BodySource;
}

/**
 * Every body the library supports.
 *
 * Deliberately absent: `eris`, `chariklo`, `chaos`, `nessus`, `cupido`. 1.x
 * listed them; Morphemeris does not carry them. The contract forbids declaring
 * a body the backend cannot fill (§1.4). When the API gains them, they arrive
 * here and nowhere else.
 */
export const BODY_REGISTRY: readonly BodyDefinition[] = [
  { name: 'sun', major: true, source: { kind: 'api', id: 'sun' } },
  { name: 'moon', major: true, source: { kind: 'api', id: 'moon' } },
  { name: 'mercury', major: true, source: { kind: 'api', id: 'mercury' } },
  { name: 'venus', major: true, source: { kind: 'api', id: 'venus' } },
  { name: 'mars', major: true, source: { kind: 'api', id: 'mars' } },
  { name: 'jupiter', major: true, source: { kind: 'api', id: 'jupiter' } },
  { name: 'saturn', major: true, source: { kind: 'api', id: 'saturn' } },
  { name: 'uranus', major: true, source: { kind: 'api', id: 'uranus' } },
  { name: 'neptune', major: true, source: { kind: 'api', id: 'neptune' } },
  { name: 'pluto', major: true, source: { kind: 'api', id: 'pluto' } },
  {
    name: 'north node',
    major: true,
    source: { kind: 'api-node', true: 'true_node', mean: 'mean_node' },
  },
  {
    name: 'south node',
    major: true,
    source: { kind: 'derived', from: 'north node', transform: 'opposite' },
  },
  { name: 'lilith', major: false, source: { kind: 'api', id: 'mean_apogee' } },
  { name: 'osculating lilith', major: false, source: { kind: 'api', id: 'osc_apogee' } },
  { name: 'chiron', major: false, source: { kind: 'api', id: 'chiron' } },
  { name: 'pholus', major: false, source: { kind: 'api', id: 'pholus' } },
  { name: 'ceres', major: false, source: { kind: 'api', id: 'ceres' } },
  { name: 'pallas', major: false, source: { kind: 'api', id: 'pallas' } },
  { name: 'juno', major: false, source: { kind: 'api', id: 'juno' } },
  { name: 'vesta', major: false, source: { kind: 'api', id: 'vesta' } },
];

const BY_NAME = new Map(BODY_REGISTRY.map((d) => [d.name, d]));

/** Looks a body up by name, case-insensitively. Returns undefined if unknown. */
export function bodyDefinition(name: string): BodyDefinition | undefined {
  return BY_NAME.get(name.trim().toLowerCase());
}

export function isSupportedBody(name: string): boolean {
  return bodyDefinition(name) !== undefined;
}

/** Names of every body in the major set. */
export function majorBodies(): string[] {
  return BODY_REGISTRY.filter((d) => d.major).map((d) => d.name);
}

/** Every body that is computed rather than fetched. */
export function derivedBodies(): readonly BodyDefinition[] {
  return BODY_REGISTRY.filter((d) => d.source.kind === 'derived');
}

/** All supported body names, for the default request set. */
export function allBodyNames(): string[] {
  return BODY_REGISTRY.map((d) => d.name);
}

/**
 * The API identifier for a body, or `undefined` when the body is derived and
 * therefore never requested.
 */
export function apiIdFor(name: string, node: NodeChoice): string | undefined {
  const def = bodyDefinition(name);
  if (def === undefined) return undefined;
  switch (def.source.kind) {
    case 'api':
      return def.source.id;
    case 'api-node':
      return node === 'true' ? def.source.true : def.source.mean;
    case 'derived':
      return undefined;
  }
}

/**
 * The de-duplicated list of API identifiers needed to satisfy a body request.
 *
 * Derived bodies contribute their source instead of themselves, so asking for
 * the south node alone still fetches the north node.
 *
 * @throws UnsupportedBodyError naming the body, rather than silently returning
 * a chart with fewer bodies than were asked for (§6.2).
 */
export function requestedApiIds(names: readonly string[], node: NodeChoice): string[] {
  const ids: string[] = [];

  const addFor = (name: string): void => {
    const def = bodyDefinition(name);
    if (def === undefined) throw new UnsupportedBodyError(name);
    if (def.source.kind === 'derived') {
      addFor(def.source.from);
      return;
    }
    const id = apiIdFor(def.name, node);
    if (id !== undefined && !ids.includes(id)) ids.push(id);
  };

  for (const name of names) addFor(name);
  return ids;
}

/**
 * Whether a body is moving backwards through the zodiac.
 *
 * A behavior of `Planet` in spec §3.4, expressed as a function over the record
 * rather than a method on it, because `Planet` is plain data — the adapter
 * builds derived bodies by spreading their source, and methods do not survive
 * a spread.
 *
 * A station (`speed === 0`) is direct, not retrograde.
 */
export function isRetrograde(body: { readonly speed: number }): boolean {
  return body.speed < 0;
}

/**
 * Whether a body is one of the classical set — Sun through Pluto.
 *
 * Reads the registry rather than a second list, so the two cannot drift apart
 * when a body is added (§1.6). Unknown bodies are not major.
 */
export function isMajor(body: { readonly name: string }): boolean {
  return bodyDefinition(body.name)?.major ?? false;
}
