import React, { useState, useEffect, useMemo } from 'react';
import Card from './Card';
import { CheckIcon } from '../common/icons';
import { colors, shadows, spacing, typography, radius } from '../../design-system/tokens';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss?: () => void;
  duration?: number;
}

const TOAST_STYLES = {
  error: {
    backgroundColor: `${colors.error}30`,
    borderColor: colors.error,
    iconColor: colors.error,
    shadow: `0 4px 12px ${colors.error}40, ${shadows.card}`,
  },
  success: {
    backgroundColor: `${colors.success}30`,
    borderColor: colors.success,
    iconColor: colors.success,
    shadow: `0 4px 12px ${colors.success}40, ${shadows.card}`,
  },
  info: {
    backgroundColor: `${colors.secondary}30`,
    borderColor: colors.secondary,
    iconColor: colors.secondary,
    shadow: `0 4px 12px ${colors.secondary}40, ${shadows.card}`,
  },
} as const;

const TOAST_CONTENT_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
  color: colors.textPrimary,
  justifyContent: 'center',
};

const TOAST_MESSAGE_STYLE: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  textAlign: 'center',
  fontWeight: typography.fontWeight.medium,
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  hyphens: 'auto',
  maxWidth: '100%',
  flex: '1 1 auto',
  minWidth: 0,
};

const TOAST_DISMISS_BUTTON_STYLE: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: colors.textSecondary,
  cursor: 'pointer',
  padding: spacing.xs,
  fontSize: '18px',
  lineHeight: 1,
  opacity: 0.7,
  transition: 'opacity 0.2s',
  borderRadius: radius.sm,
};

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss, duration = 3000 }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const exitTimer = setTimeout(() => setIsExiting(true), duration - 300);
      const dismissTimer = setTimeout(() => onDismiss?.(), duration);
      return () => {
        clearTimeout(exitTimer);
        clearTimeout(dismissTimer);
      };
    }
    return undefined;
  }, [duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss?.(), 300);
  };

  const styles = TOAST_STYLES[type] || TOAST_STYLES.info;

  const cardStyle = useMemo(
    () => ({
      position: 'fixed' as const,
      top: spacing.lg,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      maxWidth: '90%',
      padding: spacing.lg,
      backgroundColor: styles.backgroundColor,
      borderColor: styles.borderColor,
      borderWidth: '2px',
      animation: isExiting
        ? 'toast-slide-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
        : 'toast-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      boxShadow: styles.shadow,
    }),
    [styles, isExiting]
  );

  const icon = useMemo(() => {
    switch (type) {
      case 'success':
        return (
          <CheckIcon
            style={{
              color: styles.iconColor,
              flexShrink: 0,
              filter: 'drop-shadow(0 0 4px rgba(74, 222, 128, 0.6))',
            }}
          />
        );
      case 'error':
        return <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>;
      case 'info':
      default:
        return <span style={{ fontSize: '20px', flexShrink: 0 }}>ℹ️</span>;
    }
  }, [type, styles.iconColor]);

  return (
    <Card
      variant="elevated"
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      style={cardStyle}
    >
      <div style={TOAST_CONTENT_STYLE}>
        {icon}
        <span style={TOAST_MESSAGE_STYLE}>{message}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            style={TOAST_DISMISS_BUTTON_STYLE}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7';
            }}
          >
            ✕
          </button>
        )}
      </div>
    </Card>
  );
};

export default Toast;
