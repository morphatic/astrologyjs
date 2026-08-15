/**
 * Wire shape to internal shape, plus the derivation layer above it.
 *
 * The adapter is the entire integration surface with Morphemeris. Its
 * invariants exist because every one of them, if relaxed, produces a chart that
 * renders and is wrong — the failure mode §1.2 is organized around.
 */
import { bodyDefinition, type NodeChoice } from '../bodies.js';
import { AdapterError } from '../errors.js';
import { declination, isOutOfBounds, julianDay, trueObliquity } from '../equatorial.js';
import { signDegree, signOf, type SignName } from '../signs.js';
import type { WireChartData } from './types.js';

/** A body position in the library's own shape. */
export interface AdaptedPlanet {
  readonly name: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly speed: number;
  readonly distance: number;
  readonly declination: number;
  readonly outOfBounds: boolean;
  readonly sign: SignName;
  readonly signDegree: number;
  readonly derived: boolean;
  readonly derivedFrom?: string | undefined;
}

export interface ChartWarning {
  readonly code: string;
  readonly message: string;
}

export interface AdaptedChartData {
  readonly planets: readonly AdaptedPlanet[];
  readonly houses?: readonly number[] | undefined;
  readonly ascendant?: number | undefined;
  readonly midheaven?: number | undefined;
  readonly vertex?: number | undefined;
  readonly ayanamsha?: number | undefined;
  readonly warnings: readonly ChartWarning[];
}

export interface AdaptContext {
  /** UTC instant the chart was cast for, needed for obliquity. */
  readonly instant: string;
  readonly node: NodeChoice;
  /** Library body names the caller asked for. */
  readonly requestedBodies: readonly string[];
}

/** Maps an API body identifier back to the library's name for it. */
function libraryNameFor(apiId: string, node: NodeChoice): string | undefined {
  const def = bodyDefinition('north node');
  if (def?.source.kind === 'api-node') {
    const expected = node === 'true' ? def.source.true : def.source.mean;
    if (expected === apiId) return def.name;
  }
  return undefined;
}

function assertFinite(value: number | undefined, label: string, body: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new AdapterError(
      `Body "${body}" arrived without a usable ${label}. ` +
        'The library will not substitute a value; a chart missing this field is wrong, not partial.',
    );
  }
  return value;
}

/**
 * Converts a wire response into the internal shape.
 *
 * @throws AdapterError when a requested body is absent, a position lacks
 * `speed`, a coordinate is out of range, or the cusp array is malformed. None
 * of these is recoverable by degrading the result.
 */
export function adaptChart(wire: WireChartData, context: AdaptContext): AdaptedChartData {
  // True, not mean: `outOfBounds` compares against this, and nutation is worth
  // up to 10 arcseconds — enough to decide the flag for a body on the boundary.
  const obliquity = trueObliquity(julianDay(context.instant));

  const byLibraryName = new Map<string, AdaptedPlanet>();

  for (const position of wire.positions) {
    const name = libraryNameFor(position.body, context.node) ?? nameFromApiId(position.body);
    if (name === undefined) continue; // A body we did not ask for; harmless.

    const longitude = assertFinite(position.longitude, 'longitude', position.body);
    const latitude = assertFinite(position.latitude, 'latitude', position.body);
    // `speed` is mandatory: without it isRetrograde() is false for every body
    // and every applying/separating determination inverts, silently.
    const speed = assertFinite(position.speed, 'speed', position.body);

    if (longitude < 0 || longitude >= 360) {
      throw new AdapterError(
        `Body "${position.body}" reported longitude ${String(longitude)}, outside [0, 360). ` +
          'Refusing to wrap a value that should not have needed wrapping.',
      );
    }
    if (latitude < -90 || latitude > 90) {
      throw new AdapterError(
        `Body "${position.body}" reported latitude ${String(latitude)}, outside [-90, 90].`,
      );
    }

    const dec = declination(longitude, latitude, obliquity);
    byLibraryName.set(name, {
      name,
      longitude,
      latitude,
      speed,
      distance: position.distance,
      declination: dec,
      outOfBounds: isOutOfBounds(dec, obliquity),
      sign: signOf(longitude),
      signDegree: signDegree(longitude),
      derived: false,
    });
  }

  for (const requested of context.requestedBodies) {
    const def = bodyDefinition(requested);
    if (def === undefined || def.source.kind === 'derived') continue;
    if (!byLibraryName.has(def.name)) {
      throw new AdapterError(
        `Requested body "${def.name}" is absent from the ephemeris response. ` +
          'A chart with fewer bodies than were asked for is a silent error, so this throws.',
      );
    }
  }

  const cusps: readonly number[] = wire.houses.cusps;
  if (cusps.length !== 12) {
    throw new AdapterError(
      `Expected 12 house cusps, received ${String(cusps.length)}. ` +
        'A partial house system cannot be rendered honestly.',
    );
  }

  const warnings: ChartWarning[] = [];
  for (const message of wire.houses.warnings ?? []) {
    warnings.push({ code: 'high_latitude_houses', message });
  }

  return {
    planets: [...byLibraryName.values()],
    houses: [...cusps],
    ascendant: wire.houses.ascendant,
    midheaven: wire.houses.midheaven,
    vertex: wire.houses.vertex,
    ayanamsha: wire.ayanamsha,
    warnings,
  };
}

/** Reverse lookup for bodies whose API identifier equals a registry entry's. */
function nameFromApiId(apiId: string): string | undefined {
  const direct = bodyDefinition(apiId);
  if (direct?.source.kind === 'api' && direct.source.id === apiId) return direct.name;
  for (const candidate of [
    'lilith',
    'osculating lilith',
    'chiron',
    'pholus',
    'ceres',
    'pallas',
    'juno',
    'vesta',
  ]) {
    const def = bodyDefinition(candidate);
    if (def?.source.kind === 'api' && def.source.id === apiId) return def.name;
  }
  return undefined;
}

/**
 * Adds derived bodies and drops any body the caller did not ask for.
 *
 * Kept separate from {@link adaptChart} because derivation is not translation:
 * this is where Part of Fortune and any future computed point would plug in.
 */
export function applyDerivations(
  adapted: AdaptedChartData,
  requestedBodies: readonly string[],
): AdaptedChartData {
  const bySource = new Map(adapted.planets.map((p) => [p.name, p]));
  const result = new Map(bySource);

  for (const requested of requestedBodies) {
    const def = bodyDefinition(requested);
    if (def?.source.kind !== 'derived') continue;

    const source = bySource.get(def.source.from);
    if (source === undefined) {
      throw new AdapterError(
        `Cannot derive "${def.name}": its source "${def.source.from}" is not in the response.`,
      );
    }
    result.set(def.name, {
      ...source,
      name: def.name,
      longitude: (source.longitude + 180) % 360,
      latitude: -source.latitude,
      declination: -source.declination,
      sign: signOf(source.longitude + 180),
      signDegree: signDegree(source.longitude + 180),
      derived: true,
      derivedFrom: source.name,
    });
  }

  const wanted = new Set(
    requestedBodies.map((n) => bodyDefinition(n)?.name).filter((n): n is string => n !== undefined),
  );
  return { ...adapted, planets: [...result.values()].filter((p) => wanted.has(p.name)) };
}
