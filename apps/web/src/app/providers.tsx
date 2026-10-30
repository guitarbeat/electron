/**
 * Consolidated Context Providers
 * Combines Theme, Toast, and User contexts
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import type { User } from "@/shared/types";
import { createPortal } from "react-dom";
import { applyTheme } from "@/theme/tokens";
import { Toast } from "@/components/ui";
import {
  getStoredSessionToken,
  sessionInvalidationEvent,
  setStoredSessionToken,
} from "@/services/state";
import type { SessionState } from "@/services/state";
import { getErrorMessage, readApiErrorMessage } from "@/utils";
import {
  ThemeContext,
  ToastContext,
  ToastViewportContext,
  UserContext,
  type ToastInput,
} from "./providerContexts";


// ============================================================================
// Theme Context
// ============================================================================

import { getAppTheme, type ThemeName } from "@/theme/tokens";

export const ThemeProvider: React.FC<{
  children: ReactNode;
  themeName?: ThemeName;
}> = ({ children, themeName = "movies" }) => {
  const theme = useMemo(() => getAppTheme(themeName), [themeName]);

  useEffect(() => {
    applyTheme(themeName);
  }, [themeName]);

  const value = useMemo(
    () => ({
      currentTheme: themeName,
      theme,
    }),
    [themeName, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// ============================================================================
// Toast Context
// ============================================================================

interface ToastRecord extends ToastInput {
  id: string;
}

const toastId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  return `toast-${Date.now()}`;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const [toastViewport, setToastViewport] = useState<HTMLDivElement | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((input: ToastInput) => {
    const id = toastId();
    const actionLabel =
      input.actionLabel || (input.onUndo ? "Undo" : undefined);
    const onAction = input.onAction || input.onUndo;

    setToasts((current) => [
      ...current,
      {
        ...input,
        id,
        actionLabel,
        onAction,
      },
    ]);

    return id;
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
      clearToasts,
    }),
    [showToast, dismissToast, clearToasts],
  );

  return (
    <ToastContext.Provider value={value}>
      <ToastViewportContext.Provider value={setToastViewport}>
        {children}
        {toastViewport && toasts.length > 0 ? createPortal(
          <div className="navbar-toast-stack" aria-live="polite" aria-atomic="false">
            {toasts.map((toast) => (
              <Toast
                key={toast.id}
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                persistent={toast.persistent}
                onDismiss={() => dismissToast(toast.id)}
                actionLabel={toast.actionLabel}
                onAction={toast.onAction}
              />
            ))}
          </div>,
          toastViewport,
        ) : null}
      </ToastViewportContext.Provider>
    </ToastContext.Provider>
  );
};

// ============================================================================
// User Context
// ============================================================================

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [activeUsers, setActiveUsersState] = useState<User[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [pinProtectedUsers, setPinProtectedUsers] = useState<User[]>([]);
  const [usersMissingPins, setUsersMissingPins] = useState<User[]>([]);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const hasHydratedSessionRef = useRef(false);
  const sessionRefreshRef = useRef<Promise<void> | null>(null);

  const applySessionState = useCallback((nextState: SessionState) => {
    if (typeof nextState.token === "string" && nextState.token.trim()) {
      setStoredSessionToken(nextState.token);
    } else if (nextState.token === null || !nextState.hasAccess) {
      setStoredSessionToken(null);
    }
    setHasAccess(nextState.hasAccess);
    setCurrentUserState(nextState.currentUser);
    setActiveUsersState(
      nextState.activeUsers && nextState.activeUsers.length > 0
        ? nextState.activeUsers
        : nextState.currentUser
          ? [nextState.currentUser]
          : [],
    );
    setPinProtectedUsers(nextState.pinProtectedUsers);
    setUsersMissingPins(nextState.usersMissingPins);
  }, []);

  const clearSessionState = useCallback(() => {
    setStoredSessionToken(null);
    setHasAccess(false);
    setCurrentUserState(null);
    setActiveUsersState([]);
    setPinProtectedUsers([]);
    setUsersMissingPins([]);
  }, []);

  const refreshSession = useCallback(async () => {
    if (sessionRefreshRef.current) return sessionRefreshRef.current;

    const refresh = (async () => {
      const isInitialLoad = !hasHydratedSessionRef.current;
      if (isInitialLoad) setIsSessionLoading(true);
      try {
        let response: Response;
        try {
          const token = getStoredSessionToken();
          response = await fetch("/api/session", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
          });
        } catch {
          // Keep an already-valid session during transient network failures.
          if (isInitialLoad) clearSessionState();
          return;
        }

        if (!response.ok) {
          // Only an explicit auth failure proves the cookie is invalid.
          if (response.status === 401 || response.status === 403) {
            clearSessionState();
          }
          return;
        }

        const session = (await response.json()) as SessionState;
        applySessionState(session);
      } finally {
        if (isInitialLoad) {
          hasHydratedSessionRef.current = true;
          setIsSessionLoading(false);
        }
        sessionRefreshRef.current = null;
      }
    })();

    sessionRefreshRef.current = refresh;
    return refresh;
  }, [applySessionState, clearSessionState]);

  const logoutUser = useCallback(
    async (user?: User | null) => {
      try {
        const url = user
          ? `/api/session/profile?user=${encodeURIComponent(user)}`
          : "/api/session/profile";
        const token = getStoredSessionToken();
        const response = await fetch(url, {
          method: "DELETE",
          credentials: "include",
          cache: "no-store",
          ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        });

        if (!response.ok) {
          throw new Error(
            await readApiErrorMessage(
              response,
              "Failed to log out profile.",
            ),
          );
        }

        const session = (await response.json()) as SessionState;
        applySessionState(session);
        return true;
      } catch (error) {
        throw new Error(
          getErrorMessage(error, "Profile logout is unavailable right now."),
          { cause: error },
        );
      }
    },
    [applySessionState],
  );

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleSessionInvalid = () => {
      void refreshSession();
    };

    window.addEventListener(sessionInvalidationEvent, handleSessionInvalid);
    return () =>
      window.removeEventListener(
        sessionInvalidationEvent,
        handleSessionInvalid,
      );
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      hasAccess,
      pinProtectedUsers,
      usersMissingPins,
      isSessionLoading,
      currentUser,
      activeUsers,
      logoutUser,
      setCurrentUser: async (user: User | null, pin?: string) => {
        if (!user) {
          return logoutUser(null);
        }
        try {
          const token = getStoredSessionToken();
          const response = await fetch("/api/session/profile", {
            method: "POST",
            credentials: "include",
            cache: "no-store",
            headers: token
              ? {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                }
              : {
                  "Content-Type": "application/json",
                },
            body: JSON.stringify({ user, ...(pin ? { pin } : {}) }),
          });

          if (response.status === 401 || response.status === 403) {
            await refreshSession();
            return false;
          }

          if (!response.ok) {
            throw new Error(
              await readApiErrorMessage(
                response,
                "Failed to update profile session.",
              ),
            );
          }

          const session = (await response.json()) as SessionState;
          applySessionState(session);
          return true;
        } catch (error) {
          throw new Error(
            getErrorMessage(error, "Profile login is unavailable right now."),
            { cause: error },
          );
        }
      },
      refreshSession,
    }),
    [
      activeUsers,
      applySessionState,
      currentUser,
      hasAccess,
      isSessionLoading,
      logoutUser,
      pinProtectedUsers,
      usersMissingPins,
      refreshSession,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
