/* eslint-disable react/prop-types */
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '../../context/UserContext';
import type { MainTab, User } from '../../types';
import GelBubbleAvatar from './GelBubbleAvatar';
import { usePins } from '../../hooks/usePins';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import PinDialog from './PinDialog';
import ThemeToggle from '../ui/ThemeToggle';
import './UserSelection.css';

type UserSelectionVariant = 'inline' | 'panel';

interface UserSelectionProps {
  onUserSelected?: (user: User | null) => void;
  activeTab?: MainTab;
  onTabChange?: (tab: MainTab) => void;
  variant?: UserSelectionVariant;
  title?: string;
  subtitle?: string;
  className?: string;
}

const UserSelection: React.FC<UserSelectionProps> = ({
  onUserSelected,
  activeTab = 'queue',
  onTabChange,
  variant = 'inline',
  title = "Who's watching?",
  subtitle = 'Choose a profile to personalize your feed.',
  className,
}) => {
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, verifyUserPin, setUserPin, removeUserPin, isLoading } = usePins();
  const [hoveredAvatar, setHoveredAvatar] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pinSettingsUser, setPinSettingsUser] = useState<User | null>(null);
  const [isSavingPinSettings, setIsSavingPinSettings] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectionAnimatedUser, setSelectionAnimatedUser] = useState<User | null>(null);
  const [isSelectionAnimating, setIsSelectionAnimating] = useState(false);
  const previousUserRef = useRef<User | null>(currentUser);
  const isMobile = useMediaQuery(breakpoints.sm);
  const bubbleSize = variant === 'inline' ? 'tiny' : isMobile ? 'compact' : 'default';
  const isDisabled = isLoading || isVerifying;
  const users: User[] = ['Aaron', 'Electra'];
  const floatingInlinePositions = useMemo(
    () => [
      { x: '18vw', y: '28vh', driftX: '10vw', driftY: '-9vh', duration: '12.4s', delay: '0s' },
      { x: '70vw', y: '58vh', driftX: '-11vw', driftY: '8vh', duration: '14.2s', delay: '0.7s' },
    ],
    []
  );
  const selectedNamedUser = currentUser;
  const pinSettingsMode = selectedNamedUser && userHasPin(selectedNamedUser) ? 'change' : 'set';

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
          </>
        )}

        <div className="user-selection__bubble-row" role="group" aria-label="Select profile">
          {users.map((profile, index) => {
            const isActive = currentUser === profile;
            const isHovered = hoveredAvatar === profile || isActive;
            const selectionState =
              !currentUser || !isSelectionAnimating || !selectionAnimatedUser
                ? 'neutral'
                : profile === selectionAnimatedUser
                  ? 'active'
                  : 'inactive';
            const floatingPosition = floatingInlinePositions[index] ?? floatingInlinePositions[0];

            return (
              <div
                key={profile}
                className={`user-selection__bubble-slot${variant === 'inline' ? ' user-selection__bubble-slot--floating' : ''}`}
                style={
                  variant === 'inline'
                    ? ({
                        ['--float-x' as string]: floatingPosition.x,
                        ['--float-y' as string]: floatingPosition.y,
                        ['--float-drift-x' as string]: floatingPosition.driftX,
                        ['--float-drift-y' as string]: floatingPosition.driftY,
                      ['--float-duration' as string]: floatingPosition.duration,
                      ['--float-delay' as string]: floatingPosition.delay,
                      } as CSSProperties)
                    : undefined
                }
              >
                <GelBubbleAvatar
                  user={profile}
                  hasPin={userHasPin(profile)}
                  isHovered={isHovered}
                  isSmall={variant === 'panel' && currentUser !== null && currentUser !== profile}
                  selectionState={selectionState}
                  isSelectionAnimating={isSelectionAnimating}
                  size={bubbleSize}
                  disabled={isDisabled}
                  onClick={() => selectProfile(profile)}
                  onMouseEnter={() => setHoveredAvatar(profile)}
                  onMouseLeave={() => setHoveredAvatar(null)}
                  onFocus={() => setHoveredAvatar(profile)}
                  onBlur={() => setHoveredAvatar(null)}
                  animationOffset={index % 2 === 1}
                />
              </div>
            );
          })}
        </div>

        {selectedNamedUser ? (
          <button
            type="button"
            className="user-selection__pin-button user-selection__logout-button"
            onClick={handleLogout}
            disabled={isDisabled}
            aria-label="Log out"
          >
            Log out
          </button>
        ) : (
          <p className="user-selection__logged-out">Logged out</p>
        )}

        {selectedNamedUser && (
          <button
            type="button"
            className="user-selection__pin-button"
            onClick={openPinSettings}
            disabled={isDisabled || isSavingPinSettings}
            aria-label={userHasPin(selectedNamedUser) ? 'Change profile PIN' : 'Set profile PIN'}
          >
            {userHasPin(selectedNamedUser) ? 'Change PIN' : 'Set PIN'}
          </button>
        )}
      </div>

      <PinDialog
        isOpen={!!pendingUser}
        user={pendingUser || 'Aaron'}
        onCancel={() => setPendingUser(null)}
        onSubmit={handlePinSubmit}
        mode="enter"
        isLoading={isVerifying}
      />

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

