import {
  SYNC_WARNING_CLIENT_NETWORK,
  SYNC_WARNING_OUTBOX,
} from '@/services/stateClient';

export interface SyncBannerContent {
  badge: string;
  title: string;
  description: string;
  debugHints: string[];
  accent: string;
  border: string;
  tone: 'polite' | 'assertive';
  occurredAt: string;
}

interface SyncBannerInput {
  isBlocked?: boolean;
  label?: string;
}

const buildDebugHints = ({ isBlocked, label }: SyncBannerInput): string[] => {
  if (isBlocked) {
    return [
      'Cause: remote sync conflict (local and shared edits diverged).',
      'Verify: reload the app and confirm both tabs show the latest shared state.',
      'Next step: retry sync after refresh.',
    ];
  }

  const text = label ?? '';

  if (text === SYNC_WARNING_OUTBOX || /waiting to sync to the server/i.test(text)) {
    return [
      'Cause: one or more changes are still queued for the server.',
      'Verify: stay online and use Retry sync, or wait for the next successful save.',
      'State: local edits are preserved until the queue clears.',
    ];
  }

  if (text === SYNC_WARNING_CLIENT_NETWORK || /Could not reach the app sync API/i.test(text)) {
    return [
      'Cause: this browser could not reach /api/state (dev server offline, wrong origin, or offline).',
      'Verify: run pnpm dev and open the app on the same origin; check the browser Network tab.',
      'State: showing cached local data until the API responds.',
    ];
  }

  if (/GIST_ID is not configured|missing GIST_ID|VITE_GIST_ID.*development/i.test(text)) {
    return [
      'Cause: shared backend is not configured.',
      'Verify: set GIST_ID (server) or VITE_GIST_ID (local Vite), then restart dev server.',
      'State: writes are currently local-only until config is fixed.',
    ];
  }

  if (
    /GITHUB_TOKEN|GitHub rejected|rate limit|HTTP (401|403|404|429)|cannot find the configured Gist|could not be (loaded|saved) from GitHub/i.test(
      text
    )
  ) {
    return [
      'Cause: GitHub API rejected the request, the Gist was not found, or rate limits applied.',
      'Verify: GITHUB_TOKEN has gist access; GIST_ID matches an existing Gist; retry after cooldown.',
      'State: writes may be local-only until GitHub accepts requests.',
    ];
  }

  if (/GitHub|Gist|gist\.github|shared state could not be loaded/i.test(text)) {
    return [
      'Cause: shared state uses a GitHub Gist.',
      'Verify: environment variables, server logs, and https://www.githubstatus.com.',
      'State: writes are local-only until Gist reads succeed.',
    ];
  }

  return [
    'Cause: shared state could not be synchronized.',
    'Verify: server logs, .env.local, and browser Network requests to /api/state.',
    'State: writes are currently local-only until sync recovers.',
  ];
};

const formatTimestamp = (): string => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const getSyncBannerContent = ({
  isBlocked,
  label,
}: SyncBannerInput): SyncBannerContent => {
  const occurredAt = formatTimestamp();

  if (isBlocked) {
    return {
      badge: 'Action needed',
      title: 'Sync conflict detected',
      description: label || 'Remote changes conflicted with local changes. Refresh and retry.',
      debugHints: buildDebugHints({ isBlocked, label }),
      accent: 'rgba(255, 189, 89, 0.16)',
      border: 'rgba(255, 189, 89, 0.45)',
      tone: 'assertive',
      occurredAt,
    };
  }

  return {
    badge: 'Error',
    title: 'Shared sync is unavailable',
    description: label || 'Changes are being kept locally until the shared state comes back.',
    debugHints: buildDebugHints({ isBlocked, label }),
    accent: 'rgba(255, 87, 87, 0.16)',
    border: 'rgba(255, 120, 120, 0.46)',
    tone: 'assertive',
    occurredAt,
  };
};
