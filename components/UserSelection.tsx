import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { User } from '../types';
import ImageWithFallback from './ImageWithFallback';
import { userImageSources, defaultImageSources } from '../config/imageConfig';
import Card from './ui/Card';
import Button from './ui/Button';
import { spacing, typography, colors, shadows } from '../design-system/tokens';

interface UserSelectionProps {
  onTakeQuiz: () => void;
}

const UserSelection: React.FC<UserSelectionProps> = ({ onTakeQuiz }) => {
  const { setCurrentUser } = useUser();
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);

  const handleUserSelect = (user: User) => {
    setCurrentUser(user);
  };

  const sources = hoveredUser ? userImageSources[hoveredUser] : defaultImageSources;

  return (
    <div
      style={{
        maxWidth: '28rem',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <Card variant="elevated" className="animate-fade-in">
        <div style={{ padding: spacing['2xl'] }}>
            <div
              style={{
                height: '128px',
                minHeight: '128px',
                maxHeight: '200px',
                marginBottom: spacing.xl,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                width: '100%',
              }}
            >
            <div
              style={{
                position: 'absolute',
                inset: '-8px',
                borderRadius: '12px',
                background: colors.gradientPink,
                opacity: hoveredUser ? 0.4 : 0.2,
                filter: 'blur(12px)',
                transition: 'opacity 0.3s ease-out',
                zIndex: -1,
              }}
            />
            <ImageWithFallback
              key={hoveredUser || 'default'}
              sources={sources}
              alt={`A meme representing ${hoveredUser || 'no one'}`}
              style={{
                maxHeight: '100%',
                maxWidth: '100%',
                width: 'auto',
                height: 'auto',
                borderRadius: '8px',
                border: `3px solid ${colors.accent}`,
                objectFit: 'contain',
                boxShadow: shadows.glow,
                transition: 'all 0.3s ease-out',
                transform: hoveredUser ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          </div>
          <h2
            className="user-selection-title"
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.semibold,
              color: colors.accent, // * Fallback for browsers without gradient support
              background: shadows.textGradientPink,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: spacing.xl,
              marginTop: 0,
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.5), 0 0 16px rgba(255, 105, 180, 0.3)',
              letterSpacing: '0.02em',
              filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))',
            }}
          >
            Who's Watching?
          </h2>
          <p style={{
            fontSize: typography.fontSize.base,
            color: colors.textSecondary,
            marginBottom: spacing.xl,
            marginTop: 0,
            textAlign: 'center',
            lineHeight: typography.lineHeight.relaxed,
            letterSpacing: '0.02em',
          }}>
            Select your profile to view and manage your shared movie watchlist
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.lg,
              marginBottom: spacing.xl,
            }}
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleUserSelect('Aaron')}
              onMouseEnter={() => setHoveredUser('Aaron')}
              onMouseLeave={() => setHoveredUser(null)}
              onFocus={() => setHoveredUser('Aaron')}
              onBlur={() => setHoveredUser(null)}
              style={{ width: '100%', fontSize: typography.fontSize.xl }}
              aria-label="Select Aaron as user"
            >
              Aaron
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleUserSelect('Electra')}
              onMouseEnter={() => setHoveredUser('Electra')}
              onMouseLeave={() => setHoveredUser(null)}
              onFocus={() => setHoveredUser('Electra')}
              onBlur={() => setHoveredUser(null)}
              style={{ width: '100%', fontSize: typography.fontSize.xl }}
              aria-label="Select Electra as user"
            >
              Electra
            </Button>
          </div>

          <div
            style={{
              borderTop: `1px solid ${colors.borderSecondary}`,
              paddingTop: spacing.lg,
              marginTop: spacing.lg,
            }}
          >
            <p
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.textSecondary,
                marginBottom: spacing.md,
              }}
            >
              Don't know who you are?
            </p>
            <Button
              variant="secondary"
              size="md"
              onClick={onTakeQuiz}
              style={{
                width: '100%',
                fontSize: typography.fontSize.base,
                backgroundColor: 'transparent',
                border: `1px solid ${colors.accent}`,
                color: colors.accent,
              }}
              aria-label="Take the personality quiz"
            >
              ✨ Take Personality Quiz
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserSelection;