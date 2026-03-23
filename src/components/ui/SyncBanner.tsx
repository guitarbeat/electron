import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const prevKeyRef = useRef('');
  const stableTimestampRef = useRef('');
  const incidentKey = `${isBlocked}::${label ?? ''}`;
  if (incidentKey !== prevKeyRef.current) {
    prevKeyRef.current = incidentKey;
    stableTimestampRef.current = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  const content = { ...getSyncBannerContent({ isBlocked, label }), occurredAt: stableTimestampRef.current };
  const [copied, setCopied] = useState(false);

  const handleCopyDebugInfo = useCallback(async () => {
    const payload = [
      `Sync banner: ${content.title}`,
      `Occurred at: ${content.occurredAt}`,
      `Description: ${content.description}`,
      ...content.debugHints.map((hint) => `- ${hint}`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [content.debugHints, content.description, content.title, content.occurredAt]);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  return (
    <div
      role={content.tone === 'assertive' ? 'alert' : 'status'}
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
        boxShadow:
          content.tone === 'assertive'
            ? '0 0 0 1px rgba(255, 120, 120, 0.25), 0 8px 24px rgba(255, 87, 87, 0.15)'
            : undefined,
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
            background:
              content.tone === 'assertive' ? 'rgba(255, 87, 87, 0.22)' : 'rgba(255, 255, 255, 0.06)',
            color: content.tone === 'assertive' ? '#ffd9d9' : colors.textPrimary,
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
          <span
            style={{
              fontWeight: 400,
              fontSize: typography.fontSize.xs,
              color: content.tone === 'assertive' ? '#ffd3d3' : colors.textSecondary,
              marginLeft: spacing.xs,
            }}
          >
            at {content.occurredAt}
          </span>
        </strong>
        <span
          style={{
            fontSize: typography.fontSize.xs,
            color: content.tone === 'assertive' ? '#ffd3d3' : colors.textSecondary,
          }}
        >
          {content.description}
        </span>
        {content.debugHints.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            <strong
              style={{
                fontSize: typography.fontSize.xs,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: content.tone === 'assertive' ? '#ffdede' : colors.textSecondary,
              }}
            >
              Debug details
            </strong>
            <ul
              style={{
                margin: 0,
                paddingLeft: '1.1rem',
                display: 'grid',
                gap: '0.2rem',
                fontSize: typography.fontSize.xs,
                color: content.tone === 'assertive' ? '#ffd3d3' : colors.textSecondary,
              }}
            >
              {content.debugHints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.xs }}>
        <Button size="sm" variant="ghost" onClick={() => void handleCopyDebugInfo()}>
          {copied ? 'Copied' : 'Copy debug info'}
        </Button>
        {onRetry ? (
          <Button size="sm" variant={isBlocked ? 'secondary' : 'ghost'} onClick={() => void onRetry()}>
            Retry sync
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default SyncBanner;
