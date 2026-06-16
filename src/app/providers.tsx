/**
 * Consolidated Context Providers
 * Combines Theme, Toast, and User contexts
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import type { User } from '@/shared/types';
import { applyTheme } from '@/theme/applyTheme';
import { spacing } from '@/theme/tokens';
import Toast from '@/components/ui/Toast';
import { sessionInvalidationEvent } from '@/services/state';
import type { SessionState } from '@/services/state/stateTypes';
import { getErrorMessage, readApiErrorMessage } from '@/utils';
import {
  ThemeContext,
  ToastContext,
  UserContext,
  type ToastInput,
} from "./providerContexts";

const debugSession = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.debug(...args);
  }
};

// ============================================================================
// Theme Context
// ============================================================================

import { getAppTheme, type ThemeName } from '@/theme/themes';

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

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
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
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: "fixed",
          top: spacing.md,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 250,
          display: "flex",
          flexDirection: "column",
          gap: spacing.sm,
          width: "min(720px, calc(100vw - 1rem))",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: "auto" }}>
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              persistent={toast.persistent}
              onDismiss={() => dismissToast(toast.id)}
              actionLabel={toast.actionLabel}
              onAction={toast.onAction}
            />
          </div>
        ))}
      </div>
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
  const [hasAccess, setHasAccess] = useState(false);
  const [pinProtectedUsers, setPinProtectedUsers] = useState<User[]>([]);
  const [usersMissingPins, setUsersMissingPins] = useState<User[]>([]);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const applySessionState = useCallback((nextState: SessionState) => {
    debugSession("[session] Applying state:", {
      hasAccess: nextState.hasAccess,
      currentUser: nextState.currentUser,
      pinProtectedUsers: nextState.pinProtectedUsers,
      usersMissingPins: nextState.usersMissingPins,
    });
    setHasAccess(nextState.hasAccess);
    setCurrentUserState(nextState.currentUser);
    setPinProtectedUsers(nextState.pinProtectedUsers);
    setUsersMissingPins(nextState.usersMissingPins);
  }, []);

  const refreshSession = useCallback(async () => {
    debugSession("[session] Refreshing session…");
    setIsSessionLoading(true);
    try {
      let response: Response;
      try {
        response = await fetch("/api/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
      } catch (error) {
        debugSession("[session] Refresh network error — clearing state", error);
        setHasAccess(false);
        setCurrentUserState(null);
        setPinProtectedUsers([]);
        setUsersMissingPins([]);
        return;
      }

      if (!response.ok) {
        debugSession(
          "[session] Refresh failed — status",
          response.status,
          "— clearing state",
        );
        setHasAccess(false);
        setCurrentUserState(null);
        setPinProtectedUsers([]);
        setUsersMissingPins([]);
        return;
      }

      const session = (await response.json()) as SessionState;
      debugSession("[session] Refresh succeeded:", session);
      applySessionState(session);
    } finally {
      setIsSessionLoading(false);
    }
  }, [applySessionState]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleSessionInvalid = () => {
      debugSession(
        "[session] Session invalidation event received — refreshing",
      );
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
      setCurrentUser: async (user: User | null, pin?: string) => {
        if (user) {
          debugSession("[session] Logging in as:", user);
        } else {
          debugSession("[session] Logging out");
        }
        try {
          const response = await fetch("/api/session/profile", {
            method: user ? "POST" : "DELETE",
            credentials: "include",
            cache: "no-store",
            headers: user
              ? {
                  "Content-Type": "application/json",
                }
              : undefined,
            body: user
              ? JSON.stringify({ user, ...(pin ? { pin } : {}) })
              : undefined,
          });

          if (response.status === 401 || response.status === 403) {
            debugSession(
              "[session] Profile update rejected (status",
              response.status,
              ") — refreshing session",
            );
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
          debugSession("[session] Profile update succeeded:", session);
          applySessionState(session);
          return true;
        } catch (error) {
          debugSession("[session] Profile update error:", error);
          throw new Error(
            getErrorMessage(error, "Profile login is unavailable right now."),
            { cause: error },
          );
        }
      },
      refreshSession,
    }),
    [
      applySessionState,
      currentUser,
      hasAccess,
      isSessionLoading,
      pinProtectedUsers,
      usersMissingPins,
      refreshSession,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
