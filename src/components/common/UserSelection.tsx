import { useEffect, useRef, useState } from 'react';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { useUser } from '@/app/providers';
import type { User } from '@/shared/types';
import { usePins } from '@/hooks/usePins';
import { getErrorMessage, USER_OPTIONS } from '@/utils';
import PinDialog from './PinDialog';
import GelBubbleAvatar from './GelBubbleAvatar';
import { QuickActionsIcon } from './icons';

type UserSelectionVariant = 'inline' | 'panel';

interface UserSelectionProps {
  onUserSelected?: (user: User | null) => void;
  onActionsClick?: () => void;
  variant?: UserSelectionVariant;
  title?: string;
  className?: string;
}

const UserSelection: React.FC<UserSelectionProps> = ({
  onUserSelected,
  onActionsClick,
  variant = 'inline',
  title = 'Choose a profile',
  className,
}) => {
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, verifyUserPin, setUserPin, removeUserPin, isLoading } = usePins();
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
  const showBubbleName = variant !== 'inline';
  const panelStatusTitle = selectedNamedUser ?? 'Guest mode';

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

  const selectProfile = (profile: User) => {
    if (isDisabled) return;
    if (profile === currentUser) return;

    setSelectionError(null);

    if (userHasPin(profile)) {
      setPendingUser(profile);
    } else {
      void (async () => {
        try {
          const didSet = await setCurrentUser(profile);
          if (didSet) {
            onUserSelected?.(profile);
          }
        } catch (error) {
          console.error('Profile selection failed:', error);
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
        console.error('Profile logout failed:', error);
        setSelectionError(getErrorMessage(error, 'Unable to update the profile session.'));
      }
    })();
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (!pendingUser) return false;
    setIsVerifying(true);
    try {
      const isValid = await verifyUserPin(pendingUser, pin);
      if (isValid) {
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

  const handleRemovePin = async () => {
    if (!pinSettingsUser) return;

    setIsSavingPinSettings(true);
    try {
      const removed = await removeUserPin(pinSettingsUser);
      if (removed) setPinSettingsUser(null);
    } finally {
      setIsSavingPinSettings(false);
    }
  };

  return (
    <div
      className={`user-selection user-selection--${variant}${isMobile ? ' is-mobile' : ''}${className ? ` ${className}` : ''}`}
    >
      <div className="user-selection__profiles">
        {variant === 'panel' && (
          <>
            <h3 className="user-selection__title">{title}</h3>
          </>
        )}

        <div
          className={`user-selection__bubble-cluster user-selection__bubble-cluster--${variant}`}
        >
          {variant === 'panel' ? (
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

              return (
                <div
                  key={profile}
                  className={`user-selection__profile-card${variant === 'panel' ? ' user-selection__profile-card--panel' : ''}${isActive ? ' is-active' : ''}${selectionState !== 'neutral' ? ` is-${selectionState}` : ''}`}
                >
                  <GelBubbleAvatar
                    user={profile}
                    hasPin={hasPin}
                    isHovered={isHovered}
                    showName={showBubbleName}
                    selectionState={selectionState}
                    isSelectionAnimating={isSelectionAnimating}
                    size={variant === 'panel' ? (isMobile ? 'compact' : 'default') : 'tiny'}
                    onClick={() => selectProfile(profile)}
                    onMouseEnter={() => setHoveredUser(profile)}
                    onMouseLeave={() =>
                      setHoveredUser((value) => (value === profile ? null : value))
                    }
                    onFocus={() => setFocusedUser(profile)}
                    onBlur={() => setFocusedUser((value) => (value === profile ? null : value))}
                    disabled={isDisabled}
                    animationOffset={profile === 'Electra'}
                    aria-pressed={isActive}
                  />

                  {variant === 'panel' && (isActive || hasPin) ? (
                    <div className="user-selection__profile-caption">
                      <div className="user-selection__profile-meta">
                        {isActive ? (
                          <span className="user-selection__meta-pill user-selection__meta-pill--active">
                            Active
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

        {variant === 'panel' && (
          <div className="user-selection__account-actions">
            {selectedNamedUser ? (
              <>
                <button
                  type="button"
                  className="user-selection__pin-button"
                  onClick={openPinSettings}
                  disabled={isDisabled || isSavingPinSettings}
                  aria-label={
                    userHasPin(selectedNamedUser) ? 'Change profile PIN' : 'Set profile PIN'
                  }
                >
                  {userHasPin(selectedNamedUser) ? 'Change PIN' : 'Set PIN'}
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
              </>
            ) : (
              null
            )}
          </div>
        )}

        {selectionError ? (
          <p className="user-selection__error" role="alert">
            {selectionError}
          </p>
        ) : null}
      </div>

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
          onCancel={() => {
            setPinSettingsUser(null);
            setSelectionError(null);
          }}
          onSubmit={handlePinSettingsSubmit}
          onRemove={pinSettingsMode === 'change' ? handleRemovePin : undefined}
          mode={pinSettingsMode}
          isLoading={isSavingPinSettings}
        />
      )}
    </div>
  );
};

export default UserSelection;
