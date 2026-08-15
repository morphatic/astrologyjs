import { describe, expect, it } from 'vitest';

import * as api from './index.js';

describe('the public API surface', () => {
  it('exports the entry points the contract names', () => {
    expect(typeof api.createPerson).toBe('function');
    expect(typeof api.createChart).toBe('function');
    expect(typeof api.configure).toBe('function');
  });

  it('does not export a data-taking Chart constructor (§2.2)', () => {
    // The wire shape must stay out of the public contract so it can change
    // without a major version.
    expect((api as Record<string, unknown>)['Chart']).toBeUndefined();
  });

  it('exports every error class, so callers can catch by type', () => {
    for (const name of [
      'AstrologyError',
      'ConfigurationError',
      'ValidationError',
      'AmbiguousTimeError',
      'NonexistentTimeError',
      'UnsupportedBodyError',
      'AuthError',
      'OriginError',
      'InsufficientCreditsError',
      'RateLimitError',
      'UpstreamError',
      'ServiceUnavailableError',
      'AdapterError',
      'TransportError',
    ]) {
      expect(typeof (api as Record<string, unknown>)[name], name).toBe('function');
    }
  });

  it('has no Planet.symbol anywhere, since glyphs are documentation now', () => {
    expect((api as Record<string, unknown>)['GLYPHS']).toBeUndefined();
  });

  it('exposes the seven chart types', () => {
    expect(Object.keys(api.ChartType)).toHaveLength(7);
  });
});
