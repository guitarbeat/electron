import {
  decodeStorageData,
  deepClone,
  encodeStorageData,
} from "../../utils/shared.ts";
import {
  cloneMatchmakerGame,
  cloneQuizData,
  defaultQuizData,
} from "./stateSchemas.ts";
import {
  STATE_SCOPES,
  StateClientError,
  type ConflictResponse,
  type MutationResponse,
  type ScopeOutbox,
  type ScopeSnapshot,
  type StateEnvelope,
  type StateScope,
  type StateScopeDataMap,
} from "./stateTypes.ts";
import {
  isMockMode,
  mockMovies,
  mockSuggestions,
  mockMessages,
  mockMemories,
  mockPlaces,
  mockPlaceSuggestions,
  mockQuizData,
  mockMatchmakerGame,
  mockPins,
  mockSpinHistory,
  mockDailySpin,
} from "./mockData.ts";

const SNAPSHOT_PREFIX = "movieList.scopeSnapshot.";
const OUTBOX_PREFIX = "movieList.scopeOutbox.";
const SESSION_INVALID_EVENT = "movie-watch-session-invalid";
const OUTBOX_STATUS_EVENT = "movie-watch-outbox-status";

/** Shown when fetch to /api/state fails (offline, dev server down, CORS). */
export const SYNC_WARNING_CLIENT_NETWORK =
  "Could not reach the app sync API. Check that the dev server is running, or try again when back online.";

/** Shown when local mutations are queued and not yet applied on the server. */
export const SYNC_WARNING_OUTBOX =
  "Some changes are waiting to sync to the server.";

interface StoredSnapshot<T> {
  data: T;
  version: string;
  degraded?: boolean;
  warning?: string;
}

const replayLocks = new Map<StateScope, Promise<ScopeSnapshot<unknown>>>();

/**
 * Scopes that returned a network error on the last read (server unreachable).
 * Tracked so flushPendingSync can clear stale degraded warnings even when no
 * mutations are queued — without requiring the hook's 15-second poll to fire.
 */
const degradedReadScopes = new Set<StateScope>();

const isBrowser = (): boolean => typeof window !== "undefined";

const snapshotKey = (scope: StateScope) => `${SNAPSHOT_PREFIX}${scope}`;
const outboxKey = (scope: StateScope) => `${OUTBOX_PREFIX}${scope}`;

const getDefaultScopeData = <TScope extends StateScope>(
  scope: TScope,
): StateScopeDataMap[TScope] => {
  switch (scope) {
    case "movies":
    case "messages":
    case "memories":
    case "places":
    case "suggestions":
    case "placeSuggestions":
      return [] as unknown as StateScopeDataMap[TScope];
    case "quiz":
      return cloneQuizData(defaultQuizData) as StateScopeDataMap[TScope];
    case "matchmaker":
      return cloneMatchmakerGame(null) as StateScopeDataMap[TScope];
    case "pins":
      return {
        Aaron: false,
        Electra: false,
      } as StateScopeDataMap[TScope];
    case "spinHistory":
      return [] as unknown as StateScopeDataMap[TScope];
    case "dailySpin":
      return null as unknown as StateScopeDataMap[TScope];
    default:
      return [] as unknown as StateScopeDataMap[TScope];
  }
};

const getMockScopeData = <TScope extends StateScope>(
  scope: TScope,
): StateScopeDataMap[TScope] => {
  switch (scope) {
    case "movies":
      return deepClone(mockMovies) as StateScopeDataMap[TScope];
    case "messages":
      return deepClone(mockMessages) as StateScopeDataMap[TScope];
    case "memories":
      return deepClone(mockMemories) as StateScopeDataMap[TScope];
    case "places":
      return deepClone(mockPlaces) as StateScopeDataMap[TScope];
    case "suggestions":
      return deepClone(mockSuggestions) as StateScopeDataMap[TScope];
    case "placeSuggestions":
      return deepClone(mockPlaceSuggestions) as StateScopeDataMap[TScope];
    case "quiz":
      return deepClone(mockQuizData) as StateScopeDataMap[TScope];
    case "matchmaker":
      return deepClone(mockMatchmakerGame) as StateScopeDataMap[TScope];
    case "pins":
      return deepClone(mockPins) as StateScopeDataMap[TScope];
    case "spinHistory":
      return deepClone(mockSpinHistory) as StateScopeDataMap[TScope];
    case "dailySpin":
      return deepClone(mockDailySpin) as StateScopeDataMap[TScope];
    default:
      return getDefaultScopeData(scope);
  }
};

// In-memory mock state storage for mutations
const mockStateStore = new Map<StateScope, unknown>();

const getMockState = <TScope extends StateScope>(
  scope: TScope,
): StateScopeDataMap[TScope] => {
  if (!mockStateStore.has(scope)) {
    mockStateStore.set(scope, getMockScopeData(scope));
  }
  return deepClone(mockStateStore.get(scope)) as StateScopeDataMap[TScope];
};

const setMockState = <TScope extends StateScope>(
  scope: TScope,
  data: StateScopeDataMap[TScope],
): void => {
  mockStateStore.set(scope, deepClone(data));
};

const readJson = <T>(key: string): T | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const decoded = decodeStorageData(raw);
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    const encoded = encodeStorageData(JSON.stringify(value));
    window.localStorage.setItem(key, encoded);
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
  scope: TScope,
): StoredSnapshot<StateScopeDataMap[TScope]> | null =>
  readJson<StoredSnapshot<StateScopeDataMap[TScope]>>(snapshotKey(scope));

const writeSnapshot = <TScope extends StateScope>(
  scope: TScope,
  snapshot: StoredSnapshot<StateScopeDataMap[TScope]>,
): void => {
  writeJson(snapshotKey(scope), snapshot);
};

const readOutbox = (scope: StateScope): ScopeOutbox | null =>
  readJson<ScopeOutbox>(outboxKey(scope));

export interface OutboxScopeStatus {
  scope: StateScope;
  pendingCount: number;
  blocked: boolean;
  degradedSince?: string;
}

export interface OutboxStatusSummary {
  pendingCount: number;
  blockedCount: number;
  pendingScopes: OutboxScopeStatus[];
  lastDegradedSince?: string;
}

const getOutboxStatusSummaryInternal = (): OutboxStatusSummary => {
  const pendingScopes = STATE_SCOPES.flatMap<OutboxScopeStatus>((scope) => {
    const outbox = readOutbox(scope);
    if (!outbox?.pendingOps.length) {
      return [];
    }

    return [
      {
        scope,
        pendingCount: outbox.pendingOps.length,
        blocked: Boolean(outbox.blocked),
        degradedSince: outbox.degradedSince,
      } satisfies OutboxScopeStatus,
    ];
  });

  return {
    pendingCount: pendingScopes.reduce<number>(
      (total, entry) => total + entry.pendingCount,
      0,
    ),
    blockedCount: pendingScopes.filter((entry) => entry.blocked).length,
    pendingScopes,
    lastDegradedSince: pendingScopes
      .map((entry) => entry.degradedSince)
      .filter((value): value is string => Boolean(value))
      .sort()[0],
  };
};

const emitOutboxStatus = (): void => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<OutboxStatusSummary>(OUTBOX_STATUS_EVENT, {
      detail: getOutboxStatusSummaryInternal(),
    }),
  );
};

const writeOutbox = (scope: StateScope, outbox: ScopeOutbox): void => {
  writeJson(outboxKey(scope), outbox);
  emitOutboxStatus();
};

const clearOutbox = (scope: StateScope): void => {
  removeJson(outboxKey(scope));
  emitOutboxStatus();
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
    throw new StateClientError(
      "Invalid JSON response.",
      response.status,
      "server",
    );
  }
};

const fetchStateFromServer = async <TScope extends StateScope>(
  scope: TScope,
  snapshot?: StoredSnapshot<StateScopeDataMap[TScope]> | null,
): Promise<Response> => {
  const headers = new Headers();
  if (snapshot?.version && !snapshot.degraded && !snapshot.warning) {
    headers.set("If-None-Match", `"${snapshot.version}"`);
  }

  return fetch(buildStateUrl(scope), {
    method: "GET",
    headers,
    credentials: "include",
    cache: "no-store",
  });
};

const postMutation = async <TScope extends StateScope>(
  scope: TScope,
  body: {
    baseVersion: string;
    op: string;
    payload: unknown;
  },
): Promise<Response> =>
  fetch(buildStateUrl(scope, true), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(body),
  });

const readOptimisticSnapshot = <TScope extends StateScope>(
  scope: TScope,
): ScopeSnapshot<StateScopeDataMap[TScope]> => {
  const snapshot = readSnapshot(scope);
  const outbox = readOutbox(scope);
  const hasPending = Boolean(outbox?.pendingOps.length);

  return {
    data: snapshot?.data ?? deepClone(getDefaultScopeData(scope)),
    version: outbox?.lastKnownVersion ?? snapshot?.version ?? "",
    degraded: hasPending || Boolean(snapshot?.degraded),
    blocked: outbox?.blocked,
    warning:
      snapshot?.warning ?? (hasPending ? SYNC_WARNING_OUTBOX : undefined),
  };
};

const queueMutation = <TScope extends StateScope>(
  scope: TScope,
  op: string,
  payload: unknown,
  optimisticData: StateScopeDataMap[TScope],
  currentVersion: string,
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
    warning: storedSnapshot?.warning ?? SYNC_WARNING_OUTBOX,
  });

  return {
    data: optimisticData,
    version: nextOutbox.lastKnownVersion,
    degraded: true,
    blocked: false,
    warning: storedSnapshot?.warning ?? SYNC_WARNING_OUTBOX,
  };
};

const replayOutbox = async <TScope extends StateScope>(
  scope: TScope,
  base: StateEnvelope<StateScopeDataMap[TScope]>,
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
          // The queued op was rejected by the server (business-logic conflict,
          // e.g. "Movie already exists" because the other device already wrote it).
          // Parse the conflict body to learn the current server state, skip this
          // stale op, and continue replaying the rest of the queue.  Only block the
          // outbox if the conflict body itself can't be parsed.
          let conflictVersion = latestVersion;
          let conflictData = latestData;
          try {
            const conflict =
              await parseJsonResponse<ConflictResponse>(response);
            conflictVersion = conflict.currentVersion;
            conflictData = conflict.currentData as StateScopeDataMap[TScope];
          } catch {
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
          latestVersion = conflictVersion;
          latestData = conflictData;
          outbox = {
            ...outbox,
            pendingOps: remaining,
            lastKnownVersion: latestVersion,
          };
          if (remaining.length > 0) {
            writeOutbox(scope, outbox);
          }
          continue;
        }

        if (!response.ok) {
          const updatedFailures = (nextOp.consecutiveFailures ?? 0) + 1;
          const MAX_CONSECUTIVE_FAILURES = 3;
          if (updatedFailures >= MAX_CONSECUTIVE_FAILURES) {
            const blockedOutbox = {
              ...outbox,
              blocked: true,
              pendingOps: [
                { ...nextOp, consecutiveFailures: updatedFailures },
                ...remaining,
              ],
            };
            writeOutbox(scope, blockedOutbox);
            return {
              data: storedSnapshot?.data ?? optimisticSnapshot.data,
              version: latestVersion,
              degraded: true,
              blocked: true,
              warning:
                "A change could not be saved after multiple attempts. Refresh to retry.",
            };
          }
          writeOutbox(scope, {
            ...outbox,
            pendingOps: [
              { ...nextOp, consecutiveFailures: updatedFailures },
              ...remaining,
            ],
          });
          return {
            data: storedSnapshot?.data ?? optimisticSnapshot.data,
            version: latestVersion,
            degraded: true,
            blocked: false,
            warning: storedSnapshot?.warning ?? optimisticSnapshot.warning,
          };
        }

        const parsed =
          await parseJsonResponse<MutationResponse<StateScopeDataMap[TScope]>>(
            response,
          );
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
  scope: TScope,
): Promise<ScopeSnapshot<StateScopeDataMap[TScope]>> => {
  // Return mock data immediately in mock mode - no API calls
  if (isMockMode()) {
    return {
      data: getMockState(scope),
      version: "mock-version",
      degraded: false,
      blocked: false,
      warning: undefined,
    };
  }

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
        : null,
    );

    if (response.status === 401 || response.status === 403) {
      notifySessionInvalid();
      throw new StateClientError(
        "Unauthorized.",
        response.status,
        "unauthorized",
      );
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
      throw new StateClientError(
        "State request failed.",
        response.status,
        "server",
      );
    }

    const parsed =
      await parseJsonResponse<StateEnvelope<StateScopeDataMap[TScope]>>(
        response,
      );

    if (outbox?.pendingOps.length) {
      return replayOutbox(scope, parsed);
    }

    writeSnapshot(scope, {
      data: parsed.data,
      version: parsed.version,
      degraded: parsed.degraded,
      warning: parsed.warning,
    });

    // Successful read — scope is no longer in a degraded network state.
    degradedReadScopes.delete(scope);

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

    // Network read failed — record scope so flushPendingSync can retry it
    // promptly when the browser comes back online or the tab regains focus,
    // without waiting for the hook's next polling interval.
    degradedReadScopes.add(scope);

    if (stored) {
      return {
        data: stored.data,
        version: outbox?.lastKnownVersion || stored.version,
        degraded: true,
        blocked: outbox?.blocked,
        warning: stored.warning ?? SYNC_WARNING_CLIENT_NETWORK,
      };
    }

    return {
      data: deepClone(getDefaultScopeData(scope)),
      version: "",
      degraded: true,
      blocked: outbox?.blocked,
      warning: SYNC_WARNING_CLIENT_NETWORK,
    };
  }
};

export const retryScopeSync = async <TScope extends StateScope>(
  scope: TScope,
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
  },
): Promise<ScopeSnapshot<StateScopeDataMap[TScope]>> => {
  // In mock mode, just update the in-memory store and return success
  if (isMockMode()) {
    setMockState(scope, options.optimisticData);
    return {
      data: options.optimisticData,
      version: "mock-version",
      degraded: false,
      blocked: false,
      warning: undefined,
    };
  }

  const outbox = readOutbox(scope);
  if (outbox?.blocked) {
    throw new StateClientError(
      "Sync is blocked for this section. Refresh and retry.",
      409,
      "conflict",
    );
  }

  const latestSnapshot = await readScope(scope);
  const currentVersion =
    readOutbox(scope)?.lastKnownVersion || latestSnapshot.version;

  try {
    const response = await postMutation(scope, {
      baseVersion: currentVersion,
      op: options.op,
      payload: options.payload,
    });

    if (response.status === 401 || response.status === 403) {
      notifySessionInvalid();
      throw new StateClientError(
        "Unauthorized.",
        response.status,
        "unauthorized",
      );
    }

    if (response.status === 409) {
      const conflict = await parseJsonResponse<ConflictResponse>(response);
      throw new StateClientError(conflict.conflict, 409, "conflict", conflict);
    }

    if (response.status >= 500) {
      return queueMutation(
        scope,
        options.op,
        options.payload,
        options.optimisticData,
        currentVersion,
      );
    }

    if (!response.ok) {
      throw new StateClientError(
        "Mutation failed.",
        response.status,
        "invalid",
      );
    }

    const parsed =
      await parseJsonResponse<MutationResponse<StateScopeDataMap[TScope]>>(
        response,
      );
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
      if (
        error.code === "unauthorized" ||
        error.code === "conflict" ||
        error.code === "invalid"
      ) {
        throw error;
      }

      return queueMutation(
        scope,
        options.op,
        options.payload,
        options.optimisticData,
        currentVersion,
      );
    }

    return queueMutation(
      scope,
      options.op,
      options.payload,
      options.optimisticData,
      currentVersion,
    );
  }
};

export const getStoredScopeSnapshot = <TScope extends StateScope>(
  scope: TScope,
): ScopeSnapshot<StateScopeDataMap[TScope]> => readOptimisticSnapshot(scope);

export const sessionInvalidationEvent = SESSION_INVALID_EVENT;
export const syncOutboxStatusEvent = OUTBOX_STATUS_EVENT;
export const getOutboxStatusSummary = (): OutboxStatusSummary =>
  getOutboxStatusSummaryInternal();

export const flushPendingSync = async (): Promise<OutboxStatusSummary> => {
  const summary = getOutboxStatusSummaryInternal();

  // Collect scopes with queued mutations AND scopes that had a network read
  // failure (degradedReadScopes).  The latter would otherwise linger until the
  // hook's next 15-second poll, even when the browser just came back online or
  // the tab regained focus.
  const pendingScopeSet = new Set(summary.pendingScopes.map((e) => e.scope));
  const degradedOnlyScopes = [...degradedReadScopes].filter(
    (s) => !pendingScopeSet.has(s),
  );

  const allScopesToRetry = [
    ...summary.pendingScopes.map((e) => e.scope),
    ...degradedOnlyScopes,
  ];

  if (allScopesToRetry.length === 0) {
    return summary;
  }

  await Promise.allSettled(
    allScopesToRetry.map((scope) => retryScopeSync(scope)),
  );

  return getOutboxStatusSummaryInternal();
};

// Re-export isMockMode for components to check
export { isMockMode } from "./mockData.ts";
