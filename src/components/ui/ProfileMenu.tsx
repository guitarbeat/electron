import { useState, useRef, type FC } from "react";
import { useUser } from "@/app/useProviders";
import type { User } from "@/shared/types";
import { usePins } from "@/hooks/usePins";
import { USER_OPTIONS, consoleError, getErrorMessage } from "@/utils";
import PinDialog from "@/common/PinDialog";
import UserAvatar from "@/ui/UserAvatar";

const LockIcon: FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="5"
      y="11"
      width="14"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M8 11V7a4 4 0 018 0v4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const LogoutIcon: FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="16,17 21,12 16,7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="21"
      y1="12"
      x2="9"
      y2="12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ProfileMenu: FC = () => {
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, userNeedsPin, verifyUserPin, setUserPin, isLoading } =
    usePins();
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pinSettingsUser, setPinSettingsUser] = useState<User | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const isDisabled = isLoading || isVerifying;
  const pinMode = currentUser && userHasPin(currentUser) ? "change" : "set";

  const handleLogout = () => {
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
  };

  const selectProfile = (profile: User) => {
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
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (!pendingUser) return false;
    setIsVerifying(true);
    try {
      const ok = await setCurrentUser(pendingUser, pin);
      if (ok) setPendingUser(null);
      return ok;
    } finally {
      setIsVerifying(false);
    }
  };

  const openPinSettings = () => {
    if (!currentUser || isDisabled || isSavingPin) return;
    setSelectionError(null);
    setPinSettingsUser(currentUser);
  };

  const handlePinSettingsCancel = () => {
    const required =
      pinSettingsUser && userNeedsPin(pinSettingsUser) ? pinSettingsUser : null;
    setPinSettingsUser(null);
    setSelectionError(null);
    if (required) handleLogout();
  };

  const handlePinSettingsSubmit = async (
    pin: string,
    newPin?: string,
  ): Promise<boolean> => {
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
  };

  return (
    <>
      <div className="app-header__profile-picker" ref={pickerRef}>
        <div
          className="app-header__profile-list app-header__profile-list--inline"
          role="group"
          aria-label="Select profile"
        >
          {([...USER_OPTIONS] as User[]).map((profile) => {
            const isActive = currentUser === profile;
            const hasPin = userHasPin(profile);
            return (
              <button
                key={profile}
                type="button"
                className={`app-header__profile-option app-header__profile-option--inline${
                  isActive ? " is-active is-logout" : ""
                }${hasPin ? " has-pin" : ""}`}
                onClick={() => selectProfile(profile)}
                disabled={isDisabled}
                aria-pressed={isActive}
                aria-label={
                  isActive
                    ? `Log out as ${profile}`
                    : hasPin
                      ? `Sign in as ${profile} (PIN protected)`
                      : `Sign in as ${profile}`
                }
                title={isActive ? `Log out as ${profile}` : undefined}
              >
                <span className="app-header__option-avatar">
                  <UserAvatar user={profile} />
                  {isActive ? (
                    <span className="app-header__avatar-logout-badge" aria-hidden="true">
                      <LogoutIcon size={12} />
                    </span>
                  ) : null}
                </span>
                <span className="app-header__option-name">
                  {isActive ? "Log out" : profile}
                </span>
                {!isActive && hasPin ? <LockIcon size={12} /> : null}
              </button>
            );
          })}
        </div>

        {currentUser ? (
          <button
            type="button"
            className="app-header__profile-pin-btn"
            onClick={openPinSettings}
            disabled={isDisabled || isSavingPin}
            aria-label={
              userNeedsPin(currentUser)
                ? "Finish PIN setup"
                : userHasPin(currentUser)
                  ? "Change PIN"
                  : "Set PIN"
            }
            title={
              userNeedsPin(currentUser)
                ? "Finish PIN setup"
                : userHasPin(currentUser)
                  ? "Change PIN"
                  : "Set PIN"
            }
          >
            <LockIcon size={14} />
          </button>
        ) : null}

        {selectionError ? (
          <p className="app-header__picker-error" role="alert">
            {selectionError}
          </p>
        ) : null}
      </div>

      {pendingUser ? (
        <PinDialog
          isOpen
          user={pendingUser}
          mode="enter"
          isLoading={isVerifying}
          onCancel={() => {
            setPendingUser(null);
            setSelectionError(null);
          }}
          onSubmit={handlePinSubmit}
        />
      ) : null}
      {pinSettingsUser ? (
        <PinDialog
          isOpen
          user={pinSettingsUser}
          mode={pinMode}
          isLoading={isSavingPin}
          onCancel={handlePinSettingsCancel}
          onSubmit={handlePinSettingsSubmit}
          isRequiredSetup={pinMode === "set" && userNeedsPin(pinSettingsUser)}
        />
      ) : null}
    </>
  );
};

export default ProfileMenu;
