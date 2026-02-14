import React from 'react';
import { useUser } from '../context/UserContext';
import ImageWithFallback from './ImageWithFallback';
import { userImageSources, defaultImageSources } from '../config/imageConfig';
import Card from './ui/Card';
import { spacing, typography, colors, shadows } from '../design-system/tokens';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';

import { User } from '../types';
import { LogoutIcon, LockIcon, TrashIcon } from './icons';
import Button from './ui/Button';
import IconButton from './ui/IconButton';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onPinAction: () => void;
  onRemovePin: () => void;
  hasPin: boolean;
  movieCount?: number;
  watchedTogetherCount?: number;
}

const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onPinAction,
  onRemovePin,
  hasPin,
  movieCount = 0,
  watchedTogetherCount = 0,
}) => {
  const sources = currentUser ? userImageSources[currentUser] : defaultImageSources;
  const isMobile = useMediaQuery(breakpoints.sm);

  return (
    <div style={{ marginBottom: spacing.xl }}>
      <Card variant="elevated" className="animate-fade-in">
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            width: '100%',
            gap: isMobile ? spacing.md : spacing.lg,
            padding: isMobile ? spacing.md : `${spacing.md} ${spacing.lg}`,
          }}
          className="header-content"
        >
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              gap: isMobile ? spacing.sm : spacing.md,
              width: '100%',
              flex: 1,
            }}
          >
            <div
              style={{
                width: isMobile ? '40px' : '48px',
                height: isMobile ? '40px' : '48px',
                minWidth: isMobile ? '40px' : '48px',
                minHeight: isMobile ? '40px' : '48px',
                position: 'relative',
                flexShrink: 0,
              }}
              className="header-avatar"
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '-2px',
                  borderRadius: '50%',
                  background: colors.gradientPink,
                  opacity: 0.3,
                  filter: 'blur(4px)',
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
                  border: `2px solid ${colors.accent}`,
                  boxShadow: shadows.glow,
                  display: 'block',
                }}
              />
            </div>

            <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left', minWidth: 0 }}>
              <h1
                style={{
                  fontSize: isMobile ? typography.fontSize.lg : typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.accent,
                  background: shadows.textGradientPink,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: typography.lineHeight.tight,
                  margin: 0,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5), 0 0 12px rgba(255, 105, 180, 0.3)',
                  letterSpacing: '0.01em',
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                className="header-title"
              >
                Aaron &amp; Electra
              </h1>
              <p
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.textSecondary,
                  margin: 0,
                  marginTop: spacing.xs,
                  letterSpacing: '0.02em',
                  lineHeight: typography.lineHeight.normal,
                  opacity: 0.8,
                }}
              >
                Shared Watchlist
                {currentUser ? (
                  <>
                    {' • '}
                    <span style={{ color: colors.accent, fontWeight: typography.fontWeight.bold }}>
                      {currentUser}
                    </span>
                  </>
                ) : (
                  ' • Guest Mode'
                )}
              </p>
              {/* Movie Stats Badge */}
              {movieCount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    marginTop: spacing.xs,
                    padding: `2px ${spacing.sm}`,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: colors.textTertiary,
                    width: 'fit-content',
                    margin: isMobile ? '4px auto 0' : '4px 0 0',
                  }}
                >
                  <span>🎬 {movieCount} movies</span>
                  {watchedTogetherCount > 0 && (
                    <>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span style={{ color: colors.accent }}>
                        💕 {watchedTogetherCount} watched together
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {currentUser && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                width: isMobile ? '100%' : 'auto',
                justifyContent: isMobile ? 'center' : 'flex-end',
                paddingTop: isMobile ? spacing.sm : 0,
                borderTop: isMobile ? `1px solid ${colors.borderSecondary}20` : 'none',
              }}
            >
              <div style={{ display: 'flex', gap: spacing.sm }}>
                <IconButton
                  onClick={onPinAction}
                  variant="ghost"
                  size="sm"
                  title={hasPin ? 'Change PIN' : 'Set PIN'}
                  aria-label={hasPin ? 'Change PIN' : 'Set PIN'}
                  style={{
                    color: hasPin ? colors.success : colors.textPrimary,
                    borderColor: hasPin ? `${colors.success}60` : 'rgba(255,255,255,0.2)',
                    border: '1px solid',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                  }}
                >
                  <LockIcon />
                </IconButton>
                {hasPin && (
                  <IconButton
                    onClick={onRemovePin}
                    variant="ghost"
                    size="sm"
                    title="Remove PIN"
                    aria-label="Remove PIN"
                    style={{
                      color: colors.error,
                      borderColor: `${colors.error}60`,
                      border: '1px solid',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                    }}
                  >
                    <TrashIcon />
                  </IconButton>
                )}
              </div>

              <Button
                onClick={onLogout}
                variant="secondary"
                size="sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: colors.textPrimary,
                  padding: isMobile ? '6px 12px' : undefined,
                  fontSize: isMobile ? '12px' : undefined,
                }}
              >
                <LogoutIcon
                  style={{
                    width: isMobile ? '1rem' : '1.25rem',
                    height: isMobile ? '1rem' : '1.5rem',
                  }}
                />
                {isMobile ? 'Exit' : 'Logout'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Header;
