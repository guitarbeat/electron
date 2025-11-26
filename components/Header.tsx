import React from 'react';
import { useUser } from '../context/UserContext';
import ImageWithFallback from './ImageWithFallback';
import { userImageSources, defaultImageSources } from '../config/imageConfig';
import Card from './ui/Card';
import { spacing, typography, colors, shadows } from '../design-system/tokens';

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
          className="header-content"
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              minWidth: '64px',
              minHeight: '64px',
              maxWidth: '120px',
              maxHeight: '120px',
              position: 'relative',
              flexShrink: 0,
            }}
            className="header-avatar"
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
                display: 'block',
              }}
            />
          </div>

          <h1
            style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.accent, // * Fallback for browsers without gradient support
              background: shadows.textGradientPink,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textAlign: 'center',
              lineHeight: typography.lineHeight.tight,
              margin: 0,
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 105, 180, 0.3)',
              letterSpacing: '0.02em',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))',
            }}
            className="header-title"
          >
            Aaron &amp; Electra's Movie List
          </h1>
          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.textSecondary,
            textAlign: 'center',
            margin: 0,
            marginTop: spacing.sm,
            letterSpacing: '0.05em',
            opacity: 0.9,
          }}>
            Your shared watchlist
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Header;