import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { useUser } from "@/app/useProviders";
import type { User } from "@/shared/types";
import { usePins } from "@/hooks/usePins";
import { consoleError, getErrorMessage } from "@/utils";

interface ProfilePinContextValue {
  currentUser: User | null;
  isDisabled: boolean;
  isSavingPin: boolean;
  isVerifying: boolean;
  selectionError: string | null;
  userHasPin: (user: User) => boolean;
  userNeedsPin: (user: User) => boolean;
  selectProfile: (profile: User) => void;
  handleLogout: () => void;
  openPinSettings: () => void;
  pendingUser: User | null;
  pinSettingsUser: User | null;
  pinMode: "set" | "change";
  handlePinSubmit: (pin: string) => Promise<boolean>;
  handlePinSettingsCancel: () => void;
  handlePinSettingsSubmit: (
    pin: string,
    newPin?: string,
  ) => Promise<boolean>;
  clearPendingUser: () => void;
}

const ProfilePinContext = createContext<ProfilePinContextValue | null>(null);

export const useProfilePin = (): ProfilePinContextValue => {
  const context = useContext(ProfilePinContext);
  if (!context) {
    throw new Error("useProfilePin must be used within ProfilePinProvider");
  }
  return context;
};

export const ProfilePinProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, userNeedsPin, verifyUserPin, setUserPin, isLoading } =
    usePins();
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pinSettingsUser, setPinSettingsUser] = useState<User | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const isDisabled = isLoading || isVerifying;
  const pinMode: "set" | "change" =
    pinSettingsUser && userHasPin(pinSettingsUser) ? "change" : "set";

  const handleLogout = useCallback(() => {
    if (isDisabled) return;
    setSelectionError(null);
    void (async () => {
      try {
        await setCurrentUser(null);
      } catch (err) {
        setSelectionError(
          getErrorMessage(err, "Unable to update the profile session."),
        );
      }
    })();
  }, [isDisabled, setCurrentUser]);

  const selectProfile = useCallback(
    (profile: User) => {
      if (isDisabled) return;
      if (profile === currentUser) {
        handleLogout();
        return;
      }
      setSelectionError(null);
      if (userHasPin(profile)) {
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
      currentUser,
      handleLogout,
      isDisabled,
      setCurrentUser,
      userHasPin,
      userNeedsPin,
    ],
  );

  const handlePinSubmit = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!pendingUser) return false;
      setIsVerifying(true);
      try {
        const ok = await setCurrentUser(pendingUser, pin);
        if (ok) setPendingUser(null);
        return ok;
      } finally {
        setIsVerifying(false);
      }
    },
    [pendingUser, setCurrentUser],
  );

  const openPinSettings = useCallback(() => {
    if (!currentUser || isDisabled || isSavingPin) return;
    setSelectionError(null);
    setPinSettingsUser(currentUser);
  }, [currentUser, isDisabled, isSavingPin]);

  const clearPendingUser = useCallback(() => {
    setPendingUser(null);
    setSelectionError(null);
  }, []);

  const handlePinSettingsCancel = useCallback(() => {
    const required =
      pinSettingsUser && userNeedsPin(pinSettingsUser) ? pinSettingsUser : null;
    setPinSettingsUser(null);
    setSelectionError(null);
    if (required) handleLogout();
  }, [handleLogout, pinSettingsUser, userNeedsPin]);

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

  const value = useMemo(
    () => ({
      currentUser,
      isDisabled,
      isSavingPin,
      isVerifying,
      selectionError,
      userHasPin,
      userNeedsPin,
      selectProfile,
      handleLogout,
      openPinSettings,
      pendingUser,
      pinSettingsUser,
      pinMode,
      handlePinSubmit,
      handlePinSettingsCancel,
      handlePinSettingsSubmit,
      clearPendingUser,
    }),
    [
      clearPendingUser,
      currentUser,
      handleLogout,
      handlePinSettingsCancel,
      handlePinSettingsSubmit,
      handlePinSubmit,
      isDisabled,
      isSavingPin,
      isVerifying,
      openPinSettings,
      pendingUser,
      pinMode,
      pinSettingsUser,
      selectProfile,
      selectionError,
      userHasPin,
      userNeedsPin,
    ],
  );

  return (
    <ProfilePinContext.Provider value={value}>
      {children}
    </ProfilePinContext.Provider>
  );
};
