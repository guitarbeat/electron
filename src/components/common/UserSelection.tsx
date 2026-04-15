import { useEffect, useRef, useState } from 'react';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { useUser } from '@/app/useProviders';
import { USER_PHOTOS, type User } from '@/shared/types';
import { usePins } from '@/hooks/usePins';
import { getErrorMessage, USER_OPTIONS, consoleError } from '@/utils';
import PinDialog from './PinDialog';
import GelBubbleAvatar from './GelBubbleAvatar';
import { QuickActionsIcon } from './icons';

type UserSelectionVariant = 'inline' | 'panel' | 'shell';

interface UserSelectionProps {
  onUserSelected?: (user: User | null) => void;
  onActionsClick?: () => void;
  variant?: UserSelectionVariant;
  title?: string;
  className?: string;
}

const ShellProfileAvatar: React.FC<{ user: User }> = ({ user }) => {
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <span className="user-selection__shell-avatar-inner">
      {hasImageError || !USER_PHOTOS[user] ? (
        <span className="user-selection__shell-chip-avatar-initial">{user.charAt(0)}</span>
      ) : (
        <img
          src={USER_PHOTOS[user]}
          alt=""
          className="user-selection__shell-chip-avatar-image"
          onError={() => setHasImageError(true)}
          draggable="false"
        />
      )}
      <span className="user-selection__shell-avatar-name" aria-hidden="true">{user}</span>
    </span>
  );
};

const UserSelection: React.FC<UserSelectionProps> = ({
  onUserSelected,
  onActionsClick,
  variant = 'inline',
  title = 'Choose a profile',
  className,
}) => {
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, userNeedsPin, verifyUserPin, setUserPin, isLoading } = usePins();
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pinSettingsUser, setPinSettingsUser] = useState<User | null>(null);
  const [isSavingPinSettings, setIsSavingPinSettings] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectionAnimatedUser, setSelectionAnimatedUser] = useState<User | null>(null);
  const [isSelectionAnimating, setIsSelectionAnimating] = useState(false);
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [focusedUser, setFocusedUser] = useState<User | null>(null);
  const [isActionsHovered, setIsActionsHovered] = useState(false);
  const [isActionsFocused, setIsActionsFocused] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const previousUserRef = useRef<User | null>(currentUser);
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const isDisabled = isLoading || isVerifying;
  const users: User[] = [...USER_OPTIONS];
  const selectedNamedUser = currentUser;
  const pinSettingsMode = selectedNamedUser && userHasPin(selectedNamedUser) ? 'change' : 'set';
  const selectedUserNeedsPin = selectedNamedUser ? userNeedsPin(selectedNamedUser) : false;
  const isPanel = variant === 'panel';
  const isShell = variant === 'shell';
  const showBubbleName = true;
  const panelStatusTitle = selectedNamedUser ?? 'Guest mode';

  const renderAccountActions = (shellMode = false) => {
    if (!selectedNamedUser) {
      return null;
    }

    return (
      <div className={`user-selection__account-actions${shellMode ? ' user-selection__account-actions--shell' : ''}`}>
        <button
          type="button"
          className="user-selection__pin-button"
          onClick={openPinSettings}
          disabled={isDisabled || isSavingPinSettings}
          aria-label={
            selectedUserNeedsPin
              ? 'Finish required profile PIN setup'
              : userHasPin(selectedNamedUser)
                ? 'Change profile PIN'
                : 'Set profile PIN'
          }
        >
          {selectedUserNeedsPin
            ? 'Finish PIN Setup'
            : userHasPin(selectedNamedUser)
              ? 'Change PIN'
              : 'Set PIN'}
        </button>
        <button
          type="button"
          className="user-selection__pin-button user-selection__logout-button"
          onClick={handleLogout}
          disabled={isDisabled}
          aria-label="Log out"
        >
          Log out
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (!currentUser || previousUserRef.current === currentUser) {
      previousUserRef.current = currentUser;
      return;
    }

    setSelectionAnimatedUser(currentUser);
    setIsSelectionAnimating(true);
    const timer = window.setTimeout(() => {
      setIsSelectionAnimating(false);
    }, 560);

    previousUserRef.current = currentUser;
    return () => window.clearTimeout(timer);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setPinSettingsUser(null);
      return;
    }

    if (!userNeedsPin(currentUser)) {
      return;
    }

    setSelectionError(null);
    setPinSettingsUser((existing) => (existing === currentUser ? existing : currentUser));
  }, [currentUser, userNeedsPin]);

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
            onUserSelected?.(profile);
            if (userNeedsPin(profile)) {
              setPinSettingsUser(profile);
            }
          }
        } catch (error) {
          consoleError('Profile selection failed:', error);
          setSelectionError(getErrorMessage(error, 'Profile login is unavailable right now.'));
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
          onUserSelected?.(null);
        }
      } catch (error) {
        consoleError('Profile logout failed:', error);
        setSelectionError(getErrorMessage(error, 'Unable to update the profile session.'));
      }
    })();
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (!pendingUser) return false;
    setIsVerifying(true);
    try {
      const didSet = await setCurrentUser(pendingUser, pin);
      if (didSet) {
        onUserSelected?.(pendingUser);
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
    const requiredSetupUser = pinSettingsUser && userNeedsPin(pinSettingsUser) ? pinSettingsUser : null;
    setPinSettingsUser(null);
    setSelectionError(null);

    if (requiredSetupUser) {
      handleLogout();
    }
  };

  const handlePinSettingsSubmit = async (pin: string, newPin?: string): Promise<boolean> => {
    if (!pinSettingsUser) return false;

    setIsSavingPinSettings(true);
    try {
      if (pinSettingsMode === 'set') {
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

  return (
    <div
      className={`user-selection user-selection--${variant}${isMobile ? ' is-mobile' : ''}${className ? ` ${className}` : ''}`}
    >
      {isShell ? (
        <div className="user-selection__shell-layout">
          <div
            className="user-selection__shell-profile-list"
            role="group"
            aria-label="Select profile"
          >
            {users.map((profile) => {
              const isActive = currentUser === profile;
              const hasPin = userHasPin(profile);
              const needsPin = userNeedsPin(profile);

              return (
                <button
                  key={profile}
                  type="button"
                  className={`user-selection__shell-avatar-btn${isActive ? ' is-active' : ''}${needsPin ? ' is-pin-required' : ''}${hasPin ? ' is-pin-locked' : ''}`}
                  onClick={() => {
                    if (!isActive) {
                      selectProfile(profile);
                    }
                  }}
                  disabled={isDisabled}
                  aria-label={
                    isActive
                      ? `${profile} active`
                      : needsPin
                        ? `Select ${profile} (PIN required)`
                        : hasPin
                          ? `Select ${profile} (PIN protected)`
                          : `Select ${profile}`
                  }
                  aria-pressed={isActive}
                >
                  <ShellProfileAvatar user={profile} />
                </button>
              );
            })}
          </div>

          {renderAccountActions(true)}
        </div>
      ) : (
        <div className="user-selection__profiles">
          {isPanel && (
            <>
              <h3 className="user-selection__title">{title}</h3>
            </>
          )}

          <div
            className={`user-selection__bubble-cluster user-selection__bubble-cluster--${variant}`}
          >
            {isPanel ? (
              <div className="user-selection__bubble-cluster-header" role="status" aria-live="polite">
                <span className="user-selection__panel-status-pill">{panelStatusTitle}</span>
              </div>
            ) : null}
            <div
              className={`user-selection__bubble-row user-selection__bubble-row--${variant}`}
              role="group"
              aria-label="Select profile"
            >
              {users.map((profile) => {
                const isActive = currentUser === profile;
                const selectionState =
                  !currentUser || !isSelectionAnimating || !selectionAnimatedUser
                    ? 'neutral'
                    : profile === selectionAnimatedUser
                      ? 'active'
                      : 'inactive';
                const isHovered = hoveredUser === profile || focusedUser === profile || isActive;
                const hasPin = userHasPin(profile);
                const needsPin = userNeedsPin(profile);
                const bubbleSize =
                  isPanel
                    ? (isMobile ? 'compact' : 'default')
                    : 'tiny';
                const profileCardVariantClass = isPanel ? ' user-selection__profile-card--panel' : '';

                return (
                  <div
                    key={profile}
                    className={`user-selection__profile-card${profileCardVariantClass}${isActive ? ' is-active' : ''}${selectionState !== 'neutral' ? ` is-${selectionState}` : ''}`}
                  >
                    <GelBubbleAvatar
                      user={profile}
                      hasPin={hasPin}
                      isHovered={isHovered}
                      showName={showBubbleName}
                      selectionState={selectionState}
                      isSelectionAnimating={isSelectionAnimating}
                      size={bubbleSize}
                      enableImageRefresh
                      onClick={() => {
                        selectProfile(profile);
                      }}
                      onMouseEnter={() => setHoveredUser(profile)}
                      onMouseLeave={
                        () => setHoveredUser((value) => (value === profile ? null : value))
                      }
                      onFocus={() => setFocusedUser(profile)}
                      onBlur={() => setFocusedUser((value) => (value === profile ? null : value))}
                      disabled={isDisabled}
                      animationOffset={profile === 'Electra'}
                      aria-label={
                        isActive
                          ? 'Log out'
                          : needsPin
                            ? `Select ${profile} (PIN required)`
                            : hasPin
                              ? `Select ${profile} (PIN protected)`
                              : undefined
                      }
                      aria-pressed={isActive}
                      disablePhotoHoverPreview={false}
                    />

                    {((isPanel || isShell) && (isActive || hasPin || needsPin)) ? (
                      <div className="user-selection__profile-caption">
                        <div className="user-selection__profile-meta">
                          {isActive ? (
                            <span className="user-selection__meta-pill user-selection__meta-pill--active">
                              Active
                            </span>
                          ) : null}
                          {needsPin ? (
                            <span className="user-selection__meta-pill user-selection__meta-pill--pin-required">
                              PIN Required
                            </span>
                          ) : null}
                          {hasPin ? (
                            <span className="user-selection__meta-pill user-selection__meta-pill--pin" aria-hidden="true">
                              PIN Locked
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {variant === 'inline' && onActionsClick && (
                <div className="user-selection__profile-card user-selection__profile-card--actions">
                  <GelBubbleAvatar
                    icon={<QuickActionsIcon />}
                    label="Actions"
                    isHovered={isActionsHovered || isActionsFocused}
                    showName={showBubbleName}
                    size="tiny"
                    onClick={onActionsClick}
                    onMouseEnter={() => setIsActionsHovered(true)}
                    onMouseLeave={() => setIsActionsHovered(false)}
                    onFocus={() => setIsActionsFocused(true)}
                    onBlur={() => setIsActionsFocused(false)}
                    disabled={isDisabled}
                    accentColor="var(--color-accent)"
                    haloColor="var(--color-secondary)"
                  />
                </div>
              )}
            </div>
          </div>

          {isPanel ? renderAccountActions() : null}
        </div>
      )}

      {selectionError ? (
        <p className="user-selection__error" role="alert">
          {selectionError}
        </p>
      ) : null}

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
          isRequiredSetup={pinSettingsMode === 'set' && (pinSettingsUser ? userNeedsPin(pinSettingsUser) : false)}
        />
      )}
    </div>
  );
};

export default UserSelection;
