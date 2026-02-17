import React from 'react';
import Card from './ui/Card';
import { spacing, colors } from '../design-system/tokens';
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
}

const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onPinAction,
  onRemovePin,
  hasPin,
}) => {
  const isMobile = useMediaQuery(breakpoints.sm);

  if (!currentUser) {
    return null;
  }

  return (
    <div style={{ marginBottom: spacing.lg }}>
      <Card variant="elevated" className="animate-fade-in">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: spacing.md,
            padding: isMobile ? spacing.sm : `${spacing.sm} ${spacing.md}`,
          }}
          className="header-content"
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
      </Card>
    </div>
  );
};

export default Header;
