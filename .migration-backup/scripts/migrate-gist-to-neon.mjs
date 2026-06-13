/**
 * One-shot migration: copy legacy GitHub Gist files into Neon shared_state_files.
 *
 * Required env:
 *   DATABASE_URL (or POSTGRES_URL / VITE_DATABASE_URL)
 *   GIST_ID (or VITE_GIST_ID)
 *   GITHUB_TOKEN (or GITHUB_PERSONAL_ACCESS_TOKEN / GH_TOKEN) for private gists
 *
 * Usage:
 *   node scripts/migrate-gist-to-neon.mjs
 */

import { importAllSharedStateFromGist } from '../api/_lib/gistMigration.ts';
import { isGistConfigured } from '../api/_lib/gistStore.ts';
import { isSharedStateConfigured } from '../api/_lib/sharedStateStore.ts';

const run = async () => {
  if (!isSharedStateConfigured()) {
    console.error('DATABASE_URL is not configured.');
    process.exit(1);
  }

  if (!isGistConfigured()) {
    console.error('GIST_ID is not configured.');
    process.exit(1);
  }

  const result = await importAllSharedStateFromGist();

  console.log('Imported:', result.imported.length ? result.imported.join(', ') : '(none)');
  console.log('Skipped:', result.skipped.length ? result.skipped.join(', ') : '(none)');

  if (result.errors.length > 0) {
    console.error('Errors:');
    for (const entry of result.errors) {
      console.error(`  ${entry.filename}: ${entry.message}`);
    }
    process.exit(1);
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
