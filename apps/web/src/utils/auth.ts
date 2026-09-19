import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { User } from "../shared/types.js";
import type { SessionState as BaseSessionState } from "../services/state/index.js";

export interface SessionState extends BaseSessionState {
  token?: string | null;
}
import { isUser } from "./security.js";
import { getErrorMessage, readApiErrorMessage } from "./shared.js";

// ============================================================================
// Constants & Keys
// ============================================================================

export const AUTH_TOKEN_KEY = "movie_watch_session_token";
export const AUTH_SESSION_KEY = "movie_watch_session_state";
export const AUTH_INDEXEDDB_NAME = "movie_watch_auth_db";
export const AUTH_INDEXEDDB_STORE = "auth_records";
export const AUTH_INDEXEDDB_VERSION = 1;
export const AUTH_SYNC_EVENT = "movie_watch_auth_sync";

/** Default expiration buffer in seconds (30s) to refresh before hard expiry */
export const DEFAULT_EXPIRATION_BUFFER_SECONDS = 30;

// ============================================================================
// Types
// ============================================================================

export interface ProfileTokenPayload {
  type: string;
  user?: User;
  users?: User[];
  failures?: number;
  lockUntil?: number | null;
  exp: number;
  iat?: number;
}

export interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  payload: ProfileTokenPayload | null;
  expiresAt: Date | null;
  timeRemainingMs: number;
  error?: string;
}

export interface StoredAuthSession {
  token: string | null;
  session: SessionState | null;
  timestamp: number;
}

export interface PersistentAuthOptions {
  autoReauthenticate?: boolean;
  reauthenticateIntervalMs?: number;
  onSessionRestored?: (session: SessionState) => void;
  onSessionExpired?: () => void;
}

export interface PersistentAuthResult {
  currentUser: User | null;
  activeUsers: User[];
  hasAccess: boolean;
  pinProtectedUsers: User[];
  usersMissingPins: User[];
  token: string | null;
  isLoading: boolean;
  isReauthenticating: boolean;
  error: string | null;
  reauthenticate: () => Promise<SessionState | null>;
  setCurrentUser: (user: User | null, pin?: string) => Promise<boolean>;
  logoutUser: (user?: User | null) => Promise<boolean>;
  validateCurrentToken: () => TokenValidationResult;
}

// ============================================================================
// In-Memory Fallback for Non-Browser Environments (SSR / Node Tests)
// ============================================================================

const memoryStore = new Map<string, string>();
let dbInstancePromise: Promise<IDBDatabase | null> | null = null;

export const __resetAuthStoreForTesting = (): void => {
  memoryStore.clear();
  dbInstancePromise = null;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      // Ignore in testing
    }
  }
};

// ============================================================================
// IndexedDB Database Access
// ============================================================================

export const openAuthDatabase = (): Promise<IDBDatabase | null> => {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  if (dbInstancePromise) {
    return dbInstancePromise;
  }

  dbInstancePromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(
        AUTH_INDEXEDDB_NAME,
        AUTH_INDEXEDDB_VERSION,
      );

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(AUTH_INDEXEDDB_STORE)) {
          db.createObjectStore(AUTH_INDEXEDDB_STORE, { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return dbInstancePromise;
};

const readFromIndexedDB = async <T>(key: string): Promise<T | null> => {
  const db = await openAuthDatabase();
  if (!db) {
    const memVal = memoryStore.get(key);
    if (!memVal) return null;
    try {
      return JSON.parse(memVal) as T;
    } catch {
      return null;
    }
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([AUTH_INDEXEDDB_STORE], "readonly");
      const store = transaction.objectStore(AUTH_INDEXEDDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && "value" in req.result) {
          resolve(req.result.value as T);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

const writeToIndexedDB = async (key: string, value: unknown): Promise<void> => {
  const db = await openAuthDatabase();
  if (!db) {
    if (value === null || value === undefined) {
      memoryStore.delete(key);
    } else {
      memoryStore.set(key, JSON.stringify(value));
    }
    return;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([AUTH_INDEXEDDB_STORE], "readwrite");
      const store = transaction.objectStore(AUTH_INDEXEDDB_STORE);
      if (value === null || value === undefined) {
        store.delete(key);
      } else {
        store.put({ key, value, updatedAt: Date.now() });
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
};

// ============================================================================
// Token Decoding & Validation
// ============================================================================

/**
 * Decodes a base64url or standard base64 string safely in browser or node
 */
const safeBase64Decode = (str: string): string => {
  let output = str.replace(/-/g, "+").replace(/_/g, "/");
  while (output.length % 4) {
    output += "=";
  }
  if (typeof atob === "function") {
    return atob(output);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(output, "base64").toString("utf8");
  }
  return "";
};

/**
 * Parses the unencrypted payload portion of a signed token
 */
export const parseTokenPayload = (
  token: string | null | undefined,
): ProfileTokenPayload | null => {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.trim().split(".");
  if (parts.length < 2 || !parts[0]) {
    return null;
  }

  try {
    const decodedJson = safeBase64Decode(parts[0]);
    if (!decodedJson) return null;
    const parsed = JSON.parse(decodedJson) as Record<string, unknown>;

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const payload: ProfileTokenPayload = {
      type: typeof parsed.type === "string" ? parsed.type : "profile",
      exp: typeof parsed.exp === "number" ? parsed.exp : 0,
    };

    if (isUser(parsed.user)) {
      payload.user = parsed.user;
    }

    if (Array.isArray(parsed.users)) {
      payload.users = parsed.users.filter(isUser);
    }

    if (typeof parsed.failures === "number") {
      payload.failures = parsed.failures;
    }

    if (typeof parsed.lockUntil === "number" || parsed.lockUntil === null) {
      payload.lockUntil = parsed.lockUntil;
    }

    if (typeof parsed.iat === "number") {
      payload.iat = parsed.iat;
    }

    return payload;
  } catch {
    return null;
  }
};

/**
 * Checks whether a token is expired or within the expiration buffer
 */
export const isTokenExpired = (
  token: string | null | undefined,
  bufferSeconds: number = DEFAULT_EXPIRATION_BUFFER_SECONDS,
): boolean => {
  const payload = parseTokenPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds + bufferSeconds;
};

/**
 * Validates a session token structure, type, and expiration
 */
export const validateToken = (
  token: string | null | undefined,
  bufferSeconds: number = DEFAULT_EXPIRATION_BUFFER_SECONDS,
): TokenValidationResult => {
  if (!token || typeof token !== "string" || !token.trim()) {
    return {
      isValid: false,
      isExpired: true,
      payload: null,
      expiresAt: null,
      timeRemainingMs: 0,
      error: "Token is missing or empty",
    };
  }

  const parts = token.trim().split(".");
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    return {
      isValid: false,
      isExpired: true,
      payload: null,
      expiresAt: null,
      timeRemainingMs: 0,
      error: "Malformed token signature",
    };
  }

  const payload = parseTokenPayload(token);
  if (!payload) {
    return {
      isValid: false,
      isExpired: true,
      payload: null,
      expiresAt: null,
      timeRemainingMs: 0,
      error: "Unreadable token payload",
    };
  }

  if (payload.type !== "profile") {
    return {
      isValid: false,
      isExpired: true,
      payload,
      expiresAt: null,
      timeRemainingMs: 0,
      error: `Unexpected token type: ${payload.type}`,
    };
  }

  const nowMs = Date.now();
  const expMs = payload.exp * 1000;
  const timeRemainingMs = Math.max(0, expMs - nowMs);
  const isExpired = payload.exp <= Math.floor(nowMs / 1000) + bufferSeconds;

  return {
    isValid: !isExpired,
    isExpired,
    payload,
    expiresAt: new Date(expMs),
    timeRemainingMs,
    error: isExpired ? "Token has expired or will expire shortly" : undefined,
  };
};

/**
 * Quick boolean check if a token is valid and unexpired
 */
export const isTokenValid = (token: string | null | undefined): boolean => {
  return validateToken(token).isValid;
};

// ============================================================================
// Persistent Storage (localStorage + IndexedDB)
// ============================================================================

const notifyAuthSync = (): void => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_SYNC_EVENT));
  }
};

/**
 * Synchronous retrieval of token from localStorage or in-memory fallback
 */
export const getStoredAuthTokenSync = (): string | null => {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return window.localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return memoryStore.get(AUTH_TOKEN_KEY) ?? null;
    }
  }
  return memoryStore.get(AUTH_TOKEN_KEY) ?? null;
};

/**
 * Asynchronous retrieval of token with IndexedDB fallback and auto-repair
 */
export const getStoredAuthToken = async (): Promise<string | null> => {
  const syncToken = getStoredAuthTokenSync();
  if (syncToken) return syncToken;

  const idbToken = await readFromIndexedDB<string>(AUTH_TOKEN_KEY);
  if (idbToken) {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(AUTH_TOKEN_KEY, idbToken);
      } catch {
        // Ignore quota/access errors
      }
    }
    return idbToken;
  }

  return null;
};

/**
 * Saves token to both localStorage and IndexedDB
 */
export const saveAuthToken = async (token: string | null): Promise<void> => {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      if (token) {
        window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }

  if (token) {
    memoryStore.set(AUTH_TOKEN_KEY, token);
  } else {
    memoryStore.delete(AUTH_TOKEN_KEY);
  }

  await writeToIndexedDB(AUTH_TOKEN_KEY, token);
  notifyAuthSync();
};

/**
 * Synchronous retrieval of cached session state
 */
export const getStoredAuthSessionSync = (): StoredAuthSession | null => {
  let raw: string | null = null;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    } catch {
      raw = memoryStore.get(AUTH_SESSION_KEY) ?? null;
    }
  } else {
    raw = memoryStore.get(AUTH_SESSION_KEY) ?? null;
  }

  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuthSession>;
    if (parsed && typeof parsed === "object") {
      return {
        token: parsed.token ?? getStoredAuthTokenSync(),
        session: (parsed.session as SessionState) ?? null,
        timestamp: parsed.timestamp ?? Date.now(),
      };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Asynchronous retrieval of session state from localStorage or IndexedDB
 */
export const getStoredAuthSession = async (): Promise<StoredAuthSession | null> => {
  const syncSession = getStoredAuthSessionSync();
  if (syncSession && syncSession.session) {
    return syncSession;
  }

  const idbRecord = await readFromIndexedDB<StoredAuthSession>(AUTH_SESSION_KEY);
  if (idbRecord && idbRecord.session) {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(
          AUTH_SESSION_KEY,
          JSON.stringify(idbRecord),
        );
        if (idbRecord.token) {
          window.localStorage.setItem(AUTH_TOKEN_KEY, idbRecord.token);
        }
      } catch {
        // Ignore storage errors
      }
    }
    return idbRecord;
  }

  return null;
};

/**
 * Saves session state and token to both localStorage and IndexedDB
 */
export const saveAuthSession = async (
  session: SessionState,
  token?: string | null,
): Promise<void> => {
  const activeToken = token ?? session.token ?? getStoredAuthTokenSync();
  const record: StoredAuthSession = {
    token: activeToken,
    session,
    timestamp: Date.now(),
  };

  const serialized = JSON.stringify(record);

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      if (session.hasAccess && session.currentUser) {
        window.localStorage.setItem(AUTH_SESSION_KEY, serialized);
        if (activeToken) {
          window.localStorage.setItem(AUTH_TOKEN_KEY, activeToken);
        }
      } else {
        window.localStorage.removeItem(AUTH_SESSION_KEY);
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }

  if (session.hasAccess && session.currentUser) {
    memoryStore.set(AUTH_SESSION_KEY, serialized);
    if (activeToken) {
      memoryStore.set(AUTH_TOKEN_KEY, activeToken);
    }
    await writeToIndexedDB(AUTH_SESSION_KEY, record);
    if (activeToken) {
      await writeToIndexedDB(AUTH_TOKEN_KEY, activeToken);
    }
  } else {
    memoryStore.delete(AUTH_SESSION_KEY);
    memoryStore.delete(AUTH_TOKEN_KEY);
    await writeToIndexedDB(AUTH_SESSION_KEY, null);
    await writeToIndexedDB(AUTH_TOKEN_KEY, null);
  }

  notifyAuthSync();
};

/**
 * Clears all stored auth state from memory, localStorage, and IndexedDB
 */
export const clearStoredAuth = async (): Promise<void> => {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  memoryStore.delete(AUTH_SESSION_KEY);
  memoryStore.delete(AUTH_TOKEN_KEY);

  await writeToIndexedDB(AUTH_SESSION_KEY, null);
  await writeToIndexedDB(AUTH_TOKEN_KEY, null);

  notifyAuthSync();
};

// ============================================================================
// Server Re-Authentication & Profile Management
// ============================================================================

export interface ReauthResult {
  success: boolean;
  session: SessionState | null;
  token: string | null;
  error?: string;
}

/**
 * Validates with the backend server via /api/session, restoring or refreshing the session
 */
export const reauthenticate = async (options?: {
  token?: string | null;
  url?: string;
}): Promise<ReauthResult> => {
  const targetToken = options?.token ?? (await getStoredAuthToken());
  const apiUrl = options?.url ?? "/api/session";

  const headers: Record<string, string> = {};
  if (targetToken) {
    headers["Authorization"] = `Bearer ${targetToken}`;
  }

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: "GET",
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch (error) {
    // Network is unreachable or server is rebooting.
    // Retain optimistic session from storage so the user is never logged out unexpectedly.
    const cached = await getStoredAuthSession();
    return {
      success: false,
      session: cached?.session ?? null,
      token: targetToken,
      error: getErrorMessage(error, "Network request failed"),
    };
  }

  if (response.status === 401) {
    // Explicit 401 Unauthorized: token/cookie was actively rejected by server
    await clearStoredAuth();
    return {
      success: false,
      session: null,
      token: null,
      error: "Session unauthorized",
    };
  }

  if (!response.ok) {
    const cached = await getStoredAuthSession();
    return {
      success: false,
      session: cached?.session ?? null,
      token: targetToken,
      error: `Server responded with ${response.status}`,
    };
  }

  try {
    const session = (await response.json()) as SessionState;
    const newToken = session.token ?? targetToken;

    if (session.hasAccess && session.currentUser) {
      await saveAuthSession(session, newToken);
    } else {
      await clearStoredAuth();
    }

    return {
      success: true,
      session,
      token: newToken,
    };
  } catch (error) {
    return {
      success: false,
      session: null,
      token: targetToken,
      error: getErrorMessage(error, "Failed to parse session response"),
    };
  }
};

/**
 * Selects an active profile and authenticates via /api/session/profile
 */
export const loginProfileWithToken = async (
  user: User,
  pin?: string,
  url?: string,
): Promise<{ success: boolean; session?: SessionState; token?: string; error?: string }> => {
  const apiUrl = url ?? "/api/session/profile";
  const token = await getStoredAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers,
      body: JSON.stringify({ user, ...(pin ? { pin } : {}) }),
    });

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: await readApiErrorMessage(response, "Invalid PIN or unauthorized"),
      };
    }

    if (!response.ok) {
      throw new Error(
        await readApiErrorMessage(response, "Failed to update profile session."),
      );
    }

    const session = (await response.json()) as SessionState;
    const newToken = session.token ?? token;
    await saveAuthSession(session, newToken);

    return {
      success: true,
      session,
      token: newToken ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Profile login is unavailable right now."),
    };
  }
};

/**
 * Logs out an active profile via /api/session/profile
 */
export const logoutProfileWithToken = async (
  user?: User | null,
  url?: string,
): Promise<{ success: boolean; session?: SessionState; error?: string }> => {
  const targetUrl = user
    ? `${url ?? "/api/session/profile"}?user=${encodeURIComponent(user)}`
    : url ?? "/api/session/profile";

  const token = await getStoredAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(targetUrl, {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
      headers,
    });

    if (!response.ok) {
      throw new Error(
        await readApiErrorMessage(response, "Failed to log out profile."),
      );
    }

    const session = (await response.json()) as SessionState;
    if (session.hasAccess && session.currentUser) {
      await saveAuthSession(session, session.token);
    } else {
      await clearStoredAuth();
    }

    return { success: true, session };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Profile logout is unavailable right now."),
    };
  }
};

// ============================================================================
// React Persistent Auth Hook
// ============================================================================

/**
 * Custom React hook that restores session from localStorage or IndexedDB on load,
 * keeps it synchronized with the server, and prevents unwanted logouts.
 */
export const usePersistentAuth = (
  options?: PersistentAuthOptions,
): PersistentAuthResult => {
  const initialRecord = useMemo(() => getStoredAuthSessionSync(), []);

  const [currentUser, setCurrentUser] = useState<User | null>(
    initialRecord?.session?.currentUser ?? null,
  );
  const [activeUsers, setActiveUsers] = useState<User[]>(
    initialRecord?.session?.activeUsers ??
      (initialRecord?.session?.currentUser
        ? [initialRecord.session.currentUser]
        : []),
  );
  const [hasAccess, setHasAccess] = useState<boolean>(
    Boolean(initialRecord?.session?.hasAccess),
  );
  const [pinProtectedUsers, setPinProtectedUsers] = useState<User[]>(
    initialRecord?.session?.pinProtectedUsers ?? [],
  );
  const [usersMissingPins, setUsersMissingPins] = useState<User[]>(
    initialRecord?.session?.usersMissingPins ?? [],
  );
  const [token, setToken] = useState<string | null>(
    initialRecord?.token ?? getStoredAuthTokenSync(),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReauthenticating, setIsReauthenticating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const applyState = useCallback((state: SessionState, authToken?: string | null) => {
    if (!isMountedRef.current) return;
    setHasAccess(state.hasAccess);
    setCurrentUser(state.currentUser);
    const users =
      state.activeUsers && state.activeUsers.length > 0
        ? state.activeUsers
        : state.currentUser
          ? [state.currentUser]
          : [];
    setActiveUsers(users);
    setPinProtectedUsers(state.pinProtectedUsers);
    setUsersMissingPins(state.usersMissingPins);
    if (authToken !== undefined) {
      setToken(authToken);
    }
  }, []);

  const runReauth = useCallback(async (): Promise<SessionState | null> => {
    setIsReauthenticating(true);
    setError(null);
    try {
      const result = await reauthenticate({ token });
      if (!isMountedRef.current) return null;

      if (result.success && result.session) {
        applyState(result.session, result.token);
        options?.onSessionRestored?.(result.session);
        return result.session;
      } else if (result.error === "Session unauthorized") {
        setHasAccess(false);
        setCurrentUser(null);
        setActiveUsers([]);
        setToken(null);
        options?.onSessionExpired?.();
      } else if (result.error) {
        setError(result.error);
      }
      return result.session;
    } finally {
      if (isMountedRef.current) {
        setIsReauthenticating(false);
      }
    }
  }, [applyState, options, token]);

  // Initial hydration from storage (localStorage first, then IndexedDB if empty)
  useEffect(() => {
    isMountedRef.current = true;
    let didCancel = false;

    const hydrateAndVerify = async () => {
      try {
        const stored = await getStoredAuthSession();
        if (!didCancel && stored?.session) {
          applyState(stored.session, stored.token);
        }

        if (options?.autoReauthenticate !== false) {
          await runReauth();
        }
      } finally {
        if (!didCancel) {
          setIsLoading(false);
        }
      }
    };

    void hydrateAndVerify();

    return () => {
      didCancel = true;
      isMountedRef.current = false;
    };
  }, [applyState, options?.autoReauthenticate, runReauth]);

  // Sync across tabs and listen for auth updates
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSync = async () => {
      const stored = await getStoredAuthSession();
      if (stored?.session) {
        applyState(stored.session, stored.token);
      } else {
        setHasAccess(false);
        setCurrentUser(null);
        setActiveUsers([]);
        setToken(null);
      }
    };

    window.addEventListener(AUTH_SYNC_EVENT, handleSync);
    window.addEventListener("storage", handleSync);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void runReauth();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener(AUTH_SYNC_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [applyState, runReauth]);

  const selectUser = useCallback(
    async (user: User | null, pin?: string): Promise<boolean> => {
      if (!user) {
        const res = await logoutProfileWithToken(null);
        if (res.success && res.session) {
          applyState(res.session, res.session.token);
          return true;
        }
        return false;
      }

      setIsLoading(true);
      try {
        const res = await loginProfileWithToken(user, pin);
        if (res.success && res.session) {
          applyState(res.session, res.token);
          return true;
        } else {
          setError(res.error ?? "Authentication failed");
          return false;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [applyState],
  );

  const logout = useCallback(
    async (user?: User | null): Promise<boolean> => {
      const res = await logoutProfileWithToken(user);
      if (res.success && res.session) {
        applyState(res.session, res.session.token);
        return true;
      }
      return false;
    },
    [applyState],
  );

  const validateCurrentToken = useCallback((): TokenValidationResult => {
    return validateToken(token);
  }, [token]);

  return {
    currentUser,
    activeUsers,
    hasAccess,
    pinProtectedUsers,
    usersMissingPins,
    token,
    isLoading,
    isReauthenticating,
    error,
    reauthenticate: runReauth,
    setCurrentUser: selectUser,
    logoutUser: logout,
    validateCurrentToken,
  };
};
