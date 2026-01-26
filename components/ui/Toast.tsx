import React from 'react';
import Card from './Card';
import { CheckIcon } from '../icons';
import { colors, shadows, spacing, typography } from '../../design-system/tokens';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
}

const Toast: React.FC<ToastProps> = ({ message, type }) => {
  return (
    <Card
      variant="elevated"
      style={{
        position: 'fixed',
        top: spacing.lg,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: '90%',
        padding: spacing.lg,
        backgroundColor: type === 'error' ? colors.error + '30' : colors.success + '30',
        borderColor: type === 'error' ? colors.error : colors.success,
        borderWidth: '2px',
        animation: 'toast-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        boxShadow:
          type === 'error'
            ? `0 4px 12px ${colors.error}40, ${shadows.card}`
            : `0 4px 12px ${colors.success}40, ${shadows.card}`,
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
        {type === 'success' && (
          <CheckIcon
            style={{
              color: colors.success,
              flexShrink: 0,
              filter: 'drop-shadow(0 0 4px rgba(74, 222, 128, 0.6))',
            }}
          />
        )}
        {type === 'error' && <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>}
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
      </div>
    </Card>
  );
};

export default Toast;
