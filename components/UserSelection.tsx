import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { User } from '../types';
import ImageWithFallback from './ImageWithFallback';
import { userImageSources, defaultImageSources } from '../config/imageConfig';
import Card from './ui/Card';
import Button from './ui/Button';
import { spacing, typography, colors, shadows } from '../design-system/tokens';

const UserSelection: React.FC = () => {
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
              marginBottom: spacing.xl,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
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
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.semibold,
              color: colors.accent,
              marginBottom: spacing.xl,
              marginTop: 0,
              textShadow: shadows.textGlow,
              letterSpacing: '0.02em',
            }}
          >
            Select User
          </h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md,
            }}
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleUserSelect('Aaron')}
              onMouseEnter={() => setHoveredUser('Aaron')}
              onMouseLeave={() => setHoveredUser(null)}
              style={{ width: '100%' }}
            >
              Aaron
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleUserSelect('Electra')}
              onMouseEnter={() => setHoveredUser('Electra')}
              onMouseLeave={() => setHoveredUser(null)}
              style={{ width: '100%' }}
            >
              Electra
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserSelection;