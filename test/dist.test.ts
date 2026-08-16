import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createContext, runInContext } from 'node:vm';

import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Tests the built artifacts rather than the source.
 *
 * 1.x's defining failure was a package that installed cleanly and did not work,
 * so "the source is right" is not the bar here. Every entry point package.json
 * advertises is resolved, loaded the way its consumer would load it, and made to
 * produce the notice. The three module formats are genuinely different files and
 * each one can break on its own.
 *
 * `pnpm test` builds first, so `dist/` is always present and none of this is
 * conditional.
 */

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const require = createRequire(import.meta.url);

interface LegacyManifest {
  readonly version: string;
  readonly main: string;
  readonly module: string;
  readonly types: string;
  readonly files: readonly string[];
  readonly dependencies?: Record<string, string>;
  readonly 'jsnext:main': string;
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as LegacyManifest;

let notice: string;

beforeAll(async () => {
  ({ RETIREMENT_NOTICE: notice } = await import('../src/astrologyjs'));
});

describe('the published entry points', () => {
  it('are the same four paths 1.3.1 advertised', () => {
    // Changing any of these would break resolution for someone on `^1.3.1`,
    // which is precisely the person this release exists to reach.
    expect(pkg.main).toBe('dist/astrologyjs.min.js');
    expect(pkg['jsnext:main']).toBe('dist/astrologyjs-es6.js');
    expect(pkg.types).toBe('dist/astrologyjs.d.ts');
  });

  it('all exist in the build output', () => {
    const built = new Set(readdirSync(dist));
    expect(built).toContain('astrologyjs.js');
    expect(built).toContain('astrologyjs.min.js');
    expect(built).toContain('astrologyjs-es6.js');
    expect(built).toContain('astrologyjs.d.ts');
  });
});

describe('the CommonJS build, loaded by require()', () => {
  it('exports the 1.3.1 surface and nothing beyond the notice', () => {
    // Asserted exactly rather than as a subset: an internal leaking into the
    // bundle would be a new public name on a package that is meant to be frozen.
    const loaded: unknown = require(join(root, pkg.main));
    expect(Object.keys(loaded as object).sort()).toEqual(
      [
        'Aspect',
        'Chart',
        'ChartFactory',
        'ChartType',
        'Person',
        'Planet',
        'RETIREMENT_CODE',
        'RETIREMENT_NOTICE',
        'default',
      ].sort(),
    );
  });

  it('throws the notice', () => {
    const { Person } = require(join(root, pkg.main)) as { Person: new (...a: never[]) => unknown };
    expect(() => new Person('x' as never, 'y' as never, {} as never)).toThrow(notice);
  });
});

describe('the ES module build, loaded by import()', () => {
  it('has both the named exports and the default 1.x shipped', async () => {
    const url = pathToFileURL(join(root, pkg['jsnext:main'])).href;
    const loaded = (await import(url)) as Record<string, unknown> & {
      default: Record<string, unknown>;
    };

    for (const name of ['Planet', 'Person', 'Aspect', 'Chart', 'ChartType', 'ChartFactory']) {
      expect(loaded[name], `named export ${name}`).toBeDefined();
      // 1.3.1's default export was an object carrying all six. Dropping it
      // would break `import astrologyjs from 'astrologyjs'` with a resolution
      // error rather than the notice.
      expect(loaded.default[name], `default.${name}`).toBeDefined();
    }
  });

  it('throws the notice', async () => {
    const url = pathToFileURL(join(root, pkg['jsnext:main'])).href;
    const { ChartFactory } = (await import(url)) as {
      ChartFactory: { create: (...a: never[]) => Promise<unknown> };
    };
    await expect(ChartFactory.create('x' as never, null as never)).rejects.toThrow(notice);
  });
});

describe('the UMD build, loaded the two ways that are not require()', () => {
  /** Runs a bundle in a bare context, with only the globals the caller supplies. */
  function runIsolated(file: string, globals: Record<string, unknown>): Record<string, unknown> {
    const context = createContext(globals);
    runInContext(readFileSync(join(dist, file), 'utf8'), context, { filename: file });
    return context;
  }

  it('registers with an AMD loader', () => {
    let registered: Record<string, unknown> | undefined;
    const define = Object.assign(
      (_deps: string[], factory: (exports: Record<string, unknown>) => void) => {
        registered = {};
        factory(registered);
      },
      { amd: true },
    );

    runIsolated('astrologyjs.js', { define });

    expect(registered).toBeDefined();
    expect(typeof registered?.['Person']).toBe('function');
  });

  it('attaches to the global as `astrologyjs` for a plain <script> tag', () => {
    // The last resort path: no module system at all. Someone loading 1.x this
    // way has no package manager telling them anything, so the global has to
    // resolve and the notice has to be reachable from it.
    const globals: Record<string, unknown> = {};
    globals['self'] = globals;
    const context = runIsolated('astrologyjs.js', globals);

    const global = context['astrologyjs'] as { Person: new (...a: never[]) => unknown };
    expect(global).toBeDefined();
    expect(() => new global.Person()).toThrow(notice);
  });

  it('minifies to something materially smaller, so the name is not a lie', () => {
    const full = readFileSync(join(dist, 'astrologyjs.js'), 'utf8').length;
    const min = readFileSync(join(dist, 'astrologyjs.min.js'), 'utf8').length;
    expect(min).toBeLessThan(full);
  });

  it('keeps the notice readable in the minified build', () => {
    // A minifier that mangled or dropped the string would leave the package
    // failing silently again. This is the one thing minification must not touch.
    expect(readFileSync(join(dist, 'astrologyjs.min.js'), 'utf8')).toContain(
      'morphemeris.com/ephemeris.php',
    );
  });
});

describe('what gets shipped', () => {
  it('declares the public types, so a TypeScript consumer still compiles', () => {
    const types = readFileSync(join(root, pkg.types), 'utf8');
    for (const name of ['Planet', 'Person', 'Aspect', 'Chart', 'ChartType', 'ChartFactory']) {
      expect(types, name).toMatch(new RegExp(`declare (class|enum|const) ${name}\\b`));
    }
  });

  it('has no runtime dependencies at all', () => {
    // 1.3.1 depended on `node@0.0.0` and `babel-runtime`. A package that
    // computes nothing should install nothing.
    expect(pkg.dependencies ?? {}).toEqual({});
  });

  it('ships no source and no credential', () => {
    expect(pkg.files).not.toContain('src');
    for (const file of readdirSync(dist)) {
      expect(readFileSync(join(dist, file), 'utf8'), file).not.toMatch(/AIza[0-9A-Za-z_-]{10}/);
    }
  });

  it('is version 1.3.2', () => {
    expect(pkg.version).toBe('1.3.2');
  });
});
