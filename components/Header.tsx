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
      <Card variant="elevated">
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
            }}
          >
            <ImageWithFallback
              key={currentUser || 'default'}
              sources={sources}
              alt={currentUser ? `${currentUser}'s avatar` : 'Default avatar'}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `2px solid ${colors.accent}`,
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
              textShadow: '2px 2px 4px #ff69b4',
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