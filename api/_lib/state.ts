import { createHash } from 'node:crypto';

import type {
  MutationRequest,
  StateScope,
  StateScopeDataMap,
} from '../../apps/web/src/services/state/index.ts';
import { STATE_SCOPES } from '../../apps/web/src/services/state/index.ts';
import type { User } from '../../apps/web/src/shared/types.js';
import { USER_OPTIONS } from './common.js';
import {
  invalidateSharedStateCache,
  isSharedStateConfigured,
  isSharedStateWriteConfigured,
  listSharedStateFilenames,
  patchSharedStateFile,
  readSharedStateFileRecord,
} from './sharedStateStore.js';
import { verifyStoredPin } from './session.js';

import { movieScopeDefinition } from './stateScopes/movies.js';
import {
  memoriesScopeDefinition,
  messagesScopeDefinition,
  placesScopeDefinition,
} from './stateScopes/content.js';
import { suggestionScopeDefinitions } from './stateScopes/suggestions.js';
import {
  dailySpinScopeDefinition,
  matchmakerScopeDefinition,
  pinsScopeDefinition,
  quizScopeDefinition,
  spinHistoryScopeDefinition,
} from './stateScopes/interactive.js';

export interface MutationContext {
  currentUser: User | null;
  now: string;
}

export interface PinCoverageState {
  pinProtectedUsers: User[];
  usersMissingPins: User[];
  pinCoverageComplete: boolean;
}

export interface StateScopeDiagnostics {
  expectedScopes: StateScope[];
  missingScopes: StateScope[];
}

type MutationFailure = {
  ok: false;
  conflict: string;
};

type MutationSuccess<T> = {
  ok: true;
  data: T;
};

export type MutationResult<T> = MutationFailure | MutationSuccess<T>;

export interface ScopeDefinition<
  TScope extends StateScope,
  TStored,
  TClient = StateScopeDataMap[TScope]
> {
  filename: string;
  parse: (content: string | null) => TStored;
  serialize: (value: TStored) => string;
  toClient: (value: TStored) => TClient;
  allowAnonymousMutation?: (op: string, payload: unknown) => boolean;
  mutate?: (
    current: TStored,
    op: string,
    payload: unknown,
    context: MutationContext
  ) => MutationResult<TStored>;
}

export const computeVersion = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

const buildPinCoverageState = (pinProtectedUsers: readonly User[]): PinCoverageState => {
  const protectedSet = new Set<User>(pinProtectedUsers);
  const usersMissingPins = USER_OPTIONS.filter((user) => !protectedSet.has(user));

  return {
    pinProtectedUsers: [...pinProtectedUsers],
    usersMissingPins,
    pinCoverageComplete: usersMissingPins.length === 0,
  };
};

const scopes: {
  [K in StateScope]: ScopeDefinition<K, unknown>;
} = {
  movies: movieScopeDefinition,
  messages: messagesScopeDefinition,
  memories: memoriesScopeDefinition,
  places: placesScopeDefinition,
  ...suggestionScopeDefinitions,
  quiz: quizScopeDefinition,
  matchmaker: matchmakerScopeDefinition,
  pins: pinsScopeDefinition,
  spinHistory: spinHistoryScopeDefinition,
  dailySpin: dailySpinScopeDefinition,
};

export const getScopeDefinition = <TScope extends StateScope>(
  scope: TScope
): ScopeDefinition<TScope, unknown, StateScopeDataMap[TScope]> =>
  scopes[scope] as ScopeDefinition<TScope, unknown, StateScopeDataMap[TScope]>;

const repairMissingScopeFile = async <TScope extends StateScope>(
  scope: TScope,
  definition: ScopeDefinition<TScope, unknown, StateScopeDataMap[TScope]>,
  stored: unknown
): Promise<void> => {
  if (!isSharedStateWriteConfigured()) {
    return;
  }

  try {
    await patchSharedStateFile(definition.filename, definition.serialize(stored));
  } catch (error) {
    console.warn(`Failed to bootstrap missing ${scope} scope file.`, error);
  }
};

export const readScopeStoredData = async <TScope extends StateScope>(
  scope: TScope,
  options: { bypassCache?: boolean } = {}
): Promise<{
  stored: unknown;
  clientData: StateScopeDataMap[TScope];
  version: string;
  fileMissing: boolean;
  usesFallbackStore: boolean;
}> => {
  const definition = getScopeDefinition(scope);

  // In mock mode (no database URL), return default/empty data without errors.
  if (!isSharedStateConfigured()) {
    const stored = definition.parse(null);
    const clientData = definition.toClient(stored) as StateScopeDataMap[TScope];
    const version = computeVersion(clientData);
    return {
      stored,
      clientData,
      version,
      fileMissing: true,
      usesFallbackStore: true,
    };
  }

  const file = await readSharedStateFileRecord(definition.filename, {
    bypassCache: options.bypassCache,
  });
  const stored = definition.parse(file.content);

  if (!file.exists) {
    await repairMissingScopeFile(scope, definition, stored);
  }

  const clientData = definition.toClient(stored) as StateScopeDataMap[TScope];
  const version = computeVersion(clientData);

  return {
    stored,
    clientData,
    version,
    fileMissing: !file.exists,
    usesFallbackStore: false,
  };
};

export const buildFallbackScopeData = <TScope extends StateScope>(scope: TScope) => {
  const definition = getScopeDefinition(scope);
  const stored = definition.parse(null);
  const clientData = definition.toClient(stored) as StateScopeDataMap[TScope];
  const version = computeVersion(clientData);

  return {
    clientData,
    version,
  };
};

export const getStateScopeDiagnostics = async (): Promise<StateScopeDiagnostics> => {
  const files = new Set(await listSharedStateFilenames());

  return {
    expectedScopes: [...STATE_SCOPES],
    missingScopes: STATE_SCOPES.filter((scope: StateScope) => !files.has(getScopeDefinition(scope).filename)),
  };
};

/** Ensures every scope has a row in shared_state_files (default content when missing). */
export const bootstrapMissingScopeFiles = async (): Promise<StateScopeDiagnostics> => {
  if (!isSharedStateConfigured()) {
    throw new Error('DATABASE_URL is not configured.');
  }

  await Promise.all(
    STATE_SCOPES.map((scope: StateScope) => readScopeStoredData(scope, { bypassCache: true }))
  );

  invalidateSharedStateCache();
  return getStateScopeDiagnostics();
};

/**
 * Maps shared-store/API errors to user-safe banner copy (no secrets). Exported for tests.
 */
export const getScopeWarning = (error: unknown): string | undefined => {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const msg = error.message;

  if (msg === 'DATABASE_URL is not configured.') {
    return 'Shared sync is unavailable because the server is missing DATABASE_URL. Set DATABASE_URL in your environment variables, then restart the server.';
  }

  const readMatch = /^Failed to read shared state \((\d+)\)\.$/.exec(msg);
  if (readMatch) {
    const status = Number(readMatch[1]);
    if (status === 404) {
      return 'Shared sync could not reach the database endpoint (404). Verify DATABASE_URL points to the correct Neon database.';
    }
    if (status === 401 || status === 403) {
      return 'Neon rejected the request (401/403). Check DATABASE_URL credentials and permissions.';
    }
    if (status === 429) {
      return 'Neon or upstream rate limit reached. Retry after a short wait.';
    }
    return `Shared state could not be loaded (HTTP ${status}). Check server logs and https://status.neon.tech.`;
  }

  if (msg.startsWith('Failed to read shared state:')) {
    return 'Shared state could not be read from Neon Postgres. Check server logs and DATABASE_URL.';
  }

  if (msg.includes('unexpected value type')) {
    return 'The database returned an unexpected value when loading shared state. Check server logs.';
  }

  const updateMatch = /^Failed to update shared state \((\d+)\)\.$/.exec(msg);
  if (updateMatch) {
    const status = Number(updateMatch[1]);
    if (status === 404) {
      return 'Shared sync could not reach the database endpoint while saving (404). Verify DATABASE_URL.';
    }
    if (status === 401 || status === 403) {
      return 'Neon rejected the save (401/403). Verify DATABASE_URL credentials allow writes.';
    }
    if (status === 429) {
      return 'Rate limit reached while saving. Retry after a short wait.';
    }
    return `Shared state could not be saved (HTTP ${status}). Check server logs.`;
  }

  if (msg.startsWith('Failed to update shared state:')) {
    return 'Shared state could not be written to Neon Postgres. Check server logs and DATABASE_URL.';
  }

  const listMatch = /^list shared state \((\d+)\)\.$/.exec(msg);
  if (listMatch) {
    return `Health check could not list shared state rows (HTTP ${listMatch[1]}). Check database credentials.`;
  }

  if (msg.startsWith('list shared state:')) {
    return 'Health check could not list shared state rows. Check server logs and database configuration.';
  }

  return 'Shared state could not be loaded. Check server logs and Neon connectivity.';
};

export const parseMutationRequest = async (req: Request): Promise<MutationRequest> => {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    throw new Error('Invalid JSON payload.');
  }

  const body = payload as Partial<MutationRequest>;
  if (
    !body ||
    typeof body.baseVersion !== 'string' ||
    typeof body.op !== 'string'
  ) {
    throw new Error('Mutation requests must include baseVersion and op.');
  }

  return {
    baseVersion: body.baseVersion,
    op: body.op,
    payload: body.payload,
  };
};

export const getPinProtectedUsers = async (): Promise<User[]> => {
  return (await getPinCoverageState()).pinProtectedUsers;
};

export const getPinCoverageState = async (): Promise<PinCoverageState> => {
  try {
    const { stored } = await readScopeStoredData('pins');
    const pins = stored as Record<string, string>;
    return buildPinCoverageState(USER_OPTIONS.filter((user) => Boolean(pins[user as string])));
  } catch (error) {
    console.warn('Failed to read PIN coverage state, falling back to empty.', error);
    return {
      pinProtectedUsers: [],
      usersMissingPins: [],
      pinCoverageComplete: true,
    };
  }
};

export const verifyProfilePin = async (
  user: User,
  pin: string | undefined
): Promise<boolean> => {
  const { stored } = await readScopeStoredData('pins');
  const pins = stored as Record<string, string>;
  const storedHash = pins[user as string];

  if (!storedHash) {
    return true;
  }

  return pin ? verifyStoredPin(pin, storedHash) : false;
};
