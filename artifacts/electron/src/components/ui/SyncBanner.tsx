import React, { useCallback, useEffect, useState } from 'react';
import Button from './LegacyButton';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import { getSyncBannerContent } from './lib/syncBannerContent';
import { isMockMode } from '@/services/state';

interface SyncBannerProps {
  isBlocked?: boolean;
  onRetry?: () => Promise<void> | void;
  label?: string;
}

const formatSyncBannerTimestamp = (): string =>
  new Date().toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const IncidentTimestamp: React.FC = () => {
  const [stableTimestamp] = useState(formatSyncBannerTimestamp);
  return <>{stableTimestamp}</>;
};

const SyncBanner: React.FC<SyncBannerProps> = ({
  isBlocked = false,
  onRetry,
  label,
}) => {
  const isInMockMode = isMockMode();

  const incidentKey = `${isBlocked}::${label ?? ''}`;
  const content = getSyncBannerContent({ isBlocked, label });
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content.copyPayload);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [content.copyPayload]);

  useEffect(() => {
    if (!copied) return undefined;
    const id = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  if (isInMockMode) {
    return null;
  }

  return (
    <div
      role={content.tone === 'assertive' ? 'alert' : 'status'}
      aria-live={content.tone}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs,
        padding: `${spacing.sm} ${spacing.md}`,
        borderRadius: radius.md,
        background: 'rgba(255, 87, 87, 0.08)',
        border: `1px solid rgba(255, 120, 120, 0.3)`,
        color: colors.textPrimary,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: typography.fontSize.xs,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#ffb3b3',
        }}>
          {content.badge}
        </span>
        <span style={{ fontSize: typography.fontSize.xs, color: 'rgba(255,200,200,0.6)', marginRight: 'auto' }}>
          <IncidentTimestamp key={incidentKey} />
        </span>
        <Button size="sm" variant="ghost" onClick={() => void handleCopy()}>
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        {onRetry ? (
          <Button size="sm" variant="ghost" onClick={() => void onRetry()}>
            Retry
          </Button>
        ) : null}
      </div>

      {/* Copy-ready text block */}
      <pre
        style={{
          margin: 0,
          padding: '0.5rem 0.6rem',
          borderRadius: radius.sm,
          background: 'rgba(0,0,0,0.25)',
          fontSize: '0.7rem',
          lineHeight: 1.6,
          color: 'rgba(255,220,220,0.85)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          userSelect: 'text',
          cursor: 'text',
          fontFamily: 'monospace',
        }}
      >
        {content.copyPayload}
      </pre>
    </div>
  );
};

export default SyncBanner;
