import type { StateScope } from '../../src/services/state/stateTypes.ts';
import { STATE_SCOPES } from '../../src/services/state/stateTypes.ts';
import {
  invalidateGistCache,
  isGistConfigured,
  listGistFilenames,
  readGistFileRecord,
} from './gistStore.ts';
import {
  invalidateSharedStateCache,
  isSharedStateConfigured,
  patchSharedStateFile,
  readSharedStateFileRecord,
} from './sharedStateStore.ts';

export interface GistMigrationResult {
  imported: string[];
  skipped: string[];
  errors: Array<{ filename: string; message: string }>;
}

const ARRAY_SCOPES = new Set<StateScope>([
  'movies',
  'messages',
  'memories',
  'places',
  'suggestions',
  'placeSuggestions',
  'spinHistory',
]);

const hasMeaningfulGistContent = (filename: string, content: string | null): boolean => {
  if (content === null) {
    return false;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.length > 0;
    }
    if (parsed && typeof parsed === 'object') {
      return Object.keys(parsed as Record<string, unknown>).length > 0;
    }
  } catch {
    // Non-JSON payloads are still worth importing verbatim.
  }

  return true;
};

const neonLooksEmpty = async (filename: string): Promise<boolean> => {
  const record = await readSharedStateFileRecord(filename, { bypassCache: true });
  if (!record.exists || record.content === null) {
    return true;
  }

  const trimmed = record.content.trim();
  if (!trimmed) {
    return true;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.length === 0;
    }
    if (parsed && typeof parsed === 'object') {
      return Object.keys(parsed as Record<string, unknown>).length === 0;
    }
  } catch {
    return false;
  }

  return false;
};

const shouldImportFilename = async (filename: string, gistContent: string | null): Promise<boolean> => {
  if (!hasMeaningfulGistContent(filename, gistContent)) {
    return false;
  }

  return neonLooksEmpty(filename);
};

/**
 * Copies one Gist file into Neon when Neon is empty/missing and Gist has data.
 * Returns true when a row was written.
 */
export const importSharedStateFileFromGist = async (filename: string): Promise<boolean> => {
  if (!isGistConfigured() || !isSharedStateConfigured()) {
    return false;
  }

  const gistFile = await readGistFileRecord(filename, { bypassCache: true });
  if (!(await shouldImportFilename(filename, gistFile.content))) {
    return false;
  }

  await patchSharedStateFile(filename, gistFile.content ?? '');
  invalidateSharedStateCache();
  return true;
};

/** Imports every Gist file that has data and a matching empty/missing Neon row. */
export const importAllSharedStateFromGist = async (): Promise<GistMigrationResult> => {
  const result: GistMigrationResult = {
    imported: [],
    skipped: [],
    errors: [],
  };

  if (!isGistConfigured()) {
    return result;
  }

  if (!isSharedStateConfigured()) {
    throw new Error('DATABASE_URL is not configured.');
  }

  invalidateGistCache();

  const filenames = await listGistFilenames({ bypassCache: true });
  for (const filename of filenames) {
    try {
      const imported = await importSharedStateFileFromGist(filename);
      if (imported) {
        result.imported.push(filename);
      } else {
        result.skipped.push(filename);
      }
    } catch (error) {
      result.errors.push({
        filename,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
};

/** True when Gist backfill should run for a scope after reading Neon. */
export const shouldAttemptGistBackfill = (
  scope: StateScope,
  fileExists: boolean,
  stored: unknown
): boolean => {
  if (!isGistConfigured()) {
    return false;
  }

  if (!fileExists) {
    return true;
  }

  if (ARRAY_SCOPES.has(scope) && Array.isArray(stored) && stored.length === 0) {
    return true;
  }

  if (
    scope === 'pins' &&
    stored &&
    typeof stored === 'object' &&
    !Array.isArray(stored) &&
    Object.keys(stored as Record<string, unknown>).length === 0
  ) {
    return true;
  }

  return false;
};

export const gistMigrationScopeFilenames = (): string[] =>
  STATE_SCOPES.map((scope) => {
    switch (scope) {
      case 'movies':
        return 'movielist.json';
      case 'messages':
        return 'messages.json';
      case 'memories':
        return 'memories.json';
      case 'places':
        return 'places.json';
      case 'suggestions':
        return 'suggestions.json';
      case 'placeSuggestions':
        return 'placesuggestions.json';
      case 'quiz':
        return 'quiz.json';
      case 'matchmaker':
        return 'matchmaker.json';
      case 'pins':
        return 'pins.json';
      case 'spinHistory':
        return 'spinhistory.json';
      case 'dailySpin':
        return 'dailyspin.json';
      default:
        return '';
    }
  }).filter(Boolean);
