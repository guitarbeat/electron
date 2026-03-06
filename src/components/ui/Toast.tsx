import React, { useEffect, useMemo, useState } from 'react';
import Card from './Card';
import { CheckIcon } from '../common/icons';
import { colors, shadows, spacing, typography, radius } from '../../design-system/tokens';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss?: () => void;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
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

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onDismiss,
  duration = 3500,
  actionLabel,
  onAction,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const exitTimer = setTimeout(() => setIsExiting(true), Math.max(0, duration - 250));
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
    setTimeout(() => onDismiss?.(), 250);
  };

  const styles = TOAST_STYLES[type] || TOAST_STYLES.info;

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
        return <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>;
      case 'info':
      default:
        return <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>ℹ️</span>;
    }
  }, [styles.iconColor, type]);

  return (
    <Card
      variant="elevated"
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      style={{
        width: 'min(680px, calc(100vw - 1.5rem))',
        padding: spacing.md,
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        borderWidth: '2px',
        boxShadow: styles.shadow,
        animation: isExiting
          ? 'toast-slide-out 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards'
          : 'toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          color: colors.textPrimary,
        }}
      >
        {icon}

        <span
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            flex: '1 1 auto',
            minWidth: 0,
          }}
        >
          {message}
        </span>

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={() => {
              onAction();
              handleDismiss();
            }}
            style={{
              border: `1px solid ${styles.borderColor}`,
              background: 'rgba(255,255,255,0.08)',
              color: colors.textPrimary,
              borderRadius: radius.sm,
              padding: `0 ${spacing.sm}`,
              minHeight: '30px',
              cursor: 'pointer',
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            {actionLabel}
          </button>
        )}

        {onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            style={{
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              padding: spacing.xs,
              fontSize: '1.05rem',
              lineHeight: 1,
              borderRadius: radius.sm,
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
