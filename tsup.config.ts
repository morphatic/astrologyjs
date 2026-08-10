import { defineConfig } from 'tsup';

// ESM only. See plinth/specs/astrologyjs.nlspec.md §1.6 and the rationale's
// "Why ESM-only instead of dual ESM + CJS?" — Node 18 is EOL, 20.19+/22.12+
// support require(esm), and a CJS twin would give the class-based domain model
// two identities. Adding `'cjs'` here is the one-line escape hatch if a real
// user reports a concrete break; do not add it on speculation.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  target: 'node20',
  platform: 'neutral',
  // Declarations come from `tsc -p tsconfig.build.json`, not from tsup.
  // tsup emits .d.ts via rollup-plugin-dts, whose TypeScript peer range is
  // `^4.5 || ^5.0`; this project is on TS 6, and the mismatch made it resolve a
  // stale bundled compiler and crash on `useCaseSensitiveFileNames`. tsc is the
  // supported path and needs no extra plugin.
  dts: false,
  sourcemap: true,
  treeshake: true,
  clean: false,
});
