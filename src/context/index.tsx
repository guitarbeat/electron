/**
 * Consolidated Context Providers
 * Combines Theme, Toast, and User contexts
 */

import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import type { MainTab, User } from '@/types';
import { moviesTheme, placesTheme, spacing } from '@/design-system/tokens';
import Toast from '@/components/ui/Toast';

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
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return sessionStorage.getItem('currentUser') as User | null;
  });

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser: (user: User | null) => {
        if (user) {
          sessionStorage.setItem('currentUser', user);
        } else {
          sessionStorage.removeItem('currentUser');
        }
        setCurrentUser(user);
      },
    }),
    [currentUser]
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
