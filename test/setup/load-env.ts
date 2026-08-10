import { existsSync, readFileSync } from 'node:fs';

/**
 * Loads `.env.local` into `process.env` for local runs.
 *
 * Only `MORPHEMERIS_API_KEY` matters, and only to the live-API suite, which
 * gates itself on the variable's presence. CI has no `.env.local` and no
 * secret, so the live suite no-ops there — that is intended, not a gap.
 *
 * Existing environment variables win, so an explicitly exported key overrides
 * the file.
 */
const ENV_FILE = '.env.local';

if (existsSync(ENV_FILE)) {
  for (const rawLine of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    process.env[key] ??= value;
  }
}
