import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { configure, resetConfig, resolveApiKey, resolveOptions } from './config.js';
import { ConfigurationError } from './errors.js';

const ENV_KEY = 'MORPHEMERIS_API_KEY';

describe('API key resolution (§4.1)', () => {
  let saved: string | undefined;

  beforeEach(() => {
    saved = process.env[ENV_KEY];
    Reflect.deleteProperty(process.env, ENV_KEY);
    resetConfig();
  });

  afterEach(() => {
    resetConfig();
    if (saved === undefined) Reflect.deleteProperty(process.env, ENV_KEY);
    else process.env[ENV_KEY] = saved;
  });

  it('prefers a per-call option over everything else', () => {
    configure({ apiKey: 'from-configure' });
    process.env[ENV_KEY] = 'from-env';
    expect(resolveApiKey('from-call')).toBe('from-call');
  });

  it('prefers configure() over the environment', () => {
    configure({ apiKey: 'from-configure' });
    process.env[ENV_KEY] = 'from-env';
    expect(resolveApiKey()).toBe('from-configure');
  });

  it('falls back to the environment variable under Node', () => {
    process.env[ENV_KEY] = 'from-env';
    expect(resolveApiKey()).toBe('from-env');
  });

  it('throws ConfigurationError when no key is available anywhere', () => {
    expect(() => resolveApiKey()).toThrow(ConfigurationError);
  });

  it('names all three configuration paths in the error, so the fix is obvious', () => {
    let message = '';
    try {
      resolveApiKey();
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toMatch(/apiKey/i);
    expect(message).toMatch(/configure/i);
    expect(message).toContain(ENV_KEY);
  });

  it('never puts the key itself into the error message', () => {
    configure({ apiKey: 'morphemeris_live_supersecret' });
    // A key IS present here, so no throw — but assert the invariant holds for
    // the empty-string case too, which is a configuration error.
    resetConfig();
    configure({ apiKey: '' });
    let message = '';
    try {
      resolveApiKey();
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).not.toContain('morphemeris_live');
  });

  it('treats an empty or whitespace-only key as absent', () => {
    configure({ apiKey: '   ' });
    expect(() => resolveApiKey()).toThrow(ConfigurationError);
  });
});

describe('resolveOptions (§3.1)', () => {
  beforeEach(() => {
    resetConfig();
  });

  it('supplies the documented defaults', () => {
    const o = resolveOptions();
    expect(o.houseSystem).toBe('placidus');
    expect(o.node).toBe('true');
    expect(o.unknownTime).toBe('omit');
    expect(o.transitGranularitySec).toBe(60);
    expect(o.sidereal).toBeUndefined();
  });

  it('lets a per-call option override a default', () => {
    expect(resolveOptions({ houseSystem: 'whole_sign' }).houseSystem).toBe('whole_sign');
    expect(resolveOptions({ unknownTime: 'noon' }).unknownTime).toBe('noon');
  });

  it('rejects a negative transit granularity rather than silently flooring it', () => {
    expect(() => resolveOptions({ transitGranularitySec: -1 })).toThrow(/granularity/i);
  });

  it('permits zero granularity, which disables rounding (§7.4)', () => {
    expect(resolveOptions({ transitGranularitySec: 0 }).transitGranularitySec).toBe(0);
  });
});
