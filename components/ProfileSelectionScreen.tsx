import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { User } from '../types';
import { usePins } from '../hooks/usePins';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';
import GelBubbleAvatar from './GelBubbleAvatar';
import GlossyQuizButton from './GlossyQuizButton';
import PinDialog from './PinDialog';
import SuggestionForm from './SuggestionForm';

interface ProfileSelectionScreenProps {
  onTakeQuiz: () => void;
}

const ProfileSelectionScreen: React.FC<ProfileSelectionScreenProps> = ({ onTakeQuiz }) => {
  const { setCurrentUser } = useUser();
  const { userHasPin, verifyUserPin, isLoading: isPinsLoading } = usePins();
  const isMobile = useMediaQuery(breakpoints.sm);

  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

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

  return (
    <div
      className="animate-fade-in pixel-stars"
      style={{
        minHeight: '100dvh',
        width: '100%',
        // Deep purple to midnight blue gradient
        background: 'linear-gradient(135deg, #2d1b4e 0%, #1a1a3e 50%, #0f0f2e 100%)',
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
        {/* Star layer 1 */}
        <div className="twinkle-stars" />
        {/* Star layer 2 (offset animation) */}
        <div className="twinkle-stars twinkle-stars-offset" />
      </div>

      {/* Heart pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 4.248c-3.148-5.402-12-3.825-12 2.944 0 4.661 5.571 9.427 12 15.808 6.43-6.381 12-11.147 12-15.808 0-6.792-8.875-8.306-12-2.944z' fill='%23ff69b4' opacity='0.08'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

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

        {/* Neon Divider */}
        <div
          className="neon-pulse"
          style={{
            width: isMobile ? '80%' : '2px',
            height: isMobile ? '2px' : '60%',
            background: 'linear-gradient(90deg, transparent, #ff69b4, #87cefa, #ff69b4, transparent)',
            boxShadow: `
              0 0 10px rgba(255, 105, 180, 0.8),
              0 0 20px rgba(255, 105, 180, 0.5),
              0 0 40px rgba(135, 206, 250, 0.3)
            `,
            borderRadius: '2px',
          }}
        />

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

      {/* Header Title */}
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
          style={{
            fontFamily: "'Papyrus', fantasy",
            fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
            fontWeight: 600,
            color: '#fff',
            margin: 0,
            background: 'linear-gradient(135deg, #ff69b4 0%, #87cefa 50%, #ff69b4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
            filter: 'drop-shadow(0 2px 10px rgba(255, 105, 180, 0.5))',
            letterSpacing: '0.05em',
          }}
        >
          Who's Watching?
        </h1>
      </div>

      {/* Bottom Section */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: isMobile ? '16px' : '32px',
          paddingTop: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* Quiz Button */}
        <GlossyQuizButton onClick={onTakeQuiz}>
          ✨ Take Personality Quiz ✨
        </GlossyQuizButton>

        {/* Suggestion Form */}
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
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
