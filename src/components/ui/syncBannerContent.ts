export interface SyncBannerContent {
  badge: string;
  title: string;
  description: string;
  debugHints: string[];
  accent: string;
  border: string;
  tone: 'polite' | 'assertive';
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

  if (label && /GIST_ID|VITE_GIST_ID/i.test(label)) {
    return [
      'Cause: shared backend is not configured.',
      'Verify: set GIST_ID (server) or VITE_GIST_ID (local Vite), then restart dev server.',
      'State: writes are currently local-only until config is fixed.',
    ];
  }

  return [
    'Cause: temporary shared-sync outage or connectivity issue.',
    'Verify: network reachability and shared state endpoint health.',
    'State: writes are currently local-only until sync recovers.',
  ];
};

export const getSyncBannerContent = ({
  isBlocked,
  label,
}: SyncBannerInput): SyncBannerContent => {
  if (isBlocked) {
    return {
      badge: 'Action needed',
      title: 'Sync conflict detected',
      description: label || 'Remote changes conflicted with local changes. Refresh and retry.',
      debugHints: buildDebugHints({ isBlocked, label }),
      accent: 'rgba(255, 189, 89, 0.16)',
      border: 'rgba(255, 189, 89, 0.45)',
      tone: 'assertive',
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
  };
};
