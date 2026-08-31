/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useMemo,
  useCallback,
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
// Viewport Context, Provider & Hooks (consolidated from ViewportContext.tsx)
// ============================================================================

interface ViewportContextValue {
  isMobile: boolean;
  isTv: boolean;
  isSilkBrowser: boolean;
}

export const ViewportContext = createContext<ViewportContextValue | null>(null);

// Self-contained media query hook to prevent circular dependency on hooks/index
const useMediaQueryLocal = (query: string): boolean => {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined") return () => {};
      const matchMedia = window.matchMedia(query);
      matchMedia.addEventListener("change", callback);
      return () => {
        matchMedia.removeEventListener("change", callback);
      };
    },
    [query],
  );

  const getSnapshot = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
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

  useMemo(() => {
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
// Bento Slot Context & Hooks (consolidated from BentoSlotContext.tsx)
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
  viewModes?: MagicToggleOption<string>[];
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
