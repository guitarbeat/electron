import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { User } from '../types';
import GelBubbleAvatar from './GelBubbleAvatar';
import GuestBubbleAvatar from './GuestBubbleAvatar';
import { usePins } from '../hooks/usePins';
import { spacing, typography, radius } from '../design-system/tokens';
import PinDialog from './PinDialog';
import GuestBubbleNameEditor from './GuestBubbleNameEditor';
import {
  useGuestProfile,
  MAX_GUEST_NAME_LENGTH,
  normalizeGuestName,
  isReservedProfileName,
} from '../hooks/useGuestProfile';

const UserSelection: React.FC = () => {
  const { currentUser, setCurrentUser } = useUser();
  const { userHasPin, verifyUserPin } = usePins();
  const { guestName, setGuestName, clearGuestName } = useGuestProfile();
  const [hoveredAvatar, setHoveredAvatar] = useState<User | 'Guest' | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGuestEditorOpen, setIsGuestEditorOpen] = useState(false);
  const [guestNameDraft, setGuestNameDraft] = useState(guestName);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [isGuestSaveConfirmed, setIsGuestSaveConfirmed] = useState(false);
  const guestMotionEasing = 'cubic-bezier(0.22, 1, 0.36, 1)';

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
    setIsGuestSaveConfirmed(true);
    setIsGuestEditorOpen(false);
  };

  const handleGuestClear = () => {
    clearGuestName();
    setCurrentUser(null);
    setGuestNameDraft('');
    setGuestError(null);
    setIsGuestSaveConfirmed(false);
  };

  useEffect(() => {
    if (!isGuestSaveConfirmed) return;
    const timer = setTimeout(() => setIsGuestSaveConfirmed(false), 1500);
    return () => clearTimeout(timer);
  }, [isGuestSaveConfirmed]);

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

      {!currentUser && guestName && !isGuestEditorOpen && (
        <div
          style={{
            marginTop: spacing.sm,
            marginBottom: 0,
            color: isGuestSaveConfirmed ? '#fff0cf' : '#d4e8ff',
            fontSize: typography.fontSize.xs,
            textAlign: 'center',
            border: `1px solid ${isGuestSaveConfirmed ? 'rgba(255, 214, 144, 0.6)' : 'rgba(147, 199, 252, 0.45)'}`,
            borderRadius: radius.full,
            background:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), rgba(255,255,255,0)), rgba(19, 36, 66, 0.7)',
            padding: `${spacing.xs} ${spacing.md}`,
            boxShadow: isGuestSaveConfirmed
              ? '0 0 18px rgba(255, 196, 120, 0.32)'
              : '0 0 18px rgba(107, 170, 236, 0.25)',
            transition: `all 220ms ${guestMotionEasing}`,
            animation: isGuestSaveConfirmed ? `guest-save-chip-pop 360ms ${guestMotionEasing}` : undefined,
          }}
        >
          <style>
            {`@keyframes guest-save-chip-pop { from { transform: translateY(2px) scale(0.985); opacity: 0.65; } to { transform: translateY(0) scale(1); opacity: 1; } }`}
          </style>
          {isGuestSaveConfirmed ? 'Guest bubble saved' : 'Guest bubble active'} as {guestName}
        </div>
      )}

      {isGuestEditorOpen && (
        <div
          style={{
            marginTop: spacing.md,
            width: 'min(560px, 100%)',
            animation: `guest-editor-wrap-rise 240ms ${guestMotionEasing}`,
          }}
        >
          <style>
            {`@keyframes guest-editor-wrap-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}
          </style>
          <GuestBubbleNameEditor
            draftName={guestNameDraft}
            savedName={guestName}
            error={guestError}
            autoFocus
            onDraftChange={(value) => {
              setGuestNameDraft(value.slice(0, MAX_GUEST_NAME_LENGTH));
              setGuestError(null);
            }}
            onSave={handleGuestSave}
            onClear={handleGuestClear}
            isSaveConfirmed={isGuestSaveConfirmed}
            onClose={() => {
              setGuestNameDraft(guestName);
              setGuestError(null);
              setIsGuestEditorOpen(false);
            }}
          />
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
