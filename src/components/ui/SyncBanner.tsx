import React from 'react';
import Button from './Button';
import { colors, radius, spacing, typography } from '@/design-system';

interface SyncBannerProps {
  isBlocked?: boolean;
  onRetry?: () => Promise<void> | void;
  label?: string;
}

const SyncBanner: React.FC<SyncBannerProps> = ({
  isBlocked = false,
  onRetry,
  label,
}) => (
  <div
    role="status"
    aria-live="polite"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: radius.md,
      background: isBlocked ? 'rgba(255, 189, 89, 0.16)' : 'rgba(111, 210, 255, 0.14)',
      border: `1px solid ${isBlocked ? 'rgba(255, 189, 89, 0.45)' : 'rgba(111, 210, 255, 0.35)'}`,
      color: colors.textPrimary,
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
      <strong style={{ fontSize: typography.fontSize.sm }}>
        {isBlocked ? 'Sync needs attention' : 'Sync is degraded'}
      </strong>
      <span style={{ fontSize: typography.fontSize.xs, color: colors.textSecondary }}>
        {label ||
          (isBlocked
            ? 'Remote changes conflicted with local changes. Refresh and retry.'
            : 'Changes are being kept locally until the shared state comes back.')}
      </span>
    </div>
    {onRetry ? (
      <Button size="sm" variant={isBlocked ? 'secondary' : 'ghost'} onClick={() => void onRetry()}>
        Retry
      </Button>
    ) : null}
  </div>
);

export default SyncBanner;
