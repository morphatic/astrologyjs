import { describe, expect, it, vi } from 'vitest';

import {
  AdapterError,
  AuthError,
  InsufficientCreditsError,
  OriginError,
  RateLimitError,
  ServiceUnavailableError,
  TransportError,
  UpstreamError,
} from '../errors.js';
import { EphemerisClient, type ChartRequest } from './client.js';
import type { WireChartData } from './types.js';

const CHART: WireChartData = {
  positions: [{ body: 'sun', longitude: 10, latitude: 0, distance: 1, speed: 1 }],
  houses: {
    system: 'Placidus',
    cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
    ascendant: 0,
    midheaven: 270,
    armc: 269,
    vertex: 100,
  },
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function request(overrides: Partial<ChartRequest> = {}): ChartRequest {
  return {
    instant: '1974-02-17T23:30:00.000Z',
    lat: 37.44,
    lng: -79.19,
    houseSystem: 'placidus',
    bodies: ['sun'],
    node: 'true',
    ...overrides,
  };
}

function clientWith(fetchImpl: ReturnType<typeof vi.fn>): EphemerisClient {
  // retryBaseMs 0 so the suite does not pay real backoff seconds.
  return new EphemerisClient({
    apiKey: 'morphemeris_live_test',
    fetch: fetchImpl as never,
    retryBaseMs: 0,
  });
}

describe('EphemerisClient', () => {
  it('sends the key as a bearer token and never in the query string', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => jsonResponse({ data: CHART }));
    await clientWith(fetchImpl).fetchChart(request());

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain('morphemeris_live_test');
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toBe('Bearer morphemeris_live_test');
  });

  it('returns the chart payload from inside the envelope', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => jsonResponse({ data: CHART }));
    await expect(clientWith(fetchImpl).fetchChart(request())).resolves.toEqual(CHART);
  });

  describe('error mapping (§10.1)', () => {
    const cases: [number, string, new (...args: never[]) => Error][] = [
      [401, 'invalid_api_key', AuthError],
      [403, 'origin_not_allowed', OriginError],
      [402, 'insufficient_credits', InsufficientCreditsError],
      [400, 'invalid_parameter', UpstreamError],
      [404, 'unknown_house_system', UpstreamError],
    ];

    for (const [status, code, Cls] of cases) {
      it(`maps ${String(status)} ${code}`, async () => {
        const fetchImpl = vi
          .fn()
          .mockImplementation(() =>
            jsonResponse({ errors: [{ code, message: 'nope', param: 'lat' }] }, status),
          );
        await expect(clientWith(fetchImpl).fetchChart(request())).rejects.toBeInstanceOf(Cls);
      });
    }

    it('preserves the upstream code, message and param', async () => {
      const fetchImpl = vi
        .fn()
        .mockImplementation(() =>
          jsonResponse(
            { errors: [{ code: 'invalid_parameter', message: 'lat out of range', param: 'lat' }] },
            400,
          ),
        );
      await expect(clientWith(fetchImpl).fetchChart(request())).rejects.toMatchObject({
        upstream: { code: 'invalid_parameter', message: 'lat out of range', param: 'lat' },
      });
    });

    it('names the problem when the body is not JSON, never "Unexpected token <"', async () => {
      // The exact 1.x failure: an HTTP redirect page parsed as JSON. Six years
      // of issue reports came down to an error that named the parser instead of
      // the problem.
      const fetchImpl = vi.fn().mockResolvedValue(
        new Response('<html><head><title>301 Moved Permanently</title></head>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      );
      const promise = clientWith(fetchImpl).fetchChart(request());
      await expect(promise).rejects.toBeInstanceOf(TransportError);
      await expect(promise).rejects.toThrow(/not JSON|HTML|301/i);
    });

    it('wraps a network failure as TransportError', async () => {
      const fetchImpl = vi.fn().mockRejectedValue(new Error('socket hang up'));
      await expect(clientWith(fetchImpl).fetchChart(request())).rejects.toBeInstanceOf(
        TransportError,
      );
    });

    it('throws AdapterError when the envelope carries no data at all', async () => {
      const fetchImpl = vi.fn().mockImplementation(() => jsonResponse({ meta: {} }));
      await expect(clientWith(fetchImpl).fetchChart(request())).rejects.toBeInstanceOf(
        AdapterError,
      );
    });

    it('never puts the API key into any error it throws', async () => {
      const fetchImpl = vi.fn().mockRejectedValue(new Error('socket hang up'));
      try {
        await clientWith(fetchImpl).fetchChart(request());
        expect.unreachable('should have thrown');
      } catch (err) {
        const serialized = `${(err as Error).message} ${JSON.stringify(err)} ${String(
          (err as Error).stack,
        )}`;
        expect(serialized).not.toContain('morphemeris_live_test');
      }
    });
  });

  describe('retry (§9.4)', () => {
    it('retries 429 and honours Retry-After', async () => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({ errors: [{ code: 'rate_limit_exceeded', message: 'slow' }] }, 429, {
            'retry-after': '0',
          }),
        )
        .mockResolvedValueOnce(jsonResponse({ data: CHART }));
      await expect(clientWith(fetchImpl).fetchChart(request())).resolves.toEqual(CHART);
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it('retries 503', async () => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({ errors: [{ code: 'data_unavailable', message: 'r2' }] }, 503),
        )
        .mockResolvedValueOnce(jsonResponse({ data: CHART }));
      await expect(clientWith(fetchImpl).fetchChart(request())).resolves.toEqual(CHART);
    });

    it('gives up after the attempt limit and throws the mapped error', async () => {
      const fetchImpl = vi.fn().mockImplementation(() =>
        jsonResponse({ errors: [{ code: 'rate_limit_exceeded', message: 'slow' }] }, 429, {
          'retry-after': '0',
        }),
      );
      await expect(clientWith(fetchImpl).fetchChart(request())).rejects.toBeInstanceOf(
        RateLimitError,
      );
      expect(fetchImpl).toHaveBeenCalledTimes(3);
    });

    it('never retries a deterministic 4xx', async () => {
      const fetchImpl = vi
        .fn()
        .mockImplementation(() =>
          jsonResponse({ errors: [{ code: 'invalid_api_key', message: 'bad key' }] }, 401),
        );
      await expect(clientWith(fetchImpl).fetchChart(request())).rejects.toBeInstanceOf(AuthError);
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it('surfaces ServiceUnavailableError when 503 never clears', async () => {
      const fetchImpl = vi
        .fn()
        .mockImplementation(() =>
          jsonResponse({ errors: [{ code: 'data_unavailable', message: 'r2' }] }, 503),
        );
      await expect(clientWith(fetchImpl).fetchChart(request())).rejects.toBeInstanceOf(
        ServiceUnavailableError,
      );
    });
  });

  describe('deduplication (§9.3)', () => {
    it('serves an identical repeat request from cache, spending no second credit', async () => {
      const fetchImpl = vi.fn().mockImplementation(() => jsonResponse({ data: CHART }));
      const client = clientWith(fetchImpl);
      await client.fetchChart(request());
      await client.fetchChart(request());
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it('coalesces CONCURRENT identical requests into one', async () => {
      // The case a resolved-value cache misses entirely: both calls miss before
      // either stores. A Synastry chart for two people born in the same place
      // at the same instant does exactly this.
      const fetchImpl = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(jsonResponse({ data: CHART }));
            }, 10);
          }),
      );
      const client = clientWith(fetchImpl);
      await Promise.all([client.fetchChart(request()), client.fetchChart(request())]);
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it('treats a different frame as a different request', async () => {
      const fetchImpl = vi.fn().mockImplementation(() => jsonResponse({ data: CHART }));
      const client = clientWith(fetchImpl);
      await client.fetchChart(request());
      await client.fetchChart(request({ houseSystem: 'koch' }));
      await client.fetchChart(request({ sidereal: 'lahiri' }));
      await client.fetchChart(request({ node: 'mean' }));
      expect(fetchImpl).toHaveBeenCalledTimes(4);
    });

    it('is insensitive to body ordering, which does not change the result', async () => {
      const fetchImpl = vi.fn().mockImplementation(() => jsonResponse({ data: CHART }));
      const client = clientWith(fetchImpl);
      await client.fetchChart(request({ bodies: ['sun', 'moon'] }));
      await client.fetchChart(request({ bodies: ['moon', 'sun'] }));
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it('evicts a rejected request so a transient failure is retryable', async () => {
      // maxAttempts 1 so the transport failure surfaces instead of being
      // retried away — transport errors are retryable, which is why the first
      // call would otherwise succeed on its second attempt.
      const fetchImpl = vi
        .fn()
        .mockRejectedValueOnce(new Error('socket hang up'))
        .mockImplementation(() => jsonResponse({ data: CHART }));
      const client = new EphemerisClient({
        apiKey: 'k',
        fetch: fetchImpl as never,
        maxAttempts: 1,
        retryBaseMs: 0,
      });
      await expect(client.fetchChart(request())).rejects.toBeInstanceOf(TransportError);
      // A cached rejection would replay the same error here forever.
      await expect(client.fetchChart(request())).resolves.toEqual(CHART);
    });

    it('can be disabled', async () => {
      const fetchImpl = vi.fn().mockImplementation(() => jsonResponse({ data: CHART }));
      const client = new EphemerisClient({
        apiKey: 'k',
        fetch: fetchImpl as never,
        cache: false,
      });
      await client.fetchChart(request());
      await client.fetchChart(request());
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });
  });
});
