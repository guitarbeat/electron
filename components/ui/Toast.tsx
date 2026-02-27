import React, { useState, useEffect, useMemo } from 'react';
import Card from './Card';
import { CheckIcon } from '../common/icons';
import { colors, shadows, spacing, typography, radius } from '../../design-system/tokens';
import './Toast.css';

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
      className={isExiting ? 'toast-slide-out' : 'toast-slide-in'}
      style={{
        position: 'fixed',
        top: spacing.lg,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: '90%',
        padding: spacing.lg,
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        borderWidth: '2px',
        boxShadow: styles.shadow,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          color: colors.textPrimary,
          justifyContent: 'center',
        }}
      >
        {icon}
        <span
          style={{
            fontSize: typography.fontSize.base,
            textAlign: 'center',
            fontWeight: typography.fontWeight.medium,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto',
            maxWidth: '100%',
            flex: '1 1 auto',
            minWidth: 0,
          }}
        >
          {message}
        </span>
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
              fontSize: '18px',
              lineHeight: 1,
              opacity: 0.7,
              transition: 'opacity 0.2s',
              borderRadius: radius.sm,
            }}
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
