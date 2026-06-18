import { useState, useRef, useEffect, useCallback, type FC } from "react";
import { useUser } from "@/app/useProviders";
import type { User } from "@/shared/types";
import { usePins } from "@/hooks/usePins";
import { useViewport } from "@/app/ViewportContext";
import { USER_OPTIONS, consoleError, getErrorMessage } from "@/utils";
import PinDialog from "@/common/PinDialog";
import UserAvatar from "@/ui/UserAvatar";

interface Props {
  onOpenChange?: (isOpen: boolean) => void;
}

const ChevronIcon: FC = () => (
  <svg
    className="app-header__chevron"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 4.5L6 7.5L9 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

const LogoutIcon: FC = () => (
  <svg
    width="16"
    height="16"
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

const ProfileMenu: FC<Props> = ({ onOpenChange }) => {
  const { isMobile } = useViewport();
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, userNeedsPin, verifyUserPin, setUserPin, isLoading } =
    usePins();
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pinSettingsUser, setPinSettingsUser] = useState<User | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);

  const isDisabled = isLoading || isVerifying;
  const pinMode = currentUser && userHasPin(currentUser) ? "change" : "set";

  const toggleSettings = useCallback(
    (next: boolean) => {
      setIsSettingsOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!isSettingsOpen) return;
    const handler = (e: PointerEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node)
      ) {
        toggleSettings(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [isSettingsOpen, toggleSettings]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSettingsOpen) {
        toggleSettings(false);
        settingsTriggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isSettingsOpen, toggleSettings]);

  useEffect(() => {
    if (!currentUser) {
      toggleSettings(false);
    }
  }, [currentUser, toggleSettings]);

  const handleLogout = () => {
    if (isDisabled) return;
    setSelectionError(null);
    void (async () => {
      try {
        if (await setCurrentUser(null)) toggleSettings(false);
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
          toggleSettings(false);
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
      if (ok) {
        toggleSettings(false);
        setPendingUser(null);
      }
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
      {isMobile && isSettingsOpen ? (
        <button
          type="button"
          className="app-header__profile-backdrop"
          aria-label="Close profile menu"
          onClick={() => toggleSettings(false)}
        />
      ) : null}

      <div
        className={`app-header__profile-picker${isMobile ? " app-header__profile-picker--mobile" : ""}`}
        ref={pickerRef}
      >
        {isMobile ? (
          <button
            ref={settingsTriggerRef}
            type="button"
            className={`app-header__profile-mobile-trigger${isSettingsOpen ? " is-open" : ""}${currentUser ? " has-user" : ""}`}
            onClick={() => toggleSettings(!isSettingsOpen)}
            aria-expanded={isSettingsOpen}
            aria-haspopup="menu"
            aria-label={
              currentUser
                ? `Signed in as ${currentUser}. Open profile menu`
                : "Guest mode. Open profile menu"
            }
            disabled={isDisabled}
          >
            {currentUser ? (
              <>
                <span className="app-header__option-avatar">
                  <UserAvatar user={currentUser} />
                </span>
                <span className="app-header__profile-mobile-label">{currentUser}</span>
              </>
            ) : (
              <span className="app-header__profile-mobile-label">Guest</span>
            )}
            <ChevronIcon />
          </button>
        ) : (
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
                  className={`app-header__profile-option app-header__profile-option--inline${isActive ? " is-active" : ""}${hasPin ? " has-pin" : ""}`}
                  onClick={() => selectProfile(profile)}
                  disabled={isDisabled}
                  aria-pressed={isActive}
                  aria-label={
                    isActive
                      ? `${profile} (active) — tap again to log out`
                      : hasPin
                        ? `Sign in as ${profile} (PIN protected)`
                        : `Sign in as ${profile}`
                  }
                >
                  <span className="app-header__option-avatar">
                    <UserAvatar user={profile} />
                  </span>
                  <span className="app-header__option-name">{profile}</span>
                  {hasPin && <LockIcon size={12} />}
                </button>
              );
            })}
          </div>
        )}

        {!isMobile && currentUser && (
          <>
            <button
              ref={settingsTriggerRef}
              type="button"
              className={`app-header__profile-settings${isSettingsOpen ? " is-open" : ""}`}
              onClick={() => toggleSettings(!isSettingsOpen)}
              aria-expanded={isSettingsOpen}
              aria-haspopup="menu"
              aria-label="Profile settings"
              disabled={isDisabled}
            >
              <ChevronIcon />
            </button>
          </>
        )}

        {isSettingsOpen && (
          <div
            ref={menuRef}
            className="app-header__profile-menu"
            role="menu"
            aria-label={isMobile ? "Profile menu" : "Profile settings"}
          >
            {isMobile && (
              <div className="app-header__menu-section">
                <p className="app-header__menu-heading">Who&apos;s using this?</p>
                {([...USER_OPTIONS] as User[]).map((profile) => {
                  const isActive = currentUser === profile;
                  const hasPin = userHasPin(profile);
                  return (
                    <button
                      key={profile}
                      type="button"
                      role="menuitem"
                      className={`app-header__profile-option${isActive ? " is-active" : ""}`}
                      onClick={() => selectProfile(profile)}
                      disabled={isDisabled}
                    >
                      <span className="app-header__option-avatar">
                        <UserAvatar user={profile} />
                      </span>
                      <span className="app-header__option-name">{profile}</span>
                      {hasPin && <LockIcon size={14} />}
                    </button>
                  );
                })}
              </div>
            )}

            {currentUser && (
              <div className="app-header__menu-section app-header__menu-section--actions">
                <button
                  type="button"
                  role="menuitem"
                  className="app-header__menu-action"
                  onClick={openPinSettings}
                  disabled={isDisabled || isSavingPin}
                >
                  <LockIcon size={16} />
                  {userNeedsPin(currentUser)
                    ? "Finish PIN Setup"
                    : userHasPin(currentUser)
                      ? "Change PIN"
                      : "Set PIN"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="app-header__menu-action app-header__menu-action--logout"
                  onClick={handleLogout}
                  disabled={isDisabled}
                >
                  <LogoutIcon />
                  Log out
                </button>
              </div>
            )}
          </div>
        )}

        {selectionError && (
          <p className="app-header__picker-error" role="alert">
            {selectionError}
          </p>
        )}
      </div>

      {pendingUser && (
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
      )}
      {pinSettingsUser && (
        <PinDialog
          isOpen
          user={pinSettingsUser}
          mode={pinMode}
          isLoading={isSavingPin}
          onCancel={handlePinSettingsCancel}
          onSubmit={handlePinSettingsSubmit}
          isRequiredSetup={pinMode === "set" && userNeedsPin(pinSettingsUser)}
        />
      )}
    </>
  );
};

export default ProfileMenu;
