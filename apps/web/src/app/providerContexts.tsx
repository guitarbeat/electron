/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import type { User, MainTab } from "@/shared/types";
import type { AppThemeDefinition, ThemeName } from "@/theme/tokens";

// ============================================================================
// Theme Context & Hooks
// ============================================================================

export interface ThemeContextValue {
  currentTheme: ThemeName;
  theme: AppThemeDefinition;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

/** Semantic palette for the active Movies / Places tab (inline styles). */
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme.semantic;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useMemo(
    () => ({
      currentTheme: "dark" as ThemeName,
      theme: {
        semantic: {
          bg: "#090d16",
          surface1: "#0f172a",
          surface2: "#1e293b",
          textPrimary: "#ffffff",
          textSecondary: "#94a3b8",
          textTertiary: "#64748b",
          accent: "#6366f1",
          border: "rgba(255, 255, 255, 0.12)",
        },
      } as unknown as AppThemeDefinition,
    }),
    []
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ============================================================================
// Toast Context, Interface, & Hooks
// ============================================================================

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

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const showToast = useCallback((toast: ToastInput) => {
    console.log("Toast:", toast.message);
    return `toast-${Date.now()}`;
  }, []);

  const dismissToast = useCallback((_id: string) => {}, []);
  const clearToasts = useCallback(() => {}, []);

  const value = useMemo(
    () => ({ showToast, dismissToast, clearToasts }),
    [showToast, dismissToast, clearToasts]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

// ============================================================================
// User Context & Hooks
// ============================================================================

export interface UserContextType {
  hasAccess: boolean;
  pinProtectedUsers: User[];
  usersMissingPins: User[];
  isSessionLoading: boolean;
  currentUser: User | null;
  activeUsers: User[];
  setCurrentUser: (user: User | null, pin?: string) => Promise<boolean>;
  logoutUser: (user?: User | null) => Promise<boolean>;
  refreshSession: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined,
);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserLocal] = useState<User | null>("Aaron");
  const [hasAccess] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app_current_user");
      if (saved === "Aaron" || saved === "Electra") {
        setCurrentUserLocal(saved as User);
      }
    }
  }, []);

  const setCurrentUser = useCallback(async (user: User | null): Promise<boolean> => {
    setCurrentUserLocal(user);
    if (typeof window !== "undefined" && user) {
      localStorage.setItem("app_current_user", user);
    }
    return true;
  }, []);

  const logoutUser = useCallback(async (): Promise<boolean> => {
    setCurrentUserLocal(null);
    return true;
  }, []);

  const refreshSession = useCallback(async (): Promise<void> => {}, []);

  const value = useMemo(
    () => ({
      hasAccess,
      pinProtectedUsers: [],
      usersMissingPins: [],
      isSessionLoading: false,
      currentUser,
      activeUsers: ["Aaron", "Electra"] as User[],
      setCurrentUser,
      logoutUser,
      refreshSession,
    }),
    [currentUser, hasAccess, setCurrentUser, logoutUser, refreshSession]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useAppSession = (): Pick<
  UserContextType,
  | "hasAccess"
  | "pinProtectedUsers"
  | "usersMissingPins"
  | "isSessionLoading"
  | "refreshSession"
> => {
  const context = useUser();
  return useMemo(
    () => ({
      hasAccess: context.hasAccess,
      pinProtectedUsers: context.pinProtectedUsers,
      usersMissingPins: context.usersMissingPins,
      isSessionLoading: context.isSessionLoading,
      refreshSession: context.refreshSession,
    }),
    [
      context.hasAccess,
      context.pinProtectedUsers,
      context.usersMissingPins,
      context.isSessionLoading,
      context.refreshSession,
    ],
  );
};

// ============================================================================
// Viewport Context, Provider & Hooks
// ============================================================================

interface ViewportContextValue {
  isMobile: boolean;
  isTv: boolean;
  isSilkBrowser: boolean;
}

export const ViewportContext = createContext<ViewportContextValue | null>(null);

const useMediaQueryLocal = (query: string): boolean => {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return () => {};
      }
      try {
        const matchMedia = window.matchMedia(query);
        if (typeof matchMedia.addEventListener === "function") {
          matchMedia.addEventListener("change", callback);
          return () => {
            matchMedia.removeEventListener("change", callback);
          };
        }
        if (typeof matchMedia.addListener === "function") {
          matchMedia.addListener(callback);
          return () => {
            matchMedia.removeListener(callback);
          };
        }
      } catch {
        // Ignore matchMedia errors
      }
      return () => {};
    },
    [query],
  );

  const getSnapshot = () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  };
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

export const ViewportProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const isMobile = useMediaQueryLocal("(max-width: 640px)");

  const isSilkBrowser = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /Silk|Kindle|FireTV|AFTS|AFTB|AmazonWebAppPlatform/i.test(
      navigator.userAgent,
    );
  }, []);

  const isTv = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return (
      isSilkBrowser ||
      /tv|smarttv|googletv|appletv|firetv|hbbtv/i.test(navigator.userAgent)
    );
  }, [isSilkBrowser]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (isTv) {
      root.classList.add("is-tv-runtime");
    } else {
      root.classList.remove("is-tv-runtime");
    }

    if (isSilkBrowser) {
      root.classList.add("is-silk-browser");
    } else {
      root.classList.remove("is-silk-browser");
    }
  }, [isTv, isSilkBrowser]);

  const value = useMemo(
    () => ({ isMobile, isTv, isSilkBrowser }),
    [isMobile, isTv, isSilkBrowser],
  );

  return (
    <ViewportContext.Provider value={value}>
      {children}
    </ViewportContext.Provider>
  );
};

export function useViewport(): ViewportContextValue {
  const ctx = useContext(ViewportContext);
  if (!ctx) {
    throw new Error("useViewport must be used within ViewportProvider");
  }
  return ctx;
}

// ============================================================================
// Bento Slot Context & Hooks
// ============================================================================

import type {
  MagicToggleOption,
  BentoSortChipConfig,
  BentoStatTileConfig,
  SortOrder,
} from "@/components/ui";

export interface BentoSlotConfig {
  ariaLabel?: string;
  stats?: BentoStatTileConfig[];
  sorts?: BentoSortChipConfig[];
  activeSortOrder?: SortOrder;
  onSortChange?(order: SortOrder): void;
  viewModes?: MagicToggleOption[];
  activeViewMode?: string;
  onViewModeChange?: (mode: string) => void;
  viewModeAriaLabel?: string;
}

export type RegisteredBentoSlotConfig = BentoSlotConfig;

export interface BentoSlotContextValue {
  activeTab: MainTab;
  registerTabConfig: (tab: MainTab, config: RegisteredBentoSlotConfig) => void;
  searchPortalEl: HTMLDivElement | null;
}

export const BentoSlotContext = createContext<BentoSlotContextValue | null>(
  null,
);

export function useBentoSlot(): BentoSlotContextValue {
  const ctx = useContext(BentoSlotContext);
  if (!ctx) {
    throw new Error("useBentoSlot must be used within AppWorkspaceShell");
  }
  return ctx;
}

// ============================================================================
// AppProviders Composite Provider
// ============================================================================

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <ViewportProvider>
        <ToastProvider>
          <UserProvider>{children}</UserProvider>
        </ToastProvider>
      </ViewportProvider>
    </ThemeProvider>
  );
};
