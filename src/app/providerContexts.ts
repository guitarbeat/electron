import { createContext } from "react";
import type { User } from "@/shared/types";
import type { AppThemeDefinition, ThemeName } from "@/theme/themes";

export interface ThemeContextValue {
  currentTheme: ThemeName;
  theme: AppThemeDefinition;
  /** @deprecated Use `theme.tokens` */
  themeTokens: AppThemeDefinition["tokens"];
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

type ToastType = "success" | "error" | "info";

export interface ToastInput {
  message: string;
  type: ToastType;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  onUndo?: () => void;
  persistent?: boolean;
}

export interface ToastContextType {
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined,
);

export interface UserContextType {
  hasAccess: boolean;
  pinProtectedUsers: User[];
  usersMissingPins: User[];
  isSessionLoading: boolean;
  currentUser: User | null;
  setCurrentUser: (user: User | null, pin?: string) => Promise<boolean>;
  refreshSession: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined,
);
