import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { User } from '../types';
import GelBubbleAvatar from './GelBubbleAvatar';
import { usePins } from '../hooks/usePins';
import { spacing, typography, colors } from '../design-system/tokens';
import PinDialog from './PinDialog';

interface UserSelectionProps {
  onTakeQuiz: () => void;
}

const UserSelection: React.FC<UserSelectionProps> = ({ onTakeQuiz }) => {
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, verifyUserPin } = usePins();
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
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
        padding: `${spacing.xl} 0`,
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(20px, 8vw, 60px)',
          width: '100%',
          flexWrap: 'wrap',
        }}
      >
        {(['Aaron', 'Electra'] as User[]).map((user, index) => (
          <GelBubbleAvatar
            key={user}
            user={user}
            hasPin={userHasPin(user)}
            isHovered={hoveredUser === user || currentUser === user}
            onClick={() => handleUserClick(user)}
            onMouseEnter={() => setHoveredUser(user)}
            onMouseLeave={() => setHoveredUser(null)}
            onFocus={() => setHoveredUser(user)}
            onBlur={() => setHoveredUser(null)}
            animationOffset={index % 2 === 1}
          />
        ))}
      </div>

      <PinDialog
        isOpen={!!pendingUser}
        user={pendingUser || 'Aaron'}
        onCancel={() => setPendingUser(null)}
        onSubmit={handlePinSubmit}
        mode="verify"
        isLoading={isVerifying}
      />
    </div>
  );
};

export default UserSelection;
