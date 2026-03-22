export interface SyncBannerContent {
  badge: string;
  title: string;
  description: string;
  accent: string;
  border: string;
  tone: 'polite' | 'assertive';
}

interface SyncBannerInput {
  isBlocked?: boolean;
  label?: string;
}

export const getSyncBannerContent = ({
  isBlocked,
  label,
}: SyncBannerInput): SyncBannerContent => {
  if (isBlocked) {
    return {
      badge: 'Action needed',
      title: 'Sync conflict detected',
      description: label || 'Remote changes conflicted with local changes. Refresh and retry.',
      accent: 'rgba(255, 189, 89, 0.16)',
      border: 'rgba(255, 189, 89, 0.45)',
      tone: 'assertive',
    };
  }

  return {
    badge: 'Local only',
    title: 'Shared sync is temporarily unavailable',
    description: label || 'Changes are being kept locally until the shared state comes back.',
    accent: 'rgba(111, 210, 255, 0.14)',
    border: 'rgba(111, 210, 255, 0.35)',
    tone: 'polite',
  };
};
