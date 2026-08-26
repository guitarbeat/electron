import { useContext, useMemo } from "react";
import type {
  ThemeContextValue,
  ToastContextType,
  UserContextType,
} from "./providerContexts";
import { ThemeContext, ToastContext, UserContext } from "./providerContexts";

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

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

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
