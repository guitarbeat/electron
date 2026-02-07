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
        <div className="twinkle-stars" />
        <div className="twinkle-stars twinkle-stars-offset" />
      </div>

      {/* Floating Hearts Y2K Layer */}
      <div className="floating-hearts-y2k">
        <span className="floating-heart-y2k" style={{ left: '35%', animationDelay: '3s' }}>💗</span>
        <span className="floating-heart-y2k" style={{ left: '55%', animationDelay: '8s' }}>💕</span>
        <span className="floating-heart-y2k" style={{ left: '25%', animationDelay: '11s', fontSize: '16px' }}>✨</span>
        <span className="floating-heart-y2k" style={{ left: '85%', animationDelay: '5s', fontSize: '18px' }}>💖</span>
      </div>

      {/* Shooting Stars */}
      <div
        className="shooting-star"
        style={{ top: '10%', left: '-100px', animationDelay: '0s' }}
      />
      <div
        className="shooting-star"
        style={{ top: '30%', left: '-100px', animationDelay: '3s' }}
      />
      <div
        className="shooting-star"
        style={{ top: '60%', left: '-100px', animationDelay: '7s' }}
      />

      {/* Heart pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 4.248c-3.148-5.402-12-3.825-12 2.944 0 4.661 5.571 9.427 12 15.808 6.43-6.381 12-11.147 12-15.808 0-6.792-8.875-8.306-12-2.944z' fill='%23ff69b4' opacity='0.06'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

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
            letterSpacing: '0.05em',
          }}
        >
          Who's Watching?
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

        {/* Heart Divider with Glow Rings */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? '100%' : '80px',
            height: isMobile ? '60px' : '200px',
          }}
        >
          {/* Glow rings */}
          <div
            className="glow-ring"
            style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '2px solid rgba(255, 105, 180, 0.5)',
              boxShadow: '0 0 20px rgba(255, 105, 180, 0.4)',
            }}
          />
          <div
            className="glow-ring-delayed"
            style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '2px solid rgba(135, 206, 250, 0.4)',
              boxShadow: '0 0 15px rgba(135, 206, 250, 0.3)',
            }}
          />
          
          {/* Heart icon */}
          <div
            className="heart-beat"
            style={{
              fontSize: isMobile ? '32px' : '40px',
              filter: 'drop-shadow(0 0 15px rgba(255, 105, 180, 0.8)) drop-shadow(0 0 30px rgba(255, 105, 180, 0.5))',
              zIndex: 1,
            }}
          >
            💗
          </div>
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

      {/* Glassmorphism Bottom Section */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: isMobile ? '24px 16px 32px' : '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          background: 'linear-gradient(135deg, rgba(45, 27, 78, 0.5) 0%, rgba(26, 26, 62, 0.4) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255, 105, 180, 0.2)',
          borderRadius: isMobile ? '24px 24px 0 0' : '32px 32px 0 0',
          boxShadow: `
            0 -4px 30px rgba(255, 105, 180, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          marginTop: 'auto',
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
