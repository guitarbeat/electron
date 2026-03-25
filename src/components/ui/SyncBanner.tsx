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
  const stableDateRef = useRef('');
  const incidentKey = `${isBlocked}::${label ?? ''}`;
  if (incidentKey !== prevKeyRef.current) {
    prevKeyRef.current = incidentKey;
    const now = new Date();
    stableTimestampRef.current = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    stableDateRef.current = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }
  const content = { ...getSyncBannerContent({ isBlocked, label }), occurredAt: stableTimestampRef.current };
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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

  const dimText = content.tone === 'assertive' ? 'rgba(255,220,220,0.75)' : colors.textSecondary;

  return (
    <div
      role={content.tone === 'assertive' ? 'alert' : 'status'}
      aria-live={content.tone}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        padding: `${spacing.sm} ${spacing.md}`,
        borderRadius: radius.md,
        background: content.accent,
        border: `1px solid ${content.border}`,
        color: colors.textPrimary,
        boxShadow:
          content.tone === 'assertive'
            ? '0 0 0 1px rgba(255, 120, 120, 0.2), 0 8px 24px rgba(255, 87, 87, 0.12)'
            : undefined,
      }}
    >
      {/* ── Top row: badge + timestamp + actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.15rem 0.5rem',
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
        <span
          style={{
            fontSize: typography.fontSize.xs,
            color: dimText,
            marginRight: 'auto',
          }}
        >
          since {stableDateRef.current} at {content.occurredAt}
        </span>
        {onRetry ? (
          <Button size="sm" variant={isBlocked ? 'secondary' : 'ghost'} onClick={() => void onRetry()}>
            Retry sync
          </Button>
        ) : null}
      </div>

      {/* ── Main message ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <strong style={{ fontSize: typography.fontSize.sm }}>{content.title}</strong>
        <span style={{ fontSize: typography.fontSize.xs, color: dimText }}>
          {content.description}
        </span>
        {label ? (
          <span
            style={{
              fontSize: typography.fontSize.xs,
              color: dimText,
              fontFamily: 'monospace',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: radius.sm,
              padding: '0.25rem 0.5rem',
              marginTop: '0.1rem',
              wordBreak: 'break-word',
            }}
          >
            {label}
          </span>
        ) : null}
      </div>

      {/* ── What it means / what to do ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: spacing.sm,
        }}
      >
        <div
          style={{
            padding: '0.4rem 0.6rem',
            borderRadius: radius.sm,
            background: 'rgba(0,0,0,0.15)',
            fontSize: typography.fontSize.xs,
            color: dimText,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '0.2rem', color: colors.textPrimary }}>
            What this means
          </div>
          {content.whatItMeans}
        </div>
        <div
          style={{
            padding: '0.4rem 0.6rem',
            borderRadius: radius.sm,
            background: 'rgba(0,0,0,0.15)',
            fontSize: typography.fontSize.xs,
            color: dimText,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '0.2rem', color: colors.textPrimary }}>
            What to do
          </div>
          {content.whatToDo}
        </div>
      </div>

      {/* ── Collapsible technical details ── */}
      {content.debugHints.length > 0 ? (
        <div>
          <button
            onClick={() => setShowDetails((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: dimText,
              fontSize: typography.fontSize.xs,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              letterSpacing: '0.03em',
            }}
          >
            <span style={{ fontSize: '0.6rem' }}>{showDetails ? '▼' : '▶'}</span>
            {showDetails ? 'Hide' : 'Show'} technical details
          </button>
          {showDetails ? (
            <div style={{ marginTop: spacing.xs }}>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.1rem',
                  display: 'grid',
                  gap: '0.2rem',
                  fontSize: typography.fontSize.xs,
                  color: dimText,
                }}
              >
                {content.debugHints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
              <div style={{ marginTop: spacing.xs }}>
                <Button size="sm" variant="ghost" onClick={() => void handleCopyDebugInfo()}>
                  {copied ? 'Copied!' : 'Copy details'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default SyncBanner;
