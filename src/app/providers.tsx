/* eslint-disable react-refresh/only-export-components */
/**
 * Consolidated Context Providers
 * Combines Theme, Toast, and User contexts
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import type { MainTab, User } from '@/shared/types';
import { moviesTheme, placesTheme, spacing } from '@/theme/tokens';
import Toast from '@/components/ui/Toast';
import { sessionInvalidationEvent } from '@/services/stateClient';
import type { SessionState } from '@/services/stateTypes';
import { getErrorMessage, readApiErrorMessage } from '@/utils';

// ============================================================================
// Theme Context
// ============================================================================

interface ThemeContextValue {
  currentTheme: 'movies' | 'places';
  themeTokens: typeof moviesTheme | typeof placesTheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: ReactNode; activeTab: MainTab }> = ({
  children,
  activeTab,
}) => {
  const currentTheme: 'movies' | 'places' = activeTab === 'places' ? 'places' : 'movies';
  const themeTokens = currentTheme === 'places' ? placesTheme : moviesTheme;

  const value = useMemo(
    () => ({
      currentTheme,
      themeTokens,
    }),
    [currentTheme, themeTokens]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// ============================================================================
// Toast Context
// ============================================================================

type ToastType = 'success' | 'error' | 'info';

interface ToastInput {
  message: string;
  type: ToastType;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  onUndo?: () => void;
}

interface ToastRecord extends ToastInput {
  id: string;
}

interface ToastContextType {
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  return `toast-${Date.now()}`;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((input: ToastInput) => {
    const id = toastId();
    const actionLabel = input.actionLabel || (input.onUndo ? 'Undo' : undefined);
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
    [showToast, dismissToast, clearToasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: 'fixed',
          top: spacing.md,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 250,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
          width: 'min(720px, calc(100vw - 1rem))',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
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

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ============================================================================
// User Context
// ============================================================================

interface UserContextType {
  hasAccess: boolean;
  pinProtectedUsers: User[];
  isSessionLoading: boolean;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => Promise<boolean>;
  refreshSession: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [pinProtectedUsers, setPinProtectedUsers] = useState<User[]>([]);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const applySessionState = useCallback((nextState: SessionState) => {
    console.debug('[session] Applying state:', {
      hasAccess: nextState.hasAccess,
      currentUser: nextState.currentUser,
      pinProtectedUsers: nextState.pinProtectedUsers,
    });
    setHasAccess(nextState.hasAccess);
    setCurrentUserState(nextState.currentUser);
    setPinProtectedUsers(nextState.pinProtectedUsers);
  }, []);

  const refreshSession = useCallback(async () => {
    console.debug('[session] Refreshing session…');
    setIsSessionLoading(true);
    try {
      const response = await fetch('/api/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        console.debug('[session] Refresh failed — status', response.status, '— clearing state');
        setHasAccess(false);
        setCurrentUserState(null);
        setPinProtectedUsers([]);
        return;
      }

      const session = (await response.json()) as SessionState;
      console.debug('[session] Refresh succeeded:', session);
      applySessionState(session);
    } finally {
      setIsSessionLoading(false);
    }
  }, [applySessionState]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleSessionInvalid = () => {
      console.debug('[session] Session invalidation event received — refreshing');
      void refreshSession();
    };

    window.addEventListener(sessionInvalidationEvent, handleSessionInvalid);
    return () =>
      window.removeEventListener(sessionInvalidationEvent, handleSessionInvalid);
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      hasAccess,
      pinProtectedUsers,
      isSessionLoading,
      currentUser,
      setCurrentUser: async (user: User | null) => {
        if (user) {
          console.debug('[session] Logging in as:', user);
        } else {
          console.debug('[session] Logging out');
        }
        try {
          const response = await fetch('/api/session/profile', {
            method: user ? 'POST' : 'DELETE',
            credentials: 'include',
            cache: 'no-store',
            headers: user
              ? {
                  'Content-Type': 'application/json',
                }
              : undefined,
            body: user ? JSON.stringify({ user }) : undefined,
          });

          if (response.status === 401 || response.status === 403) {
            console.debug('[session] Profile update rejected (status', response.status, ') — refreshing session');
            await refreshSession();
            return false;
          }

          if (!response.ok) {
            throw new Error(
              await readApiErrorMessage(response, 'Failed to update profile session.')
            );
          }

          const session = (await response.json()) as SessionState;
          console.debug('[session] Profile update succeeded:', session);
          applySessionState(session);
          return true;
        } catch (error) {
          console.debug('[session] Profile update error:', error);
          throw new Error(
            getErrorMessage(error, 'Profile login is unavailable right now.'),
            { cause: error }
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
      refreshSession,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const useAppSession = (): Pick<
  UserContextType,
  'hasAccess' | 'pinProtectedUsers' | 'isSessionLoading' | 'refreshSession'
> => {
  const context = useUser();
  return {
    hasAccess: context.hasAccess,
    pinProtectedUsers: context.pinProtectedUsers,
    isSessionLoading: context.isSessionLoading,
    refreshSession: context.refreshSession,
  };
};
