/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { useUser } from "@/app/providerContexts";
import type { User } from "@/shared/types";
import { usePins } from "@/hooks";
import { consoleError, getErrorMessage } from "@/utils";

interface ProfileSelectionContextValue {
  currentUser: User | null;
  activeUsers: User[];
  isDisabled: boolean;
  isSavingPin: boolean;
  selectionError: string | null;
  userHasPin: (user: User) => boolean;
  userNeedsPin: (user: User) => boolean;
  selectProfile: (profile: User) => void;
  handleLogout: () => void;
  handleLogoutUser: (user: User) => void;
  openPinSettings: (userToEdit?: User | null) => void;
  clearSelectionError: () => void;
}

interface PinPanelContextValue {
  pendingUser: User | null;
  pinSettingsUser: User | null;
  pinMode: "set" | "change";
  isVerifying: boolean;
  isSavingPin: boolean;
  handlePinSubmit: (pin: string) => Promise<boolean>;
  handlePinSettingsCancel: () => void;
  handlePinSettingsSubmit: (pin: string, newPin?: string) => Promise<boolean>;
  clearPendingUser: () => void;
}

const ProfileSelectionContext =
  createContext<ProfileSelectionContextValue | null>(null);

const PinPanelContext = createContext<PinPanelContextValue | null>(null);

export const useProfileSelection = (): ProfileSelectionContextValue => {
  const context = useContext(ProfileSelectionContext);
  if (!context) {
    throw new Error(
      "useProfileSelection must be used within ProfilePinProvider",
    );
  }
  return context;
};

export const usePinPanel = (): PinPanelContextValue => {
  const context = useContext(PinPanelContext);
  if (!context) {
    throw new Error("usePinPanel must be used within ProfilePinProvider");
  }
  return context;
};

export const ProfilePinProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { currentUser, activeUsers, setCurrentUser, logoutUser } = useUser();
  const { userHasPin, userNeedsPin, verifyUserPin, setUserPin, isLoading } =
    usePins();
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pinSettingsUser, setPinSettingsUser] = useState<User | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const pinMode: "set" | "change" =
    pinSettingsUser && userHasPin(pinSettingsUser) ? "change" : "set";

  const clearSelectionError = useCallback(() => {
    setSelectionError(null);
  }, []);

  const handleLogout = useCallback(async () => {
    setSelectionError(null);
    await logoutUser(null);
  }, [logoutUser]);

  const handleLogoutGuarded = useCallback(() => {
    if (isLoading || isVerifying) return;
    setSelectionError(null);
    void (async () => {
      try {
        await handleLogout();
      } catch (err) {
        setSelectionError(
          getErrorMessage(err, "Unable to update the profile session."),
        );
      }
    })();
  }, [handleLogout, isLoading, isVerifying]);

  const handleLogoutUserGuarded = useCallback(
    (user: User) => {
      if (isLoading || isVerifying) return;
      setSelectionError(null);
      void (async () => {
        try {
          await logoutUser(user);
        } catch (err) {
          setSelectionError(
            getErrorMessage(err, "Unable to update the profile session."),
          );
        }
      })();
    },
    [isLoading, isVerifying, logoutUser],
  );

  const selectProfile = useCallback(
    (profile: User) => {
      if (isLoading || isVerifying) return;
      setSelectionError(null);
      if (userHasPin(profile) && !activeUsers.includes(profile)) {
        setPendingUser(profile);
        return;
      }
      void (async () => {
        try {
          if (await setCurrentUser(profile)) {
            if (userNeedsPin(profile)) setPinSettingsUser(profile);
          }
        } catch (err) {
          consoleError("Profile selection failed:", err);
          setSelectionError(
            getErrorMessage(err, "Profile login is unavailable right now."),
          );
        }
      })();
    },
    [
      isLoading,
      isVerifying,
      setCurrentUser,
      userHasPin,
      userNeedsPin,
      activeUsers,
    ],
  );

  const handlePinSubmit = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!pendingUser) return false;
      setIsVerifying(true);
      try {
        const ok = await setCurrentUser(pendingUser, pin);
        if (ok) {
          setPendingUser(null);
          setSelectionError(null);
        }
        return ok;
      } finally {
        setIsVerifying(false);
      }
    },
    [pendingUser, setCurrentUser],
  );

  const openPinSettings = useCallback(
    (userToEdit?: User | null) => {
      const target = userToEdit || currentUser;
      if (!target || isLoading || isVerifying || isSavingPin) return;
      setSelectionError(null);
      setPinSettingsUser(target);
    },
    [currentUser, isLoading, isSavingPin, isVerifying],
  );

  const clearPendingUser = useCallback(() => {
    setPendingUser(null);
    setSelectionError(null);
  }, []);

  const handlePinSettingsCancel = useCallback(() => {
    const required =
      pinSettingsUser && userNeedsPin(pinSettingsUser) ? pinSettingsUser : null;
    setPinSettingsUser(null);
    setSelectionError(null);
    if (required) handleLogoutGuarded();
  }, [handleLogoutGuarded, pinSettingsUser, userNeedsPin]);

  const handlePinSettingsSubmit = useCallback(
    async (pin: string, newPin?: string): Promise<boolean> => {
      if (!pinSettingsUser) return false;
      setIsSavingPin(true);
      try {
        if (pinMode === "set") {
          const saved = await setUserPin(pinSettingsUser, pin);
          if (saved) setPinSettingsUser(null);
          return saved;
        }
        if (!newPin) return verifyUserPin(pinSettingsUser, pin);
        if (!(await verifyUserPin(pinSettingsUser, pin))) return false;
        const saved = await setUserPin(pinSettingsUser, newPin);
        if (saved) setPinSettingsUser(null);
        return saved;
      } finally {
        setIsSavingPin(false);
      }
    },
    [pinMode, pinSettingsUser, setUserPin, verifyUserPin],
  );

  const selectionValue = useMemo(
    () => ({
      currentUser,
      activeUsers,
      isDisabled: isLoading || isVerifying,
      isSavingPin,
      selectionError,
      userHasPin,
      userNeedsPin,
      selectProfile,
      handleLogout: handleLogoutGuarded,
      handleLogoutUser: handleLogoutUserGuarded,
      openPinSettings,
      clearSelectionError,
    }),
    [
      currentUser,
      activeUsers,
      handleLogoutGuarded,
      handleLogoutUserGuarded,
      isLoading,
      isSavingPin,
      isVerifying,
      openPinSettings,
      selectProfile,
      selectionError,
      userHasPin,
      userNeedsPin,
      clearSelectionError,
    ],
  );

  const pinPanelValue = useMemo(
    () => ({
      pendingUser,
      pinSettingsUser,
      pinMode,
      isVerifying,
      isSavingPin,
      handlePinSubmit,
      handlePinSettingsCancel,
      handlePinSettingsSubmit,
      clearPendingUser,
    }),
    [
      clearPendingUser,
      handlePinSettingsCancel,
      handlePinSettingsSubmit,
      handlePinSubmit,
      isSavingPin,
      isVerifying,
      pendingUser,
      pinMode,
      pinSettingsUser,
    ],
  );

  return (
    <ProfileSelectionContext.Provider value={selectionValue}>
      <PinPanelContext.Provider value={pinPanelValue}>
        {children}
      </PinPanelContext.Provider>
    </ProfileSelectionContext.Provider>
  );
};
