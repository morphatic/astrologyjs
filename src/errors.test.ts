import { describe, expect, it } from 'vitest';

import {
  AdapterError,
  AmbiguousTimeError,
  AstrologyError,
  AuthError,
  ConfigurationError,
  InsufficientCreditsError,
  NonexistentTimeError,
  OriginError,
  RateLimitError,
  ServiceUnavailableError,
  TransportError,
  UnsupportedBodyError,
  UpstreamError,
  ValidationError,
} from './errors.js';

const ALL = [
  ConfigurationError,
  ValidationError,
  AmbiguousTimeError,
  NonexistentTimeError,
  UnsupportedBodyError,
  AuthError,
  OriginError,
  InsufficientCreditsError,
  RateLimitError,
  UpstreamError,
  ServiceUnavailableError,
  AdapterError,
  TransportError,
] as const;

describe('the error hierarchy', () => {
  it('has the thirteen classes the contract names (§10.1)', () => {
    expect(ALL).toHaveLength(13);
  });

  it('roots every class at AstrologyError and at Error', () => {
    for (const Cls of ALL) {
      const err = Object.create(Cls.prototype) as Error;
      expect(err).toBeInstanceOf(AstrologyError);
      expect(err).toBeInstanceOf(Error);
    }
  });

  it('gives every class a distinct machine-readable code', () => {
    // Constructed with real arguments rather than a cast — the classes that
    // require options require them for a reason.
    const instances: AstrologyError[] = [
      new ConfigurationError('x'),
      new ValidationError('x'),
      new AmbiguousTimeError('x', {
        candidates: [
          { instant: '2024-11-03T05:30:00Z', offsetMinutes: -240 },
          { instant: '2024-11-03T06:30:00Z', offsetMinutes: -300 },
        ],
      }),
      new NonexistentTimeError('x', {
        gapStart: '2024-03-10T07:00:00Z',
        gapEnd: '2024-03-10T08:00:00Z',
      }),
      new UnsupportedBodyError('eris'),
      new AuthError('x'),
      new OriginError('x'),
      new InsufficientCreditsError('x'),
      new RateLimitError('x'),
      new UpstreamError('x'),
      new ServiceUnavailableError('x'),
      new AdapterError('x'),
      new TransportError('x'),
    ];
    expect(instances).toHaveLength(ALL.length);
    expect(new Set(instances.map((e) => e.code)).size).toBe(ALL.length);
  });

  it('sets .name to the class name so stack traces identify the failure', () => {
    expect(new ValidationError('bad').name).toBe('ValidationError');
    expect(new AdapterError('bad').name).toBe('AdapterError');
  });

  it('keeps credits-exhausted and rate-limited as distinct catchable types', () => {
    // The contract calls this out explicitly: to an application these are
    // different situations — one needs a purchase, the other needs a wait.
    const credits = new InsufficientCreditsError('no credits');
    const rate = new RateLimitError('slow down');
    expect(credits).not.toBeInstanceOf(RateLimitError);
    expect(rate).not.toBeInstanceOf(InsufficientCreditsError);
  });

  it('marks exactly the retryable classes retryable', () => {
    expect(new RateLimitError('x').retryable).toBe(true);
    expect(new ServiceUnavailableError('x').retryable).toBe(true);
    expect(new TransportError('x').retryable).toBe(true);

    expect(new AuthError('x').retryable).toBe(false);
    expect(new InsufficientCreditsError('x').retryable).toBe(false);
    expect(new ValidationError('x').retryable).toBe(false);
    expect(new UpstreamError('x').retryable).toBe(false);
    expect(new AdapterError('x').retryable).toBe(false);
  });

  it('preserves the upstream code, message and param verbatim', () => {
    const err = new UpstreamError('Malformed parameter', {
      upstream: { code: 'invalid_parameter', message: 'lat out of range', param: 'lat' },
    });
    expect(err.upstream).toEqual({
      code: 'invalid_parameter',
      message: 'lat out of range',
      param: 'lat',
    });
  });

  it('attaches a cause when one is supplied', () => {
    const cause = new Error('socket hang up');
    expect(new TransportError('network failed', { cause }).cause).toBe(cause);
  });
});

describe('AmbiguousTimeError', () => {
  it('carries both candidate instants and their offsets, so the caller can choose', () => {
    const err = new AmbiguousTimeError('01:30 occurs twice', {
      candidates: [
        { instant: '2024-11-03T05:30:00Z', offsetMinutes: -240 },
        { instant: '2024-11-03T06:30:00Z', offsetMinutes: -300 },
      ],
    });
    expect(err.candidates).toHaveLength(2);
    expect(err.candidates[0]?.instant).toBe('2024-11-03T05:30:00Z');
    expect(err.candidates[1]?.offsetMinutes).toBe(-300);
  });

  it('names both instants in the message, so an uncaught throw is still actionable', () => {
    const err = new AmbiguousTimeError('ambiguous', {
      candidates: [
        { instant: '2024-11-03T05:30:00Z', offsetMinutes: -240 },
        { instant: '2024-11-03T06:30:00Z', offsetMinutes: -300 },
      ],
    });
    expect(err.message).toContain('2024-11-03T05:30:00Z');
    expect(err.message).toContain('2024-11-03T06:30:00Z');
  });
});

describe('NonexistentTimeError', () => {
  it('carries the gap boundaries', () => {
    const err = new NonexistentTimeError('02:30 never happened', {
      gapStart: '2024-03-10T07:00:00Z',
      gapEnd: '2024-03-10T08:00:00Z',
    });
    expect(err.gapStart).toBe('2024-03-10T07:00:00Z');
    expect(err.gapEnd).toBe('2024-03-10T08:00:00Z');
  });
});

describe('UnsupportedBodyError', () => {
  it('names the offending body rather than failing generically', () => {
    const err = new UnsupportedBodyError('eris');
    expect(err.body).toBe('eris');
    expect(err.message).toContain('eris');
  });
});

describe('RateLimitError', () => {
  it('carries retry-after when the API supplies it', () => {
    expect(new RateLimitError('slow down', { retryAfterSeconds: 30 }).retryAfterSeconds).toBe(30);
  });

  it('leaves retry-after undefined when the API omits it', () => {
    expect(new RateLimitError('slow down').retryAfterSeconds).toBeUndefined();
  });
});
