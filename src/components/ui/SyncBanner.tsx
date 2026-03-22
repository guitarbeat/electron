import React from 'react';
import Button from './Button';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import { getSyncBannerContent } from './syncBannerContent';

interface SyncBannerProps {
  isBlocked?: boolean;
  onRetry?: () => Promise<void> | void;
  label?: string;
}

const SyncBanner: React.FC<SyncBannerProps> = ({
  isBlocked = false,
  onRetry,
  label,
}) => {
  const content = getSyncBannerContent({ isBlocked, label });

  return (
    <div
      role={isBlocked ? 'alert' : 'status'}
      aria-live={content.tone}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
        flexWrap: 'wrap',
        padding: `${spacing.sm} ${spacing.md}`,
        borderRadius: radius.md,
        background: content.accent,
        border: `1px solid ${content.border}`,
        color: colors.textPrimary,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, minWidth: 0 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            width: 'fit-content',
            padding: '0.2rem 0.5rem',
            borderRadius: 999,
            border: `1px solid ${content.border}`,
            background: 'rgba(255, 255, 255, 0.06)',
            color: colors.textPrimary,
            fontSize: typography.fontSize.xs,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {content.badge}
        </span>
        <strong style={{ fontSize: typography.fontSize.sm }}>
          {content.title}
        </strong>
        <span style={{ fontSize: typography.fontSize.xs, color: colors.textSecondary }}>
          {content.description}
        </span>
      </div>
      {onRetry ? (
        <Button size="sm" variant={isBlocked ? 'secondary' : 'ghost'} onClick={() => void onRetry()}>
          Retry sync
        </Button>
      ) : null}
    </div>
  );
};

export default SyncBanner;
