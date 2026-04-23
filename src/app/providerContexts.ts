import { createContext } from 'react';
import type { User } from '@/shared/types';
import { moviesTheme, placesTheme } from '@/theme/tokens';

export interface ThemeContextValue {
  currentTheme: 'movies' | 'places';
  themeTokens: typeof moviesTheme | typeof placesTheme;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

type ToastType = 'success' | 'error' | 'info';

export interface ToastInput {
  message: string;
  type: ToastType;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  onUndo?: () => void;
}

export interface ToastContextType {
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export interface UserContextType {
  hasAccess: boolean;
  pinProtectedUsers: User[];
  usersMissingPins: User[];
  isSessionLoading: boolean;
  currentUser: User | null;
  setCurrentUser: (user: User | null, pin?: string) => Promise<boolean>;
  refreshSession: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);
