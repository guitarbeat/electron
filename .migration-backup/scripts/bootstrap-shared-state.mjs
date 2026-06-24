/**
 * Bootstrap missing shared_state_files rows in Neon with default scope content.
 *
 * Loads DATABASE_URL from .env.local when present (same as local dev).
 *
 * Usage:
 *   pnpm bootstrap:state
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { bootstrapMissingScopeFiles } from '../api/_lib/state.ts';

const loadDotEnvLocal = () => {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

const run = async () => {
  loadDotEnvLocal();

  const diagnostics = await bootstrapMissingScopeFiles();

  console.log('Bootstrapped shared state scopes.');
  if (diagnostics.missingScopes.length === 0) {
    console.log('All scopes present:', diagnostics.expectedScopes.join(', '));
    return;
  }

  console.warn('Still missing:', diagnostics.missingScopes.join(', '));
  process.exit(1);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
