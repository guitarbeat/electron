import { useCallback, useMemo } from "react";

interface SyncSource {
  isDegraded: boolean;
  isSyncBlocked: boolean;
  syncWarning?: string | null;
  retrySync: () => void | Promise<unknown>;
}

interface UseWorkspaceSyncBannerOptions {
  sources: SyncSource[];
  blockedLabels: string[];
  degradedLabels: string[];
  defaultDegradedLabel: string;
  combinedBlockedLabel?: string;
  combinedDegradedLabel?: string;
}

interface UseWorkspaceSyncBannerResult {
  isDegraded: boolean;
  isBlocked: boolean;
  label: string;
  onRetry: () => void;
}

export function useWorkspaceSyncBanner({
  sources,
  blockedLabels,
  degradedLabels,
  defaultDegradedLabel,
  combinedBlockedLabel,
  combinedDegradedLabel,
}: UseWorkspaceSyncBannerOptions): UseWorkspaceSyncBannerResult {
  const isDegraded = sources.some((source) => source.isDegraded);
  const isBlocked = sources.some((source) => source.isSyncBlocked);

  const label = useMemo(() => {
    const blockedSources = sources.filter((source) => source.isSyncBlocked);
    if (blockedSources.length > 1 && combinedBlockedLabel) {
      return combinedBlockedLabel;
    }
    if (blockedSources.length === 1) {
      const index = sources.indexOf(blockedSources[0]!);
      return (
        blockedSources[0]?.syncWarning ??
        blockedLabels[index] ??
        defaultDegradedLabel
      );
    }

    const degradedSources = sources.filter((source) => source.isDegraded);
    if (degradedSources.length > 1 && combinedDegradedLabel) {
      return combinedDegradedLabel;
    }
    if (degradedSources.length === 1) {
      const index = sources.indexOf(degradedSources[0]!);
      return (
        degradedSources[0]?.syncWarning ??
        degradedLabels[index] ??
        defaultDegradedLabel
      );
    }

    return defaultDegradedLabel;
  }, [
    blockedLabels,
    combinedBlockedLabel,
    combinedDegradedLabel,
    defaultDegradedLabel,
    degradedLabels,
    sources,
  ]);

  const onRetry = useCallback(() => {
    for (const source of sources) {
      if (source.isDegraded || source.isSyncBlocked) {
        void source.retrySync();
      }
    }
  }, [sources]);

  return { isDegraded, isBlocked, label, onRetry };
}
