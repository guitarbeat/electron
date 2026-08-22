import { useState, useRef, useEffect, useCallback, type FC } from "react";
import { useProfileSelection } from "@/app/ProfilePinContext";
import type { User } from "@/shared/types";
import { USER_OPTIONS } from "@/utils";
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
    width="15"
    height="15"
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

const CloseIcon: FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ProfileMenu: FC<Props> = ({ onOpenChange }) => {
  const {
    currentUser,
    isDisabled,
    isSavingPin,
    selectionError,
    userHasPin,
    userNeedsPin,
    selectProfile,
    handleLogout,
    openPinSettings,
    clearSelectionError,
  } = useProfileSelection();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const toggle = useCallback(
    (next: boolean) => {
      setIsOpen(next);
      if (!next) clearSelectionError();
      onOpenChange?.(next);
    },
    [clearSelectionError, onOpenChange],
  );

  // Close on outside pointer interaction
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(target) &&
        !triggerRef.current.contains(target)
      ) {
        toggle(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [isOpen, toggle]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        toggle(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, toggle]);

  const handleProfileClick = (profile: User) => {
    selectProfile(profile);
    toggle(false);
  };

  const handleSettingsClick = () => {
    openPinSettings();
    toggle(false);
  };

  const handleLogoutClick = () => {
    handleLogout();
    toggle(false);
  };

  return (
    <div className="profile-menu-wrapper">
      <button
        ref={triggerRef}
        type="button"
        className={`app-header__profile-trigger${currentUser ? " is-logged-in" : ""}${isOpen ? " is-open" : ""}`}
        onClick={() => toggle(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={currentUser ? `Profile: ${currentUser}` : "Sign in / Select profile"}
        disabled={isDisabled}
      >
        <UserAvatar user={currentUser} />
        {currentUser ? (
          <span className="app-header__profile-name">{currentUser}</span>
        ) : (
          <span className="app-header__profile-name">Sign in</span>
        )}
        <ChevronIcon />
      </button>

      {isOpen && (
        <>
          {/* Backdrop overlay for reliable outside click dismissal */}
          <div
            className="app-header__profile-backdrop"
            onClick={() => toggle(false)}
            aria-hidden="true"
          />

          <div
            ref={menuRef}
            className="app-header__profile-menu"
            role="menu"
            aria-label="Profile and account selection"
          >
            {/* Header with Title and Close 'X' */}
            <div className="app-header__menu-topbar">
              <div className="app-header__menu-heading">
                <span className="app-header__menu-title">
                  {currentUser ? "Switch Profile" : "Sign In"}
                </span>
                <span className="app-header__menu-subtitle">
                  {currentUser
                    ? `Currently signed in as ${currentUser}`
                    : "Select a user profile to begin"}
                </span>
              </div>
              <button
                type="button"
                className="app-header__menu-close-btn"
                onClick={() => toggle(false)}
                aria-label="Close profile menu"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Profile List */}
            <div className="app-header__menu-section">
              <span className="app-header__menu-label">Profiles</span>
              <div className="app-header__profile-list" role="group">
                {([...USER_OPTIONS] as User[]).map((profile) => {
                  const isActive = currentUser === profile;
                  const hasPin = userHasPin(profile);
                  return (
                    <button
                      key={profile}
                      type="button"
                      role="menuitem"
                      className={`app-header__profile-option${isActive ? " is-active" : ""}${hasPin ? " has-pin" : ""}`}
                      onClick={() => handleProfileClick(profile)}
                      disabled={isDisabled}
                      aria-label={
                        isActive
                          ? `${profile} (active profile - click to switch)`
                          : hasPin
                            ? `Switch to ${profile} (PIN protected)`
                            : `Switch to ${profile}`
                      }
                    >
                      <span className="app-header__option-avatar">
                        <UserAvatar user={profile} />
                      </span>
                      <div className="app-header__option-details">
                        <span className="app-header__option-name">{profile}</span>
                        <span className="app-header__option-status">
                          {isActive
                            ? "Active session"
                            : hasPin
                              ? "PIN Protected"
                              : "No PIN"}
                        </span>
                      </div>
                      {isActive ? (
                        <span className="app-header__option-badge app-header__option-badge--active">
                          Active
                        </span>
                      ) : hasPin ? (
                        <span className="app-header__option-lock">
                          <LockIcon size={13} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Actions */}
            {currentUser && (
              <div className="app-header__menu-section app-header__menu-section--actions">
                <button
                  type="button"
                  role="menuitem"
                  className="app-header__menu-action"
                  onClick={handleSettingsClick}
                  disabled={isDisabled || isSavingPin}
                >
                  <LockIcon size={15} />
                  <span>
                    {userNeedsPin(currentUser)
                      ? "Finish PIN Setup"
                      : userHasPin(currentUser)
                        ? "Change Security PIN"
                        : "Set Security PIN"}
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  className="app-header__menu-action app-header__menu-action--logout"
                  onClick={handleLogoutClick}
                  disabled={isDisabled}
                >
                  <LogoutIcon />
                  <span>Log out (Switch to Guest)</span>
                </button>
              </div>
            )}

            {selectionError && (
              <p className="app-header__menu-error" role="alert">
                {selectionError}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileMenu;
