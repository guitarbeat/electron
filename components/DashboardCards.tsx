import React from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { spacing, typography, colors, shadows, radius } from '../design-system/tokens';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';
import { DiceIcon, TicketIcon, CheckIcon, TrashIcon } from './icons';
import { User, MovieSuggestion } from '../types';

interface DashboardItemProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  actionLabel?: string;
}

export const DashboardCard: React.FC<DashboardItemProps> = ({
  title,
  icon,
  description,
  onClick,
  variant = 'primary',
  actionLabel = 'Go',
}) => {
  const isMobile = useMediaQuery(breakpoints.sm);
  const getGradient = () => {
    switch (variant) {
      case 'accent':
        return colors.gradientPink;
      case 'secondary':
        return colors.gradientBlue;
      default:
        return 'linear-gradient(135deg, rgba(27, 40, 69, 0.8) 0%, rgba(13, 20, 38, 0.9) 100%)';
    }
  };

  const gradient = getGradient();

  return (
    <Card
      onClick={onClick}
      style={{
        padding: isMobile ? spacing.md : spacing.lg,
        height: '100%',
        minHeight: isMobile ? '180px' : '240px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        background: gradient,
        border: `1px solid ${colors.borderSecondary}40`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className="dashboard-card-hover"
    >
      <div
        style={{
          marginBottom: spacing.md,
          color: variant === 'accent' ? colors.textPrimary : colors.accent,
          filter: shadows.glow ? shadows.glow : 'none',
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.bold,
          color: colors.textPrimary,
          margin: 0,
          marginBottom: spacing.sm,
          whiteSpace: 'normal',
          wordBreak: 'normal',
          overflowWrap: 'break-word',
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.textSecondary,
            margin: 0,
            marginBottom: spacing.lg,
            lineHeight: 1.4,
            whiteSpace: 'normal',
            wordBreak: 'normal',
            overflowWrap: 'break-word',
          }}
        >
          {description}
        </p>
      )}

      {onClick && (
        <Button
          variant={variant === 'accent' ? 'secondary' : 'primary'}
          size="md"
          style={{
            marginTop: 'auto',
            width: '100%',
            fontWeight: typography.fontWeight.bold,
            letterSpacing: '0.05em',
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Card>
  );
};

interface SuggestionItemCardProps {
  suggestion: MovieSuggestion;
  onAccept: (suggestion: MovieSuggestion) => void;
  onReject: (suggestion: MovieSuggestion) => void;
  isProcessing: boolean;
}

export const SuggestionItemCard: React.FC<SuggestionItemCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  isProcessing,
}) => {
  const isMobile = useMediaQuery(breakpoints.sm);
  return (
    <Card
      style={{
        padding: isMobile ? spacing.sm : spacing.md,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(27, 40, 69, 0.4)',
        border: `1px solid ${colors.borderSecondary}20`,
        position: 'relative',
        overflow: 'hidden',
        minHeight: isMobile ? '160px' : '180px',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}
      >
        <div
          style={{
            padding: '6px',
            borderRadius: radius.full,
            backgroundColor: colors.accent + '20',
            color: colors.accent,
          }}
        >
          <TicketIcon style={{ width: '16px', height: '16px' }} />
        </div>
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: typography.fontWeight.bold,
            color: colors.textTertiary,
            textTransform: 'uppercase',
          }}
        >
          Suggestion
        </span>
      </div>

      <h3
        style={{
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.bold,
          color: colors.textPrimary,
          margin: 0,
          marginBottom: spacing.xs,
          lineHeight: 1.2,
          whiteSpace: 'normal',
          wordBreak: 'normal',
          overflowWrap: 'break-word',
        }}
      >
        {suggestion.title}
      </h3>

      <p
        style={{
          fontSize: typography.fontSize.xs,
          color: colors.textSecondary,
          margin: 0,
          marginBottom: spacing.sm,
        }}
      >
        By <span style={{ color: colors.accent }}>{suggestion.suggestedBy}</span>
      </p>

      {suggestion.reason && (
        <p
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.textTertiary,
            fontStyle: 'italic',
            lineHeight: 1.4,
            margin: 0,
            marginBottom: spacing.md,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          "{suggestion.reason}"
        </p>
      )}

      <div style={{ display: 'flex', gap: spacing.sm, marginTop: 'auto' }}>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onAccept(suggestion)}
          disabled={isProcessing}
          isLoading={isProcessing}
          style={{
            flex: 1,
            backgroundColor: colors.success,
            fontSize: '11px',
            fontWeight: typography.fontWeight.bold,
            height: '32px',
            padding: 0,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <CheckIcon style={{ width: '14px', marginRight: '4px' }} />
          Accept
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onReject(suggestion)}
          disabled={isProcessing}
          style={{
            flex: 1,
            fontSize: '11px',
            height: '32px',
            padding: 0,
            opacity: 0.8,
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <TrashIcon style={{ width: '14px', marginRight: '4px' }} />
          Reject
        </Button>
      </div>
    </Card>
  );
};
