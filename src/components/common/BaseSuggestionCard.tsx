import React from 'react';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import { colors, motion, spacing, typography } from '@/theme/tokens';
import { CheckIcon, CrossIcon } from '@/common/icons';

export interface BaseSuggestionCardProps {
  suggestedBy: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onAccept: () => void;
  onReject: () => void;
  canRespond?: boolean;
  disableActions?: boolean;
  isProcessing?: boolean;
  animationDelay?: string;
  footer?: React.ReactNode;
}

const BaseSuggestionCard: React.FC<BaseSuggestionCardProps> = ({
  suggestedBy,
  title,
  subtitle,
  icon,
  onAccept,
  onReject,
  canRespond = true,
  disableActions = false,
  isProcessing = false,
  animationDelay = '0s',
  footer,
}) => {
  const actionsDisabled = isProcessing || disableActions || !canRespond;

  return (
    <Card
      variant="default"
      style={{
        padding: spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        animation: `fade-in ${motion.duration.normal} ${motion.easing.easeOut} ${animationDelay} both`,
        position: 'relative',
        overflow: 'hidden',
        border: `1px dashed ${colors.border}`,
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ ...typography.presets.eyebrow, color: colors.accent, opacity: 0.8 }}>
            Suggestion from {suggestedBy}
          </div>
          {icon && <span style={{ fontSize: '1.2rem' }}>{icon}</span>}
        </div>
        <h3
          style={{
            margin: 0,
            ...typography.presets.bodySm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.textPrimary,
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              margin: 0,
              ...typography.presets.caption,
              color: colors.textSecondary,
              fontStyle: 'italic',
              lineHeight: 1.4,
              marginTop: spacing.xs,
            }}
          >
            "{subtitle}"
          </p>
        )}
        {footer}
      </div>

      <div
        style={{
          display: 'flex',
          gap: spacing.xs,
          marginTop: 'auto',
          paddingTop: spacing.xs,
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={onAccept}
          isLoading={isProcessing}
          disabled={actionsDisabled}
          fullWidth
          style={{ gap: spacing.xs }}
        >
          <CheckIcon style={{ width: 14, height: 14 }} />
          Accept
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReject}
          disabled={actionsDisabled}
          fullWidth
          style={{ gap: spacing.xs, color: colors.error }}
        >
          <CrossIcon style={{ width: 14, height: 14 }} />
          Reject
        </Button>
      </div>

      {!canRespond && (
        <p
          style={{
            margin: 0,
            ...typography.presets.caption,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: spacing.xs,
          }}
        >
          Pick a profile to review suggestions.
        </p>
      )}

      {isProcessing && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.1)',
            backdropFilter: 'blur(1px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        />
      )}
    </Card>
  );
};

export default BaseSuggestionCard;
