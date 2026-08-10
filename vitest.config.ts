import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    setupFiles: ['test/setup/load-env.ts'],
    // Live tests self-gate on MORPHEMERIS_API_KEY via `describe.runIf(...)`
    // rather than a skip marker — see plinth/specs/astrologyjs.nlspec.md §13.1.
    // They no-op in CI, where no secret is configured.
  },
});
