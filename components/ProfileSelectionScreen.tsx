import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { User } from '../types';
import { usePins } from '../hooks/usePins';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';
import { colors, typography } from '../design-system/tokens';
import GelBubbleAvatar from './GelBubbleAvatar';
import GuestBubbleAvatar from './GuestBubbleAvatar';
import GlossyQuizButton from './GlossyQuizButton';
import PinDialog from './PinDialog';
import SuggestionForm from './SuggestionForm';
import {
  useGuestProfile,
  MAX_GUEST_NAME_LENGTH,
  normalizeGuestName,
  isReservedProfileName,
} from '../hooks/useGuestProfile';
import Input from './ui/Input';
import Button from './ui/Button';
import { spacing } from '../design-system/tokens';

interface ProfileSelectionScreenProps {
  onTakeQuiz: () => void;
}

const ProfileSelectionScreen: React.FC<ProfileSelectionScreenProps> = ({ onTakeQuiz }) => {
  const { setCurrentUser } = useUser();
  const { userHasPin, verifyUserPin, isLoading: isPinsLoading } = usePins();
  const isMobile = useMediaQuery(breakpoints.sm);
  const { guestName, setGuestName, clearGuestName } = useGuestProfile();

  const [hoveredUser, setHoveredUser] = useState<User | 'Guest' | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGuestEditorOpen, setIsGuestEditorOpen] = useState(false);
  const [guestNameDraft, setGuestNameDraft] = useState(guestName);
  const [guestError, setGuestError] = useState<string | null>(null);

  const handleUserSelect = (user: User) => {
    if (userHasPin(user)) {
      setSelectedUser(user);
      setShowPinDialog(true);
    } else {
      setCurrentUser(user);
    }
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (!selectedUser) return false;
    setIsVerifying(true);
    try {
      const isValid = await verifyUserPin(selectedUser, pin);
      if (isValid) {
        setShowPinDialog(false);
        setCurrentUser(selectedUser);
        setSelectedUser(null);
        return true;
      }
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinCancel = () => {
    setShowPinDialog(false);
    setSelectedUser(null);
  };

  const handleGuestBubbleClick = () => {
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
    setGuestError(null);
    setIsGuestEditorOpen(false);
  };

  const handleGuestClear = () => {
    clearGuestName();
    setGuestNameDraft('');
    setGuestError(null);
  };

  return (
    <div
      className="animate-fade-in pixel-stars"
      style={{
        minHeight: '100dvh',
        width: '100%',
        background: `linear-gradient(135deg, ${colors.background} 0%, #121620 45%, #0b0d11 100%)`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Pixel Stars Layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <div className="twinkle-stars" />
        <div className="twinkle-stars twinkle-stars-offset" />
      </div>

      {/* Shooting Stars */}
      <div className="shooting-star" style={{ top: '10%', left: '-100px', animationDelay: '0s' }} />
      <div className="shooting-star" style={{ top: '30%', left: '-100px', animationDelay: '3s' }} />
      <div className="shooting-star" style={{ top: '60%', left: '-100px', animationDelay: '7s' }} />

      {/* Header Title with Entrance Animation */}
      <div
        style={{
          position: 'absolute',
          top: isMobile ? '16px' : '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          textAlign: 'center',
        }}
      >
        <h1
          className="title-entrance"
          style={{
            fontFamily: typography.fontFamily.heading.join(', '),
            fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
            fontWeight: 600,
            margin: 0,
            backgroundImage: 'linear-gradient(135deg, #ff69b4 0%, #87cefa 50%, #ff69b4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: 'none',
            letterSpacing: typography.letterSpacing.wide,
          }}
        >
          Who&apos;s Watching?
        </h1>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          padding: isMobile ? '24px 16px' : '32px',
          gap: isMobile ? '24px' : '0',
          marginTop: isMobile ? '60px' : '40px',
        }}
      >
        {/* Aaron's Side */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '16px' : '32px',
          }}
        >
          <GelBubbleAvatar
            user="Aaron"
            hasPin={userHasPin('Aaron')}
            isHovered={hoveredUser === 'Aaron'}
            onClick={() => handleUserSelect('Aaron')}
            onMouseEnter={() => setHoveredUser('Aaron')}
            onMouseLeave={() => setHoveredUser(null)}
            onFocus={() => setHoveredUser('Aaron')}
            onBlur={() => setHoveredUser(null)}
            disabled={isPinsLoading}
          />
        </div>

        {/* Guest Bubble in the Middle */}
        <div
          style={{
            flex: isMobile ? 'none' : 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '16px' : '32px',
          }}
        >
          <GuestBubbleAvatar
            guestName={guestName}
            isHovered={hoveredUser === 'Guest'}
            isActive={Boolean(guestName)}
            onClick={handleGuestBubbleClick}
            onMouseEnter={() => setHoveredUser('Guest')}
            onMouseLeave={() => setHoveredUser(null)}
            onFocus={() => setHoveredUser('Guest')}
            onBlur={() => setHoveredUser(null)}
          />
        </div>

        {/* Electra's Side */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '16px' : '32px',
          }}
        >
          <GelBubbleAvatar
            user="Electra"
            hasPin={userHasPin('Electra')}
            isHovered={hoveredUser === 'Electra'}
            onClick={() => handleUserSelect('Electra')}
            onMouseEnter={() => setHoveredUser('Electra')}
            onMouseLeave={() => setHoveredUser(null)}
            onFocus={() => setHoveredUser('Electra')}
            onBlur={() => setHoveredUser(null)}
            disabled={isPinsLoading}
            animationOffset
          />
        </div>
      </div>

      {/* Guest Name Editor (Visible when clicked) */}
      {isGuestEditorOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            width: 'min(560px, 90%)',
            padding: spacing.md,
            borderRadius: spacing.md,
            border: `1px solid ${colors.borderSecondary}40`,
            backgroundColor: 'rgba(18, 31, 58, 0.9)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
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

      {/* Bottom Section */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: isMobile ? '24px 16px 32px' : '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          background: 'transparent',
          borderTop: 'none',
          borderRadius: 0,
          boxShadow: 'none',
          marginTop: 'auto',
        }}
      >
        {/* Quiz Button */}
        <GlossyQuizButton onClick={onTakeQuiz}>✨ Take Personality Quiz ✨</GlossyQuizButton>

        {/* Suggestion Form */}
        <div
          style={{
            width: '100%',
            maxWidth: '700px',
          }}
        >
          <SuggestionForm />
        </div>
      </div>

      {/* PIN Dialog */}
      {selectedUser && (
        <PinDialog
          isOpen={showPinDialog}
          user={selectedUser}
          mode="enter"
          onSubmit={handlePinSubmit}
          onCancel={handlePinCancel}
          isLoading={isVerifying}
        />
      )}
    </div>
  );
};

export default ProfileSelectionScreen;
