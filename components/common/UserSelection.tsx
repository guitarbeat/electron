/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useUser } from '../../context/UserContext';
import type { MainTab, User } from '../../types';
import GelBubbleAvatar from './GelBubbleAvatar';
import { usePins } from '../../hooks/usePins';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import PinDialog from './PinDialog';
import ThemeToggle from '../ui/ThemeToggle';
import './UserSelection.css';

type ProfileValue = User | 'Guest';
type UserSelectionVariant = 'inline' | 'panel';

interface UserSelectionProps {
  onUserSelected?: (user: User | null) => void;
  activeTab?: MainTab;
  onTabChange?: (tab: MainTab) => void;
  variant?: UserSelectionVariant;
  includeGuest?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

const UserSelection: React.FC<UserSelectionProps> = ({
  onUserSelected,
  activeTab = 'queue',
  onTabChange,
  variant = 'inline',
  includeGuest = true,
  title = "Who's watching?",
  subtitle = 'Choose a profile to personalize your feed.',
  className,
}) => {
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, verifyUserPin, setUserPin, removeUserPin, isLoading } = usePins();
  const [hoveredAvatar, setHoveredAvatar] = useState<ProfileValue | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pinSettingsUser, setPinSettingsUser] = useState<User | null>(null);
  const [isSavingPinSettings, setIsSavingPinSettings] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const isMobile = useMediaQuery(breakpoints.sm);
  const bubbleSize = variant === 'inline' ? 'tiny' : isMobile ? 'compact' : 'default';
  const isDisabled = isLoading || isVerifying;
  const users: User[] = ['Aaron', 'Electra'];
  const profiles: ProfileValue[] = includeGuest ? ['Guest', ...users] : users;
  const selectedProfile: ProfileValue = currentUser ?? 'Guest';
  const selectedNamedUser = selectedProfile === 'Guest' ? null : selectedProfile;
  const pinSettingsMode = selectedNamedUser && userHasPin(selectedNamedUser) ? 'change' : 'set';

  const selectProfile = (profile: ProfileValue) => {
    if (isDisabled) return;
    if (profile === selectedProfile) return;

    if (profile === 'Guest') {
      setCurrentUser(null);
      onUserSelected?.(null);
      return;
    }

    if (userHasPin(profile)) {
      setPendingUser(profile);
    } else {
      setCurrentUser(profile);
      onUserSelected?.(profile);
    }
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
          {profiles.map((profile, index) => {
            const isActive = selectedProfile === profile;
            const isHovered = hoveredAvatar === profile || isActive;

            if (profile === 'Guest') {
              return (
                <button
                  key={profile}
                  type="button"
                  className={`user-selection__guest-bubble${isActive ? ' is-active' : ''}${isHovered ? ' is-hovered' : ''}${variant === 'inline' ? ' is-inline' : ''}`}
                  onClick={() => selectProfile('Guest')}
                  onMouseEnter={() => setHoveredAvatar('Guest')}
                  onMouseLeave={() => setHoveredAvatar(null)}
                  onFocus={() => setHoveredAvatar('Guest')}
                  onBlur={() => setHoveredAvatar(null)}
                  disabled={isDisabled}
                  aria-pressed={isActive}
                  aria-label="Select Guest profile"
                >
                  <span className="user-selection__guest-emoji" aria-hidden>
                    {'\u{1F465}'}
                  </span>
                  <span className="user-selection__guest-label">Guest</span>
                </button>
              );
            }

            return (
              <div key={profile} className="user-selection__bubble-slot">
                <GelBubbleAvatar
                  user={profile}
                  hasPin={userHasPin(profile)}
                  isHovered={isHovered}
                  isSmall={
                    variant === 'panel' && selectedProfile !== 'Guest' && selectedProfile !== profile
                  }
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

