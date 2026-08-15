import { describe, expect, it } from 'vitest';

import {
  BODY_REGISTRY,
  apiIdFor,
  bodyDefinition,
  derivedBodies,
  isMajor,
  isRetrograde,
  isSupportedBody,
  majorBodies,
  requestedApiIds,
} from './bodies.js';
import { UnsupportedBodyError } from './errors.js';

describe('the body registry', () => {
  it('is a data table, so adding a body is a table entry (§6.2)', () => {
    // The DoD requires that adding a body needs no type change, union member,
    // or switch edit. A runtime array is the shape that makes that true.
    expect(Array.isArray(BODY_REGISTRY)).toBe(true);
    expect(BODY_REGISTRY.length).toBeGreaterThan(15);
    for (const def of BODY_REGISTRY) {
      expect(typeof def.name).toBe('string');
      expect(typeof def.major).toBe('boolean');
    }
  });

  it('has no duplicate names', () => {
    const names = BODY_REGISTRY.map((d) => d.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('covers the ten classical bodies plus both nodes', () => {
    for (const name of [
      'sun',
      'moon',
      'mercury',
      'venus',
      'mars',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
      'pluto',
      'north node',
      'south node',
    ]) {
      expect(isSupportedBody(name)).toBe(true);
    }
  });

  it('marks exactly the major set as major (Appendix A)', () => {
    expect(majorBodies().sort()).toEqual(
      [
        'sun',
        'moon',
        'mercury',
        'venus',
        'mars',
        'jupiter',
        'saturn',
        'uranus',
        'neptune',
        'pluto',
        'north node',
        'south node',
      ].sort(),
    );
  });

  it('does not claim the five bodies Morphemeris cannot supply (§1.4)', () => {
    for (const name of ['eris', 'chariklo', 'chaos', 'nessus', 'cupido']) {
      expect(isSupportedBody(name)).toBe(false);
    }
  });

  it('uses the API identifiers the API actually accepts', () => {
    // Verified against GET /v1/list_available_values on 2026-08-10. The
    // osculating apogee is `osc_apogee`, not `osculating_apogee`.
    expect(apiIdFor('lilith', 'true')).toBe('mean_apogee');
    expect(apiIdFor('osculating lilith', 'true')).toBe('osc_apogee');
    expect(apiIdFor('chiron', 'true')).toBe('chiron');
  });
});

describe('node selection', () => {
  it('resolves the north node against ChartOptions.node', () => {
    expect(apiIdFor('north node', 'true')).toBe('true_node');
    expect(apiIdFor('north node', 'mean')).toBe('mean_node');
  });

  it('never requests the south node from the API — it is derived', () => {
    expect(apiIdFor('south node', 'true')).toBeUndefined();
  });
});

describe('derivedBodies', () => {
  it('reports the south node as derived from the north node', () => {
    const derived = derivedBodies();
    expect(derived.map((d) => d.name)).toContain('south node');
    const southNode = derived.find((d) => d.name === 'south node');
    expect(southNode?.source.kind).toBe('derived');
    if (southNode?.source.kind === 'derived') {
      expect(southNode.source.from).toBe('north node');
    }
  });
});

describe('requestedApiIds', () => {
  it('maps a body list to the API identifiers to request, skipping derived ones', () => {
    const ids = requestedApiIds(['sun', 'north node', 'south node'], 'true');
    expect(ids).toEqual(['sun', 'true_node']);
  });

  it('includes the source body when only its derivative was asked for', () => {
    // A caller who wants the south node needs the north node fetched to build
    // it, even though they never asked for the north node.
    expect(requestedApiIds(['south node'], 'mean')).toEqual(['mean_node']);
  });

  it('does not request the same identifier twice', () => {
    expect(requestedApiIds(['north node', 'south node'], 'true')).toEqual(['true_node']);
  });

  it('throws UnsupportedBodyError naming the body, rather than silently dropping it', () => {
    expect(() => requestedApiIds(['sun', 'eris'], 'true')).toThrow(UnsupportedBodyError);
    expect(() => requestedApiIds(['sun', 'eris'], 'true')).toThrow(/eris/);
  });
});

describe('bodyDefinition', () => {
  it('returns undefined for an unknown body rather than throwing', () => {
    expect(bodyDefinition('nibiru')).toBeUndefined();
  });

  it('is case-insensitive, since callers type body names by hand', () => {
    expect(bodyDefinition('SUN')?.name).toBe('sun');
    expect(bodyDefinition('North Node')?.name).toBe('north node');
  });
});

describe('isRetrograde', () => {
  // Spec §3.4 lists this as a behavior of Planet. 1.x had it too, and got it
  // for free from a `speed` the adapter did not require — so a response
  // missing speed made every body prograde. Here speed is mandatory (§9.2).
  it('is true exactly when the body is moving backwards through the zodiac', () => {
    expect(isRetrograde({ speed: -0.24 })).toBe(true);
    expect(isRetrograde({ speed: 0.98 })).toBe(false);
  });

  it('treats a stationary body as direct rather than retrograde', () => {
    // Exactly zero is a station, not retrograde motion. The boundary is worth
    // pinning because `<= 0` reads just as natural as `< 0`.
    expect(isRetrograde({ speed: 0 })).toBe(false);
  });
});

describe('isMajor', () => {
  it('covers the bodies a chart reading normally shows, nodes included', () => {
    // The major set is Sun through Pluto *plus both nodes* (Appendix A) — it is
    // "what a reading shows", not "what orbits the Sun".
    expect(isMajor({ name: 'sun' })).toBe(true);
    expect(isMajor({ name: 'pluto' })).toBe(true);
    expect(isMajor({ name: 'north node' })).toBe(true);
    expect(isMajor({ name: 'south node' })).toBe(true);
    expect(isMajor({ name: 'chiron' })).toBe(false);
    expect(isMajor({ name: 'lilith' })).toBe(false);
    expect(isMajor({ name: 'ceres' })).toBe(false);
  });

  it('is false for a body the registry does not carry', () => {
    expect(isMajor({ name: 'nibiru' })).toBe(false);
  });

  it('agrees with the registry, so the two cannot drift apart', () => {
    for (const definition of BODY_REGISTRY) {
      expect(isMajor({ name: definition.name }), definition.name).toBe(definition.major);
    }
  });
});
