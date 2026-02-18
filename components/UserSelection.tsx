import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { User } from '../types';
import GelBubbleAvatar from './GelBubbleAvatar';
import GuestBubbleAvatar from './GuestBubbleAvatar';
import { usePins } from '../hooks/usePins';
import { spacing, typography, colors } from '../design-system/tokens';
import PinDialog from './PinDialog';
import Input from './ui/Input';
import Button from './ui/Button';
import {
  useGuestProfile,
  MAX_GUEST_NAME_LENGTH,
  normalizeGuestName,
  isReservedProfileName,
} from '../hooks/useGuestProfile';

interface UserSelectionProps {
  onTakeQuiz: () => void;
}

const UserSelection: React.FC<UserSelectionProps> = ({ onTakeQuiz }) => {
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, verifyUserPin } = usePins();
  const { guestName, setGuestName, clearGuestName } = useGuestProfile();
  const [hoveredAvatar, setHoveredAvatar] = useState<User | 'Guest' | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGuestEditorOpen, setIsGuestEditorOpen] = useState(false);
  const [guestNameDraft, setGuestNameDraft] = useState(guestName);
  const [guestError, setGuestError] = useState<string | null>(null);

  useEffect(() => {
    if (!isGuestEditorOpen) {
      setGuestNameDraft(guestName);
    }
  }, [guestName, isGuestEditorOpen]);

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

  const handleGuestBubbleClick = () => {
    setCurrentUser(null);
    setGuestError(null);
    setGuestNameDraft(guestName);
    setIsGuestEditorOpen((open) => !open || !guestName);
  };

  const handleGuestSave = () => {
    const normalized = normalizeGuestName(guestNameDraft);

    if (!normalized) {
      setGuestError('Add a guest name to continue.');
      return;
    }

    if (isReservedProfileName(normalized)) {
      setGuestError('Use Aaron or Electra bubbles for those names.');
      return;
    }

    setGuestName(normalized);
    setCurrentUser(null);
    setGuestError(null);
    setIsGuestEditorOpen(false);
  };

  const handleGuestClear = () => {
    clearGuestName();
    setCurrentUser(null);
    setGuestNameDraft('');
    setGuestError(null);
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
        }}
      >
        {(['Aaron', 'Electra'] as User[]).map((user, index) => (
          <React.Fragment key={user}>
            {user === 'Electra' && (
              <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'center', minWidth: 0 }}>
                <GuestBubbleAvatar
                  guestName={guestName}
                  isHovered={hoveredAvatar === 'Guest' || (currentUser === null && Boolean(guestName))}
                  isActive={currentUser === null && Boolean(guestName)}
                  onClick={handleGuestBubbleClick}
                  onMouseEnter={() => setHoveredAvatar('Guest')}
                  onMouseLeave={() => setHoveredAvatar(null)}
                  onFocus={() => setHoveredAvatar('Guest')}
                  onBlur={() => setHoveredAvatar(null)}
                />
              </div>
            )}

            <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'center', minWidth: 0 }}>
              <GelBubbleAvatar
                user={user}
                hasPin={userHasPin(user)}
                isHovered={hoveredAvatar === user || currentUser === user}
                onClick={() => handleUserClick(user)}
                onMouseEnter={() => setHoveredAvatar(user)}
                onMouseLeave={() => setHoveredAvatar(null)}
                onFocus={() => setHoveredAvatar(user)}
                onBlur={() => setHoveredAvatar(null)}
                animationOffset={index % 2 === 1}
              />
            </div>
          </React.Fragment>
        ))}
      </div>

      {!currentUser && guestName && !isGuestEditorOpen && (
        <p
          style={{
            marginTop: spacing.sm,
            marginBottom: 0,
            color: colors.textSecondary,
            fontSize: typography.fontSize.xs,
            textAlign: 'center',
          }}
        >
          Guest bubble active as {guestName}
        </p>
      )}

      {isGuestEditorOpen && (
        <div
          style={{
            marginTop: spacing.md,
            width: 'min(560px, 100%)',
            padding: spacing.md,
            borderRadius: spacing.md,
            border: `1px solid ${colors.borderSecondary}40`,
            backgroundColor: 'rgba(18, 31, 58, 0.62)',
            boxShadow: '0 10px 20px rgba(0,0,0,0.25)',
          }}
        >
          <Input
            label="Guest bubble name"
            value={guestNameDraft}
            onChange={(event) => {
              setGuestNameDraft(event.target.value.slice(0, MAX_GUEST_NAME_LENGTH));
              setGuestError(null);
            }}
            placeholder="Example: Maya"
            aria-label="Guest bubble name"
            autoFocus
            style={{ height: '44px' }}
          />
          {guestError && (
            <p
              style={{
                marginTop: spacing.xs,
                marginBottom: 0,
                color: colors.error,
                fontSize: typography.fontSize.xs,
              }}
            >
              {guestError}
            </p>
          )}
          <div
            style={{
              marginTop: spacing.sm,
              display: 'flex',
              gap: spacing.sm,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Button type="button" variant="secondary" onClick={handleGuestSave}>
              Save Guest Bubble
            </Button>
            {guestName && (
              <Button type="button" variant="ghost" onClick={handleGuestClear}>
                Clear
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setGuestNameDraft(guestName);
                setGuestError(null);
                setIsGuestEditorOpen(false);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      )}

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
