import React from 'react';
import { useUser } from '../context/UserContext';
import ImageWithFallback from './ImageWithFallback';
import { userImageSources, defaultImageSources } from '../config/imageConfig';
import Card from './ui/Card';
import { spacing, typography, colors } from '../design-system/tokens';

const Header: React.FC = () => {
  const { currentUser } = useUser();
  const sources = currentUser ? userImageSources[currentUser] : defaultImageSources;

  return (
    <div style={{ marginBottom: spacing['2xl'] }}>
      <Card variant="elevated" className="animate-fade-in">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            gap: spacing.lg,
            padding: spacing.xl,
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                background: colors.gradientPink,
                opacity: 0.3,
                filter: 'blur(8px)',
                zIndex: -1,
              }}
            />
            <ImageWithFallback
              key={currentUser || 'default'}
              sources={sources}
              alt={currentUser ? `${currentUser}'s avatar` : 'Default avatar'}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `3px solid ${colors.accent}`,
                boxShadow: shadows.glow,
              }}
            />
          </div>

          <h1
            style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.textPrimary,
              textAlign: 'center',
              lineHeight: typography.lineHeight.tight,
              margin: 0,
              textShadow: shadows.textGlow,
              letterSpacing: '0.02em',
            }}
          >
            Aaron &amp; Electra's Movie List
          </h1>
        </div>
      </Card>
    </div>
  );
};

export default Header;