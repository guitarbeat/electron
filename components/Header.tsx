import React from 'react';
import { useUser } from '../context/UserContext';
import ImageWithFallback from './ImageWithFallback';
import { userImageSources, defaultImageSources } from '../config/imageConfig';
import Card from './ui/Card';
import { spacing, typography, colors, shadows } from '../design-system/tokens';

import { User } from '../types';
import { LogoutIcon, LockIcon, TrashIcon } from './icons';
import Button from './ui/Button';
import IconButton from './ui/IconButton';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  onPinAction: () => void;
  onRemovePin: () => void;
  hasPin: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  currentUser, 
  onLogout, 
  onPinAction, 
  onRemovePin, 
  hasPin 
}) => {
  const sources = currentUser ? userImageSources[currentUser] : defaultImageSources;

  return (
    <div style={{ marginBottom: spacing.xl }}>
      <Card variant="elevated" className="animate-fade-in">
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            gap: spacing.lg,
            padding: `${spacing.md} ${spacing.lg}`,
          }}
          className="header-content"
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              minWidth: '48px',
              minHeight: '48px',
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

          <div style={{ flex: 1, textAlign: 'left' }}>
            <h1
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.accent, // * Fallback for browsers without gradient support
                background: shadows.textGradientPink,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: typography.lineHeight.tight,
                margin: 0,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.5), 0 0 12px rgba(255, 105, 180, 0.3)',
                letterSpacing: '0.01em',
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6))',
              }}
              className="header-title"
            >
              Aaron &amp; Electra
            </h1>
            <p style={{
              fontSize: typography.fontSize.xs,
              color: colors.textSecondary,
              margin: 0,
              marginTop: spacing.xs,
              letterSpacing: '0.02em',
              lineHeight: typography.lineHeight.normal,
              opacity: 0.8,
            }}>
              Shared Watchlist • <span style={{ color: colors.accent, fontWeight: typography.fontWeight.bold }}>{currentUser}</span>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <IconButton
                onClick={onPinAction}
                variant="ghost"
                size="sm"
                title={hasPin ? "Change PIN" : "Set PIN"}
                style={{ 
                  color: hasPin ? colors.success : colors.textTertiary,
                  borderColor: hasPin ? `${colors.success}40` : `${colors.borderSecondary}40`,
                  border: '1px solid'
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
                  style={{ 
                    color: colors.error,
                    borderColor: `${colors.error}40`,
                    border: '1px solid'
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
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderColor: 'rgba(255,255,255,0.1)'
              }}
            >
              <LogoutIcon style={{ width: '1.25rem', height: '1.5rem' }} />
              Logout
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Header;