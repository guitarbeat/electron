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

interface UserSelectionProps {
  onUserSelected?: (user: User | null) => void;
  activeTab?: MainTab;
  onTabChange?: (tab: MainTab) => void;
}

const UserSelection: React.FC<UserSelectionProps> = ({
  onUserSelected,
  activeTab = 'queue',
  onTabChange,
}) => {
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, verifyUserPin, isLoading } = usePins();
  const [hoveredAvatar, setHoveredAvatar] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const isMobile = useMediaQuery(breakpoints.sm);
  const bubbleSize = isMobile ? 'compact' : 'default';
  const isDisabled = isLoading || isVerifying;
  const users: User[] = ['Aaron', 'Electra'];

  const handleUserClick = (user: User) => {
    if (isDisabled) return;

    if (user === currentUser) {
      setCurrentUser(null);
      onUserSelected?.(null);
      return;
    }

    if (userHasPin(user)) {
      setPendingUser(user);
    } else {
      setCurrentUser(user);
      onUserSelected?.(user);
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

  return (
    <div className={`user-selection${isMobile ? ' is-mobile' : ''}`}>
      {/* Theme Toggle Section (optional label handled by parent sheet title) */}
      {onTabChange && (
        <div className="user-selection__theme-toggle">
          <ThemeToggle activeTab={activeTab} onChange={onTabChange} isMobile={isMobile} />
        </div>
      )}

      {/* Profile Selection Section */}
      <div className="user-selection__profiles">
        <h3 className="user-selection__title">Who&apos;s watching?</h3>
        <p className="user-selection__subtitle">Choose a profile to personalize your feed.</p>

        <div className="user-selection__bubble-row">
          {users.map((user, index) => (
            <div key={user} className="user-selection__bubble-slot">
              <GelBubbleAvatar
                user={user}
                hasPin={userHasPin(user)}
                isHovered={hoveredAvatar === user || currentUser === user}
                isSmall={currentUser !== null && currentUser !== user}
                size={bubbleSize}
                disabled={isDisabled}
                onClick={() => handleUserClick(user)}
                onMouseEnter={() => setHoveredAvatar(user)}
                onMouseLeave={() => setHoveredAvatar(null)}
                onFocus={() => setHoveredAvatar(user)}
                onBlur={() => setHoveredAvatar(null)}
                animationOffset={index === 1}
              />
            </div>
          ))}
        </div>
      </div>

      <PinDialog
        isOpen={!!pendingUser}
        user={pendingUser || 'Aaron'}
        onCancel={() => setPendingUser(null)}
        onSubmit={handlePinSubmit}
        mode="enter"
        isLoading={isVerifying}
      />
    </div>
  );
};

export default UserSelection;
