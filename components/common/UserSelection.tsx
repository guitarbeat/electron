import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { User } from '../../types';
import GelBubbleAvatar from './GelBubbleAvatar';
import { usePins } from '../../hooks/usePins';
import { spacing } from '../../design-system/tokens';
import PinDialog from './PinDialog';

const UserSelection: React.FC = () => {
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, verifyUserPin } = usePins();
  const [hoveredAvatar, setHoveredAvatar] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleUserClick = (user: User) => {
    if (user === currentUser) {
      setCurrentUser(null);
      return;
    }

    if (userHasPin(user)) {
      setPendingUser(user);
    } else {
      setCurrentUser(user);
    }
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (!pendingUser) return false;
    setIsVerifying(true);
    try {
      const isValid = await verifyUserPin(pendingUser, pin);
      if (isValid) {
        setCurrentUser(pendingUser);
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
        padding: `${spacing.lg} 0`,
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
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
            onClick={() => handleUserClick('Electra')}
            onMouseEnter={() => setHoveredAvatar('Electra')}
            onMouseLeave={() => setHoveredAvatar(null)}
            onFocus={() => setHoveredAvatar('Electra')}
            onBlur={() => setHoveredAvatar(null)}
            animationOffset
          />
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
