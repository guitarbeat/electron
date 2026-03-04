/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useUser } from '../../context/UserContext';
import type { User } from '../../types';
import GelBubbleAvatar from './GelBubbleAvatar';
import { usePins } from '../../hooks/usePins';
import { spacing } from '../../design-system/tokens';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import PinDialog from './PinDialog';
import ThemeToggle from '../ui/ThemeToggle';
import { MainTab } from '../../types';

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
  const { userHasPin, verifyUserPin, refresh, isLoading } = usePins();
  const [hoveredAvatar, setHoveredAvatar] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const isMobile = useMediaQuery(breakpoints.sm);
  const bubbleSize = isMobile ? 'compact' : 'default';

  const handleUserClick = (user: User) => {
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: isMobile ? `${spacing.sm} 0` : `${spacing.lg} 0`,
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        gap: spacing.xl,
      }}
    >
      {/* Theme Toggle Section (optional label handled by parent sheet title) */}
      {onTabChange && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <ThemeToggle activeTab={activeTab} onChange={onTabChange} isMobile={isMobile} />
        </div>
      )}

      {/* Profile Selection Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.md,
          width: '100%',
        }}
      >
        <h3
          style={{
            margin: 0,
            color: '#fff',
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: 600,
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            fontFamily: "'Papyrus', 'Comic Sans MS', cursive, sans-serif",
          }}
        >
          Who's watching?
        </h3>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'clamp(16px, 4vw, 40px)',
            width: '100%',
            flexWrap: 'nowrap',
            padding: `0 ${spacing.md}`,
            position: 'relative',
          }}
        >
          <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'center', minWidth: 0 }}>
            <GelBubbleAvatar
              user="Aaron"
              hasPin={userHasPin('Aaron')}
              isHovered={hoveredAvatar === 'Aaron' || currentUser === 'Aaron'}
              isSmall={currentUser !== null && currentUser !== 'Aaron'}
              size={bubbleSize}
              onClick={() => handleUserClick('Aaron')}
              onMouseEnter={() => setHoveredAvatar('Aaron')}
              onMouseLeave={() => setHoveredAvatar(null)}
              onFocus={() => setHoveredAvatar('Aaron')}
              onBlur={() => setHoveredAvatar(null)}
            />
          </div>

          <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'center', minWidth: 0 }}>
            <GelBubbleAvatar
              user="Electra"
              hasPin={userHasPin('Electra')}
              isHovered={hoveredAvatar === 'Electra' || currentUser === 'Electra'}
              isSmall={currentUser !== null && currentUser !== 'Electra'}
              size={bubbleSize}
              onClick={() => handleUserClick('Electra')}
              onMouseEnter={() => setHoveredAvatar('Electra')}
              onMouseLeave={() => setHoveredAvatar(null)}
              onFocus={() => setHoveredAvatar('Electra')}
              onBlur={() => setHoveredAvatar(null)}
              animationOffset
            />
          </div>
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
