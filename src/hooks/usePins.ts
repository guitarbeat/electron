import { useCallback, useEffect } from "react";
import { useAppSession, useUser } from "@/app/useProviders";
import { mutateScope } from "@/services/state";
import { getErrorMessage, readApiErrorMessage, consoleError } from "@/utils";
import type { User } from "../shared/types.ts";

const PINS_POLL_INTERVAL = 30000;

export const usePins = (isPaused: boolean = false) => {
  const { currentUser } = useUser();
  const {
    hasAccess,
    pinProtectedUsers,
    usersMissingPins,
    isSessionLoading,
    refreshSession,
  } = useAppSession();

  useEffect(() => {
    if (isPaused || !hasAccess) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      void refreshSession();
    }, PINS_POLL_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [hasAccess, isPaused, refreshSession]);

  const userHasPin = useCallback(
    (user: User): boolean => pinProtectedUsers.includes(user),
    [pinProtectedUsers],
  );

  const userNeedsPin = useCallback(
    (user: User): boolean => usersMissingPins.includes(user),
    [usersMissingPins],
  );

  const setUserPin = useCallback(
    async (user: User, pin: string): Promise<boolean> => {
      if (!hasAccess || !currentUser || currentUser !== user) {
        return false;
      }

      try {
        await mutateScope("pins", {
          op: "set_pin",
          payload: { pin },
          optimisticData: {
            Aaron: user === "Aaron" || pinProtectedUsers.includes("Aaron"),
            Electra:
              user === "Electra" || pinProtectedUsers.includes("Electra"),
          },
        });
        await refreshSession();
        return true;
      } catch (error) {
        consoleError("Error setting PIN:", error);
        return false;
      }
    },
    [currentUser, hasAccess, pinProtectedUsers, refreshSession],
  );

  const verifyUserPin = useCallback(
    async (user: User, pin: string): Promise<boolean> => {
      if (!hasAccess) {
        return false;
      }

      try {
        const response = await fetch("/api/session/profile", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user, pin }),
        });

        if (response.status === 401 || response.status === 403) {
          return false;
        }

        if (!response.ok) {
          throw new Error(
            await readApiErrorMessage(response, "Failed to verify PIN."),
          );
        }

        await refreshSession();
        return true;
      } catch (error) {
        consoleError("PIN verification failed:", error);
        throw new Error(
          getErrorMessage(error, "Profile login is unavailable right now."),
          { cause: error },
        );
      }
    },
    [hasAccess, refreshSession],
  );

  return {
    pins: {
      Aaron: pinProtectedUsers.includes("Aaron"),
      Electra: pinProtectedUsers.includes("Electra"),
    },
    usersMissingPins,
    isLoading: isSessionLoading,
    userHasPin,
    userNeedsPin,
    setUserPin,
    verifyUserPin,
    refresh: refreshSession,
  };
};
