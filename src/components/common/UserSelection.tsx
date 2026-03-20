import { useEffect, useRef, useState } from 'react';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { useUser } from '../../context';
import type { MainTab, User } from '../../types';
import { usePins } from '../../hooks/usePins';
import { USER_OPTIONS } from '@/utils';
import PinDialog from './PinDialog';
import ThemeToggle from '../ui/ThemeToggle';
import GelBubbleAvatar from './GelBubbleAvatar';
import { QuickActionsIcon } from './icons';

type UserSelectionVariant = 'inline' | 'panel';

interface UserSelectionProps {
  onUserSelected?: (user: User | null) => void;
  onActionsClick?: () => void;
  activeTab?: MainTab;
  onTabChange?: (tab: MainTab) => void;
  variant?: UserSelectionVariant;
  title?: string;
  subtitle?: string;
  className?: string;
}

const PROFILE_NOTES: Record<User, string> = {
  Aaron: 'Neon thrillers, fast picks, and impulsive rewatches.',
  Electra: 'Soft-focus chaos, sharp instincts, and midnight romance.',
};

const PROFILE_TAGS: Record<User, string> = {
  Aaron: 'Action Lead',
  Electra: 'Vibe Pilot',
};

const UserSelection: React.FC<UserSelectionProps> = ({
  onUserSelected,
  onActionsClick,
  activeTab = 'queue',
  onTabChange,
  variant = 'inline',
  title = "Who's watching?",
  subtitle = 'Choose a profile to personalize your feed.',
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
  const previousUserRef = useRef<User | null>(currentUser);
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const isDisabled = isLoading || isVerifying;
  const users: User[] = [...USER_OPTIONS];
  const selectedNamedUser = currentUser;
  const pinSettingsMode = selectedNamedUser && userHasPin(selectedNamedUser) ? 'change' : 'set';
  const showBubbleName = variant !== 'inline';
  const panelStatusTitle = selectedNamedUser ? 'Seat active' : 'Guest mode';
  const panelStatusCopy = selectedNamedUser
    ? `${selectedNamedUser} is driving the board right now. Swap seats, manage the PIN, or log out below.`
    : 'Pick a profile to personalize the watchlist, unlock saved preferences, and start the shared games.';

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

    if (userHasPin(profile)) {
      setPendingUser(profile);
    } else {
      setCurrentUser(profile);
      onUserSelected?.(profile);
    }
  };

  const handleLogout = () => {
    if (isDisabled) return;
    setCurrentUser(null);
    onUserSelected?.(null);
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (!pendingUser) return false;
    setIsVerifying(true);
    try {
      const isValid = await verifyUserPin(pendingUser, pin);
      if (isValid) {
        setCurrentUser(pendingUser);
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
      {/* Theme Toggle Section (optional label handled by parent sheet title) */}
      {onTabChange && variant === 'panel' && (
        <div className="user-selection__theme-toggle">
          <ThemeToggle activeTab={activeTab} onChange={onTabChange} isMobile={isMobile} />
        </div>
      )}

      <div className="user-selection__profiles">
        {variant === 'panel' && (
          <>
            <h3 className="user-selection__title">{title}</h3>
            <p className="user-selection__subtitle">{subtitle}</p>
            <div className="user-selection__panel-status" role="status" aria-live="polite">
              <span className="user-selection__panel-status-pill">{panelStatusTitle}</span>
              <p className="user-selection__panel-status-copy">{panelStatusCopy}</p>
            </div>
          </>
        )}

        <div
          className={`user-selection__bubble-cluster user-selection__bubble-cluster--${variant}`}
        >
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

                  {variant === 'panel' ? (
                    <div className="user-selection__profile-caption">
                      <div className="user-selection__profile-meta">
                        <span className="user-selection__meta-pill user-selection__meta-pill--persona">
                          {PROFILE_TAGS[profile]}
                        </span>
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
                      <p className="user-selection__profile-note">
                        {isActive
                          ? `${profile} is steering the plan right now.`
                          : PROFILE_NOTES[profile]}
                      </p>
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
              <p className="user-selection__logged-out">
                Logged out. Pick a bubble to hop back in.
              </p>
            )}
          </div>
        )}
      </div>

      {pendingUser && (
        <PinDialog
          isOpen={!!pendingUser}
          user={pendingUser}
          onCancel={() => setPendingUser(null)}
          onSubmit={handlePinSubmit}
          mode="enter"
          isLoading={isVerifying}
        />
      )}

      {pinSettingsUser && (
        <PinDialog
          isOpen={!!pinSettingsUser}
          user={pinSettingsUser}
          onCancel={() => setPinSettingsUser(null)}
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
