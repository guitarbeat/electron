import { cloneMatchmakerGame, cloneQuizData, defaultQuizData } from './stateSchemas.ts';
import type {
  ConflictResponse,
  MutationResponse,
  ScopeOutbox,
  ScopeSnapshot,
  StateEnvelope,
  StateScope,
  StateScopeDataMap,
} from './stateTypes';

const SNAPSHOT_PREFIX = 'movieList.scopeSnapshot.';
const OUTBOX_PREFIX = 'movieList.scopeOutbox.';
const SESSION_INVALID_EVENT = 'movie-watch-session-invalid';

interface StoredSnapshot<T> {
  data: T;
  version: string;
  degraded?: boolean;
  warning?: string;
}

type ErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'invalid'
  | 'server'
  | 'network';

const replayLocks = new Map<StateScope, Promise<ScopeSnapshot<unknown>>>();

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export class StateClientError extends Error {
  status: number;

  code: ErrorCode;

  conflict?: ConflictResponse;

  constructor(
    message: string,
    status: number,
    code: ErrorCode,
    conflict?: ConflictResponse
  ) {
    super(message);
    this.name = 'StateClientError';
    this.status = status;
    this.code = code;
    this.conflict = conflict;
  }
}

const isBrowser = (): boolean => typeof window !== 'undefined';

const snapshotKey = (scope: StateScope) => `${SNAPSHOT_PREFIX}${scope}`;
const outboxKey = (scope: StateScope) => `${OUTBOX_PREFIX}${scope}`;

const getDefaultScopeData = <TScope extends StateScope>(
  scope: TScope
): StateScopeDataMap[TScope] => {
  switch (scope) {
    case 'movies':
    case 'messages':
    case 'memories':
    case 'places':
    case 'suggestions':
      return [] as unknown as StateScopeDataMap[TScope];
    case 'quiz':
      return cloneQuizData(defaultQuizData) as StateScopeDataMap[TScope];
    case 'matchmaker':
      return cloneMatchmakerGame(null) as StateScopeDataMap[TScope];
    case 'pins':
      return {
        Aaron: false,
        Electra: false,
      } as StateScopeDataMap[TScope];
    default:
      return [] as unknown as StateScopeDataMap[TScope];
  }
};

const readJson = <T>(key: string): T | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors; degraded sync still works in-memory for this session.
  }
};

const removeJson = (key: string): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
};

const readSnapshot = <TScope extends StateScope>(
  scope: TScope
): StoredSnapshot<StateScopeDataMap[TScope]> | null =>
  readJson<StoredSnapshot<StateScopeDataMap[TScope]>>(snapshotKey(scope));

const writeSnapshot = <TScope extends StateScope>(
  scope: TScope,
  snapshot: StoredSnapshot<StateScopeDataMap[TScope]>
): void => {
  writeJson(snapshotKey(scope), snapshot);
};

const readOutbox = (scope: StateScope): ScopeOutbox | null =>
  readJson<ScopeOutbox>(outboxKey(scope));

const writeOutbox = (scope: StateScope, outbox: ScopeOutbox): void => {
  writeJson(outboxKey(scope), outbox);
};

const clearOutbox = (scope: StateScope): void => {
  removeJson(outboxKey(scope));
};

const notifySessionInvalid = (): void => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(SESSION_INVALID_EVENT));
};

const buildStateUrl = (scope: StateScope, mutate: boolean = false): string =>
  mutate ? `/api/state/${scope}/mutate` : `/api/state/${scope}`;

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  try {
    return (await response.json()) as T;
  } catch {
    throw new StateClientError('Invalid JSON response.', response.status, 'server');
  }
};

const fetchStateFromServer = async <TScope extends StateScope>(
  scope: TScope,
  snapshot?: StoredSnapshot<StateScopeDataMap[TScope]> | null
): Promise<Response> => {
  const headers = new Headers();
  if (snapshot?.version && !snapshot.degraded && !snapshot.warning) {
    headers.set('If-None-Match', `"${snapshot.version}"`);
  }

  return fetch(buildStateUrl(scope), {
    method: 'GET',
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
};

const postMutation = async <TScope extends StateScope>(
  scope: TScope,
  body: {
    baseVersion: string;
    op: string;
    payload: unknown;
  }
): Promise<Response> =>
  fetch(buildStateUrl(scope, true), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(body),
  });

const readOptimisticSnapshot = <TScope extends StateScope>(
  scope: TScope
): ScopeSnapshot<StateScopeDataMap[TScope]> => {
  const snapshot = readSnapshot(scope);
  const outbox = readOutbox(scope);

  return {
    data: snapshot?.data ?? deepClone(getDefaultScopeData(scope)),
    version: outbox?.lastKnownVersion ?? snapshot?.version ?? '',
    degraded: Boolean(outbox?.pendingOps.length) || Boolean(snapshot?.degraded),
    blocked: outbox?.blocked,
    warning: snapshot?.warning,
  };
};

const queueMutation = <TScope extends StateScope>(
  scope: TScope,
  op: string,
  payload: unknown,
  optimisticData: StateScopeDataMap[TScope],
  currentVersion: string
): ScopeSnapshot<StateScopeDataMap[TScope]> => {
  const existing = readOutbox(scope);
  const storedSnapshot = readSnapshot(scope);
  const nextOutbox: ScopeOutbox = {
    scope,
    pendingOps: [...(existing?.pendingOps ?? []), { op, payload }],
    lastKnownVersion: existing?.lastKnownVersion || currentVersion,
    degradedSince: existing?.degradedSince || new Date().toISOString(),
    blocked: false,
  };

  writeOutbox(scope, nextOutbox);
  writeSnapshot(scope, {
    data: optimisticData,
    version: nextOutbox.lastKnownVersion,
    degraded: true,
    warning: storedSnapshot?.warning,
  });

  return {
    data: optimisticData,
    version: nextOutbox.lastKnownVersion,
    degraded: true,
    blocked: false,
    warning: storedSnapshot?.warning,
  };
};

const replayOutbox = async <TScope extends StateScope>(
  scope: TScope,
  base: StateEnvelope<StateScopeDataMap[TScope]>
): Promise<ScopeSnapshot<StateScopeDataMap[TScope]>> => {
  const existingLock = replayLocks.get(scope);
  if (existingLock) {
    return (await existingLock) as ScopeSnapshot<StateScopeDataMap[TScope]>;
  }

  const promise = (async () => {
    const storedSnapshot = readSnapshot(scope);
    const optimisticSnapshot = readOptimisticSnapshot(scope);
    let outbox = readOutbox(scope);
    if (!outbox || outbox.pendingOps.length === 0 || outbox.blocked) {
      return optimisticSnapshot;
    }

    let latestVersion = base.version;
    let latestData = base.data;

    while (outbox.pendingOps.length > 0) {
      const [nextOp, ...remaining] = outbox.pendingOps;

      try {
        const response = await postMutation(scope, {
          baseVersion: latestVersion,
          op: nextOp.op,
          payload: nextOp.payload,
        });

        if (response.status === 401 || response.status === 403) {
          notifySessionInvalid();
          writeOutbox(scope, {
            ...outbox,
            blocked: true,
            pendingOps: [nextOp, ...remaining],
          });
          return {
            data: storedSnapshot?.data ?? optimisticSnapshot.data,
            version: latestVersion,
            degraded: true,
            blocked: true,
            warning: storedSnapshot?.warning ?? optimisticSnapshot.warning,
          };
        }

        if (response.status === 409) {
          writeOutbox(scope, {
            ...outbox,
            blocked: true,
            pendingOps: [nextOp, ...remaining],
            lastKnownVersion: latestVersion,
          });
          return {
            data: storedSnapshot?.data ?? optimisticSnapshot.data,
            version: latestVersion,
            degraded: true,
            blocked: true,
            warning: storedSnapshot?.warning ?? optimisticSnapshot.warning,
          };
        }

        if (!response.ok) {
          return {
            data: storedSnapshot?.data ?? optimisticSnapshot.data,
            version: latestVersion,
            degraded: true,
            blocked: false,
            warning: storedSnapshot?.warning ?? optimisticSnapshot.warning,
          };
        }

        const parsed = await parseJsonResponse<
          MutationResponse<StateScopeDataMap[TScope]>
        >(response);
        latestVersion = parsed.version;
        latestData = parsed.data;
        outbox = {
          ...outbox,
          pendingOps: remaining,
          lastKnownVersion: latestVersion,
        };

        if (remaining.length > 0) {
          writeOutbox(scope, outbox);
        }
      } catch {
        return {
          data: storedSnapshot?.data ?? optimisticSnapshot.data,
          version: latestVersion,
          degraded: true,
          blocked: false,
          warning: storedSnapshot?.warning ?? optimisticSnapshot.warning,
        };
      }
    }

    clearOutbox(scope);
    writeSnapshot(scope, {
      data: latestData,
      version: latestVersion,
      degraded: false,
    });

    return {
      data: latestData,
      version: latestVersion,
      degraded: false,
      blocked: false,
      warning: undefined,
    };
  })();

  replayLocks.set(scope, promise as Promise<ScopeSnapshot<unknown>>);

  try {
    return await promise;
  } finally {
    replayLocks.delete(scope);
  }
};

export const readScope = async <TScope extends StateScope>(
  scope: TScope
): Promise<ScopeSnapshot<StateScopeDataMap[TScope]>> => {
  const outbox = readOutbox(scope);
  if (outbox?.blocked) {
    return readOptimisticSnapshot(scope);
  }

  const stored = readSnapshot(scope);

  try {
    const response = await fetchStateFromServer(
      scope,
      stored
        ? {
            ...stored,
            version: outbox?.lastKnownVersion || stored.version,
          }
        : null
    );

    if (response.status === 401 || response.status === 403) {
      notifySessionInvalid();
      throw new StateClientError('Unauthorized.', response.status, 'unauthorized');
    }

    if (response.status === 304 && stored) {
      if (outbox?.pendingOps.length) {
        return replayOutbox(scope, {
          data: stored.data,
          version: outbox.lastKnownVersion || stored.version,
          degraded: Boolean(stored.degraded),
          warning: stored.warning,
        });
      }

      return {
        data: stored.data,
        version: stored.version,
        degraded: Boolean(stored.degraded),
        blocked: false,
        warning: stored.warning,
      };
    }

    if (!response.ok) {
      throw new StateClientError('State request failed.', response.status, 'server');
    }

    const parsed = await parseJsonResponse<StateEnvelope<StateScopeDataMap[TScope]>>(response);
    writeSnapshot(scope, {
      data: parsed.data,
      version: parsed.version,
      degraded: parsed.degraded,
      warning: parsed.warning,
    });

    if (outbox?.pendingOps.length) {
      return replayOutbox(scope, parsed);
    }

    return {
      data: parsed.data,
      version: parsed.version,
      degraded: parsed.degraded,
      blocked: false,
      warning: parsed.warning,
    };
  } catch (error) {
    if (error instanceof StateClientError) {
      throw error;
    }

    if (stored) {
      return {
        data: stored.data,
        version: outbox?.lastKnownVersion || stored.version,
        degraded: true,
        blocked: outbox?.blocked,
        warning: stored.warning,
      };
    }

    return {
      data: deepClone(getDefaultScopeData(scope)),
      version: '',
      degraded: true,
      blocked: outbox?.blocked,
      warning: undefined,
    };
  }
};

export const retryScopeSync = async <TScope extends StateScope>(
  scope: TScope
): Promise<ScopeSnapshot<StateScopeDataMap[TScope]>> => {
  const outbox = readOutbox(scope);
  if (outbox) {
    writeOutbox(scope, {
      ...outbox,
      blocked: false,
    });
  }

  return readScope(scope);
};

export const mutateScope = async <TScope extends StateScope>(
  scope: TScope,
  options: {
    op: string;
    payload: unknown;
    optimisticData: StateScopeDataMap[TScope];
  }
): Promise<ScopeSnapshot<StateScopeDataMap[TScope]>> => {
  const outbox = readOutbox(scope);
  if (outbox?.blocked) {
    throw new StateClientError(
      'Sync is blocked for this section. Refresh and retry.',
      409,
      'conflict'
    );
  }

  const latestSnapshot = await readScope(scope);
  const currentVersion = readOutbox(scope)?.lastKnownVersion || latestSnapshot.version;

  try {
    const response = await postMutation(scope, {
      baseVersion: currentVersion,
      op: options.op,
      payload: options.payload,
    });

    if (response.status === 401 || response.status === 403) {
      notifySessionInvalid();
      throw new StateClientError('Unauthorized.', response.status, 'unauthorized');
    }

    if (response.status === 409) {
      const conflict = await parseJsonResponse<ConflictResponse>(response);
      throw new StateClientError(conflict.conflict, 409, 'conflict', conflict);
    }

    if (response.status >= 500) {
      return queueMutation(
        scope,
        options.op,
        options.payload,
        options.optimisticData,
        currentVersion
      );
    }

    if (!response.ok) {
      throw new StateClientError('Mutation failed.', response.status, 'invalid');
    }

    const parsed = await parseJsonResponse<
      MutationResponse<StateScopeDataMap[TScope]>
    >(response);
    clearOutbox(scope);
    writeSnapshot(scope, {
      data: parsed.data,
      version: parsed.version,
      degraded: false,
    });

    return {
      data: parsed.data,
      version: parsed.version,
      degraded: false,
      blocked: false,
      warning: undefined,
    };
  } catch (error) {
    if (error instanceof StateClientError) {
      if (error.code === 'unauthorized' || error.code === 'conflict' || error.code === 'invalid') {
        throw error;
      }

      return queueMutation(
        scope,
        options.op,
        options.payload,
        options.optimisticData,
        currentVersion
      );
    }

    return queueMutation(
      scope,
      options.op,
      options.payload,
      options.optimisticData,
      currentVersion
    );
  }
};

export const getStoredScopeSnapshot = <TScope extends StateScope>(
  scope: TScope
): ScopeSnapshot<StateScopeDataMap[TScope]> => readOptimisticSnapshot(scope);

export const sessionInvalidationEvent = SESSION_INVALID_EVENT;
