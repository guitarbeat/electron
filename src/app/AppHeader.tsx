import type { FC } from 'react';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useUser } from '@/app/useProviders';
import { USER_PHOTOS, type MainTab, type User } from '@/shared/types';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { usePins } from '@/hooks/usePins';
import { USER_OPTIONS, consoleError, getErrorMessage } from '@/utils';
import ThemeToggle from '@/ui/ThemeToggle';
import PinDialog from '@/common/PinDialog';
import { useAppHeaderSlot } from '@/app/AppHeaderContext';
import './AppHeader.css';

interface AppHeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  pwaStatus?: {
    isOnline: boolean;
    isStandalone: boolean;
    canInstall: boolean;
    hasUpdateReady: boolean;
    pendingSyncCount: number;
    blockedSyncCount: number;
  };
  onInstallApp?: () => void;
  onApplyUpdate?: () => void;
  onRetrySync?: () => void;
  onOpenSpin?: () => void;
}

const AppHeader: FC<AppHeaderProps> = ({
  activeTab,
  onTabChange,
  pwaStatus,
  onInstallApp,
  onApplyUpdate,
  onRetrySync,
  onOpenSpin,
}) => {
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, userNeedsPin, verifyUserPin, setUserPin, isLoading } =
    usePins();
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pinSettingsUser, setPinSettingsUser] = useState<User | null>(null);
  const [isSavingPinSettings, setIsSavingPinSettings] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLSpanElement>(null);

  const slot = useAppHeaderSlot();

  useEffect(() => {
    if (!slot) return;
    slot.setCenterNode(centerRef.current);
    return () => slot.setCenterNode(null);
  }, [slot]);

  const users: User[] = [...USER_OPTIONS];
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const isDisabled = isLoading || isVerifying;
  const selectedNamedUser = currentUser;
  const pinSettingsMode =
    selectedNamedUser && userHasPin(selectedNamedUser) ? "change" : "set";
  const brandLabel = "Electron";
  const pwaChip = (() => {
    if (!pwaStatus) {
      return null;
    }

    if (!pwaStatus.isOnline) {
      return {
        tone: "offline" as const,
        label: "Offline",
        detail: "Local cache only",
        action: undefined,
        actionLabel: undefined,
      };
    }

    if (pwaStatus.hasUpdateReady) {
      return {
        tone: "update" as const,
        label: "Update ready",
        detail: "Refresh app shell",
        action: onApplyUpdate,
        actionLabel: "Refresh",
      };
    }

    if (pwaStatus.blockedSyncCount > 0) {
      return {
        tone: "warning" as const,
        label: "Sync blocked",
        detail: `${pwaStatus.blockedSyncCount} section${pwaStatus.blockedSyncCount === 1 ? "" : "s"} need attention`,
        action: onRetrySync,
        actionLabel: "Retry",
      };
    }

    if (pwaStatus.pendingSyncCount > 0) {
      return {
        tone: "syncing" as const,
        label: "Syncing",
        detail: `${pwaStatus.pendingSyncCount} pending change${pwaStatus.pendingSyncCount === 1 ? "" : "s"}`,
        action: onRetrySync,
        actionLabel: "Sync now",
      };
    }

    if (pwaStatus.canInstall && !pwaStatus.isStandalone) {
      return {
        tone: "install" as const,
        label: "Install app",
        detail: "Open like native",
        action: onInstallApp,
        actionLabel: "Install",
      };
    }

    if (pwaStatus.isStandalone) {
      return {
        tone: "ready" as const,
        label: "Installed",
        detail: "Standalone mode",
        action: undefined,
        actionLabel: undefined,
      };
    }

    return {
      tone: "ready" as const,
      label: "Live sync",
      detail: "App connected",
      action: undefined,
      actionLabel: undefined,
    };
  })();
  const pwaChipDismissKey = pwaChip
    ? `electron:pwa-chip:${pwaChip.tone}:${pwaChip.detail}`
    : null;
  const [isPwaChipDismissed, setIsPwaChipDismissed] = useState(false);
  const shouldShowPwaChip = Boolean(
    isMobile && pwaChip && pwaChip.tone !== "ready" && !isPwaChipDismissed,
  );

  useEffect(() => {
    if (!pwaChipDismissKey) {
      setIsPwaChipDismissed(false);
      return;
    }

    try {
      setIsPwaChipDismissed(
        window.localStorage.getItem(pwaChipDismissKey) === "1",
      );
    } catch {
      setIsPwaChipDismissed(false);
    }
  }, [pwaChipDismissKey]);

  const dismissPwaChip = () => {
    if (pwaChipDismissKey) {
      try {
        window.localStorage.setItem(pwaChipDismissKey, "1");
      } catch {
        // Ignore storage failures and still dismiss in-memory.
      }
    }

    setIsPwaChipDismissed(true);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener("pointerdown", handleClickOutside);
      return () =>
        document.removeEventListener("pointerdown", handleClickOutside);
    }
  }, [isProfileMenuOpen]);

  // Close menu on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isProfileMenuOpen) {
        setIsProfileMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isProfileMenuOpen]);

  useLayoutEffect(() => {
    const header = headerRef.current;
    const left = leftRef.current;
    const center = centerRef.current;
    const right = rightRef.current;
    const brand = brandRef.current;

    if (!header || !left || !center || !right || !brand) {
      return;
    }

    let frameId = 0;
    const deferredIds: number[] = [];

    const fitBrand = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        brand.style.setProperty("--electron-scale", "1");
        const naturalWidth = brand.scrollWidth;
        const availableWidth = center.clientWidth;
        const scale =
          naturalWidth > 0
            ? Math.min(1, Math.max(0.56, (availableWidth - 2) / naturalWidth))
            : 1;
        brand.style.setProperty("--electron-scale", scale.toFixed(3));
      });
    };

    fitBrand();
    deferredIds.push(
      window.setTimeout(fitBrand, 80),
      window.setTimeout(fitBrand, 300),
    );

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(fitBrand)
        : null;
    [header, left, center, right, brand].forEach((element) =>
      resizeObserver?.observe(element),
    );

    window.addEventListener("resize", fitBrand);
    window.addEventListener("orientationchange", fitBrand);
    window.visualViewport?.addEventListener("resize", fitBrand);
    document.addEventListener("visibilitychange", fitBrand);

    const fontSet = document.fonts;
    void fontSet?.ready.then(fitBrand);
    fontSet?.addEventListener("loadingdone", fitBrand);
    fontSet?.addEventListener("loadingerror", fitBrand);

    return () => {
      cancelAnimationFrame(frameId);
      deferredIds.forEach((id) => window.clearTimeout(id));
      resizeObserver?.disconnect();
      window.removeEventListener("resize", fitBrand);
      window.removeEventListener("orientationchange", fitBrand);
      window.visualViewport?.removeEventListener("resize", fitBrand);
      document.removeEventListener("visibilitychange", fitBrand);
      fontSet?.removeEventListener("loadingdone", fitBrand);
      fontSet?.removeEventListener("loadingerror", fitBrand);
    };
  }, [activeTab, currentUser]);

  const selectProfile = (profile: User) => {
    if (isDisabled) return;
    if (profile === currentUser) {
      handleLogout();
      return;
    }

    setSelectionError(null);

    if (userHasPin(profile)) {
      setPendingUser(profile);
    } else {
      void (async () => {
        try {
          const didSet = await setCurrentUser(profile);
          if (didSet) {
            setIsProfileMenuOpen(false);
            if (userNeedsPin(profile)) {
              setPinSettingsUser(profile);
            }
          }
        } catch (error) {
          consoleError("Profile selection failed:", error);
          setSelectionError(
            getErrorMessage(error, "Profile login is unavailable right now."),
          );
        }
      })();
    }
  };

  const handleLogout = () => {
    if (isDisabled) return;
    setSelectionError(null);

    void (async () => {
      try {
        const didClear = await setCurrentUser(null);
        if (didClear) {
          setIsProfileMenuOpen(false);
        }
      } catch (error) {
        consoleError("Profile logout failed:", error);
        setSelectionError(
          getErrorMessage(error, "Unable to update the profile session."),
        );
      }
    })();
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (!pendingUser) return false;
    setIsVerifying(true);
    try {
      const didSet = await setCurrentUser(pendingUser, pin);
      if (didSet) {
        setIsProfileMenuOpen(false);
        setPendingUser(null);
        return true;
      }
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const openPinSettings = () => {
    if (!selectedNamedUser || isDisabled || isSavingPinSettings) return;
    setSelectionError(null);
    setPinSettingsUser(selectedNamedUser);
  };

  const handlePinSettingsCancel = () => {
    const requiredSetupUser =
      pinSettingsUser && userNeedsPin(pinSettingsUser) ? pinSettingsUser : null;
    setPinSettingsUser(null);
    setSelectionError(null);

    if (requiredSetupUser) {
      handleLogout();
    }
  };

  const handlePinSettingsSubmit = async (
    pin: string,
    newPin?: string,
  ): Promise<boolean> => {
    if (!pinSettingsUser) return false;

    setIsSavingPinSettings(true);
    try {
      if (pinSettingsMode === "set") {
        const saved = await setUserPin(pinSettingsUser, pin);
        if (saved) setPinSettingsUser(null);
        return saved;
      }

      if (!newPin) {
        return verifyUserPin(pinSettingsUser, pin);
      }

      const stillValid = await verifyUserPin(pinSettingsUser, pin);
      if (!stillValid) return false;

      const saved = await setUserPin(pinSettingsUser, newPin);
      if (saved) setPinSettingsUser(null);
      return saved;
    } finally {
      setIsSavingPinSettings(false);
    }
  };

  const getAvatarContent = (user: User) => {
    const photoUrl = USER_PHOTOS[user];
    if (photoUrl) {
      return (
        <>
          <img
            src={photoUrl}
            alt=""
            className="app-header__avatar-image"
            draggable="false"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const sibling = target.nextElementSibling as HTMLElement | null;
              if (sibling) sibling.style.display = "";
            }}
          />
          <span
            className="app-header__avatar-initial"
            style={{ display: "none" }}
          >
            {user.charAt(0)}
          </span>
        </>
      );
    }
    return <span className="app-header__avatar-initial">{user.charAt(0)}</span>;
  };

  return (
    <header
      ref={headerRef}
      className={`app-header app-header--${activeTab}${isProfileMenuOpen ? " is-profile-menu-open" : ""}${slot?.hasSearch ? " app-header--has-search" : ""}`}
      role="banner"
    >
      {/* Left: Theme Toggle + Background Toggle */}
      <div ref={leftRef} className="app-header__left">
        {shouldShowPwaChip && pwaChip ? (
          <div
            className={`app-header__pwa-chip app-header__pwa-chip--${pwaChip.tone}`}
          >
            <span className="app-header__pwa-label">{pwaChip.label}</span>
            <span className="app-header__pwa-detail">{pwaChip.detail}</span>
            {pwaChip.action && pwaChip.actionLabel ? (
              <button
                type="button"
                className="app-header__pwa-action"
                onClick={pwaChip.action}
              >
                {pwaChip.actionLabel}
              </button>
            ) : null}
            <button
              type="button"
              className="app-header__pwa-dismiss"
              onClick={dismissPwaChip}
              aria-label={`Dismiss ${pwaChip.label.toLowerCase()} status`}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ) : null}
        <ThemeToggle
          activeTab={activeTab}
          onChange={onTabChange}
          compact
          className="app-header__theme-toggle"
          label="Switch between Movies and Places"
        />
      </div>

      {/* Center: Brand or Search slot */}
      <div
        ref={centerRef}
        className={`app-header__center${slot?.hasSearch ? " app-header__center--search" : ""}`}
        aria-label={slot?.hasSearch ? undefined : "Electron"}
      >
        {!slot?.hasSearch && (
          <span ref={brandRef} className="app-header__brand">
            {brandLabel}
          </span>
        )}
      </div>

      {/* Right: Spin button (movies tab) + Profile Selector */}
      <div ref={rightRef} className="app-header__right">
        {activeTab === "movies" && onOpenSpin && (
          <button
            type="button"
            className="app-header__spin-trigger"
            onClick={onOpenSpin}
            aria-label="Spin the wheel to pick a movie"
            title="Spin the wheel"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="2" x2="12" y2="12" />
              <line x1="12" y1="12" x2="20" y2="16" />
            </svg>
            <span className="app-header__spin-label">Spin</span>
          </button>
        )}
        <button
          ref={triggerRef}
          type="button"
          className={`app-header__profile-trigger${currentUser ? " is-logged-in" : ""}${isProfileMenuOpen ? " is-open" : ""}`}
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          aria-expanded={isProfileMenuOpen}
          aria-haspopup="menu"
          aria-label={
            currentUser ? `Profile: ${currentUser}` : "Select profile"
          }
          disabled={isDisabled}
        >
          {currentUser ? (
            <>
              {getAvatarContent(currentUser)}
              <span className="app-header__profile-name">{currentUser}</span>
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
            </>
          ) : (
            <>
              <span className="app-header__avatar-placeholder">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="8"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M4 20c0-4 4-6 8-6s8 2 8 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="app-header__profile-name">Sign in</span>
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
            </>
          )}
        </button>

        {/* Profile Dropdown Menu */}
        {isProfileMenuOpen && (
          <div
            ref={menuRef}
            className="app-header__profile-menu"
            role="menu"
            aria-label="Profile selection"
          >
            <div className="app-header__menu-section">
              <span className="app-header__menu-label">Switch profile</span>
              <div className="app-header__profile-list" role="group">
                {users.map((profile) => {
                  const isActive = currentUser === profile;
                  const hasPin = userHasPin(profile);
                  const needsPin = userNeedsPin(profile);

                  return (
                    <button
                      key={profile}
                      type="button"
                      role="menuitem"
                      className={`app-header__profile-option${isActive ? " is-active" : ""}${hasPin ? " has-pin" : ""}`}
                      onClick={() => selectProfile(profile)}
                      disabled={isDisabled}
                      aria-label={
                        isActive
                          ? `${profile} (active) - click to log out`
                          : needsPin
                            ? `Select ${profile} (PIN required)`
                            : hasPin
                              ? `Select ${profile} (PIN protected)`
                              : `Select ${profile}`
                      }
                    >
                      <span className="app-header__option-avatar">
                        {getAvatarContent(profile)}
                      </span>
                      <span className="app-header__option-name">{profile}</span>
                      {isActive && (
                        <span className="app-header__option-badge app-header__option-badge--active">
                          Active
                        </span>
                      )}
                      {hasPin && !isActive && (
                        <svg
                          className="app-header__option-lock"
                          width="14"
                          height="14"
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
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {currentUser && (
              <div className="app-header__menu-section app-header__menu-section--actions">
                <button
                  type="button"
                  role="menuitem"
                  className="app-header__menu-action"
                  onClick={openPinSettings}
                  disabled={isDisabled || isSavingPinSettings}
                >
                  <svg
                    width="16"
                    height="16"
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
                  Log out
                </button>
              </div>
            )}

            {selectionError && (
              <p className="app-header__menu-error" role="alert">
                {selectionError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* PIN Dialogs */}
      {pendingUser && (
        <PinDialog
          isOpen={!!pendingUser}
          user={pendingUser}
          onCancel={() => {
            setPendingUser(null);
            setSelectionError(null);
          }}
          onSubmit={handlePinSubmit}
          mode="enter"
          isLoading={isVerifying}
        />
      )}

      {pinSettingsUser && (
        <PinDialog
          isOpen={!!pinSettingsUser}
          user={pinSettingsUser}
          onCancel={handlePinSettingsCancel}
          onSubmit={handlePinSettingsSubmit}
          mode={pinSettingsMode}
          isLoading={isSavingPinSettings}
          isRequiredSetup={
            pinSettingsMode === "set" &&
            (pinSettingsUser ? userNeedsPin(pinSettingsUser) : false)
          }
        />
      )}
    </header>
  );
};

export default AppHeader;
