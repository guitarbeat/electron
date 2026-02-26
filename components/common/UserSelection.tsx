import React, { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { User } from '../../types';
import GelBubbleAvatar from './GelBubbleAvatar';
import { usePins } from '../../hooks/usePins';
import { spacing, typography, colors, radius, shadows } from '../../design-system/tokens';
import PinDialog from './PinDialog';
import Button from '../ui/Button';

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

  // Logged-in: compact bar with "Signed in as [Name]" and Switch user
  if (currentUser) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: `${spacing.sm} 0`,
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.md,
            flexWrap: 'wrap',
            padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: radius.full,
            background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.15) 0%, rgba(147, 112, 219, 0.12) 100%)',
            border: `1px solid ${colors.accent}40`,
            boxShadow: `${shadows.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
            minHeight: 52,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: colors.gradientPink,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#1a1a2e',
                boxShadow: shadows.glow,
              }}
              aria-hidden
            >
              {currentUser.charAt(0)}
            </span>
            <span
              style={{
                fontFamily: typography.fontFamily.heading.join(', '),
                fontSize: typography.fontSize.base,
                fontWeight: 600,
                color: colors.textPrimary,
                textTransform: 'uppercase',
                letterSpacing: typography.letterSpacing.wide,
              }}
            >
              Signed in as <strong>{currentUser}</strong>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentUser(null)}
            style={{
              border: `1px solid ${colors.borderSecondary}50`,
              borderRadius: radius.full,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: typography.fontSize.xs,
            }}
          >
            Switch user
          </Button>
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
  }

  // Not logged in: show both avatars
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
