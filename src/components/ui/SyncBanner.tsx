import React, { useCallback, useEffect, useState } from 'react';
import Button from './LegacyButton';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import { getSyncBannerContent, shouldShowSyncBanner } from './lib/syncBannerContent';
import { isMockMode } from '@/services/state';

interface SyncBannerProps {
  isBlocked?: boolean;
  onRetry?: () => Promise<void> | void;
  label?: string;
}

const formatSyncBannerTimestamp = (): string =>
  new Date().toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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

  const incidentKey = `${isBlocked}::${label ?? ""}`;
  const content = getSyncBannerContent({ isBlocked, label });
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(isBlocked);

  useEffect(() => {
    setShowDetails(isBlocked);
  }, [isBlocked, incidentKey]);

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

  if (isInMockMode || !shouldShowSyncBanner({ isBlocked, label })) {
    return null;
  }

  const isAssertive = content.tone === "assertive";
  const surfaceColor = isAssertive
    ? "color-mix(in srgb, var(--color-error) 10%, transparent)"
    : content.accent;
  const borderColor = isAssertive
    ? "color-mix(in srgb, var(--color-error) 28%, transparent)"
    : content.border;
  const badgeColor = isAssertive
    ? "color-mix(in srgb, var(--color-error) 72%, white 28%)"
    : "color-mix(in srgb, var(--color-text-primary) 88%, white 12%)";
  const timestampColor = isAssertive
    ? "color-mix(in srgb, var(--color-error) 45%, var(--color-text-secondary) 55%)"
    : colors.textSecondary;
  const detailsColor = isAssertive
    ? "color-mix(in srgb, var(--color-error) 55%, var(--color-text-primary) 45%)"
    : colors.textSecondary;

  const summary = label?.trim() || content.description;

  return (
    <div
      role={content.tone === "assertive" ? "alert" : "status"}
      aria-live={content.tone}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: spacing.xs,
        padding: `${spacing.sm} ${spacing.md}`,
        borderRadius: radius.md,
        background: surfaceColor,
        border: `1px solid ${borderColor}`,
        color: colors.textPrimary,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: spacing.sm,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 12rem", minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing.sm,
              flexWrap: "wrap",
              marginBottom: spacing.xs,
            }}
          >
            <span
              style={{
                fontSize: typography.fontSize.xs,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: badgeColor,
              }}
            >
              {content.badge}
            </span>
            <span
              style={{
                fontSize: typography.fontSize.xs,
                color: timestampColor,
              }}
            >
              <IncidentTimestamp key={incidentKey} />
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: typography.fontSize.sm,
              lineHeight: 1.45,
              color: colors.textPrimary,
            }}
          >
            {summary}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.xs,
            flexWrap: "wrap",
            marginLeft: "auto",
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDetails((open) => !open)}
            aria-expanded={showDetails}
          >
            {showDetails ? "Hide details" : "Details"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void handleCopy()}>
            {copied ? "Copied!" : "Copy"}
          </Button>
          {onRetry ? (
            <Button size="sm" variant="ghost" onClick={() => void onRetry()}>
              Retry
            </Button>
          ) : null}
        </div>
      </div>

      {showDetails ? (
        <pre
          style={{
            margin: 0,
            padding: "0.5rem 0.6rem",
            borderRadius: radius.sm,
            background: "rgba(0,0,0,0.25)",
            fontSize: "0.7rem",
            lineHeight: 1.6,
            color: detailsColor,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            userSelect: "text",
            cursor: "text",
            fontFamily: "monospace",
          }}
        >
          {content.copyPayload}
        </pre>
      ) : null}
    </div>
  );
};

export default SyncBanner;
