import { useEffect, useMemo } from "react";
import { useBentoSlot, type RegisteredBentoSlotConfig } from "@/app/BentoSlotContext";
import { useViewport } from "@/app/ViewportContext";
import type { MagicToggleOption } from "@/components/ui/MagicToggle";
import type { MainTab } from "@/shared/types";
import { useWorkspaceSectionSpy } from "@/hooks/useWorkspaceSectionSpy";
import { useWorkspaceSectionJumpShortcuts } from "@/hooks/useWorkspaceSectionJumpShortcuts";
import {
  buildWorkspaceStatTiles,
  type WorkspaceSectionAvailability,
  type WorkspaceSectionCounts,
  type WorkspaceSectionIds,
  workspaceTileSectionKey,
} from "@/utils/workspaceSectionLabels";

interface UseWorkspaceBentoConfigOptions<TSort extends string> {
  tab: MainTab;
  sectionIds: WorkspaceSectionIds;
  counts: WorkspaceSectionCounts;
  sortOrder: TSort;
  onSortChange: (order: TSort) => void;
  sorts: MagicToggleOption<TSort>[];
  mobileSorts: MagicToggleOption<TSort>[];
  ariaLabel: string;
  viewModes?: MagicToggleOption<string>[];
  activeViewMode?: string;
  onViewModeChange?: (mode: string) => void;
  viewModeAriaLabel?: string;
  /** Pause section spy while workspace content is still loading. */
  sectionSpyEnabled?: boolean;
  /** Show skeleton stat tiles instead of counts while data loads. */
  statsLoading?: boolean;
  /** Sections rendered in the DOM even when count is still zero (e.g. loading skeleton). */
  sectionAvailability?: WorkspaceSectionAvailability;
  /** Extra top inset for section spy when map chrome is visible (places). */
  sectionSpyTopInset?: string;
}

export function useWorkspaceBentoConfig<TSort extends string>({
  tab,
  sectionIds,
  counts,
  sortOrder,
  onSortChange,
  sorts,
  mobileSorts,
  ariaLabel,
  viewModes,
  activeViewMode,
  onViewModeChange,
  viewModeAriaLabel,
  sectionSpyEnabled = true,
  statsLoading = false,
  sectionAvailability,
  sectionSpyTopInset,
}: UseWorkspaceBentoConfigOptions<TSort>): void {
  const { isMobile } = useViewport();
  const { registerTabConfig } = useBentoSlot();

  const sectionIdList = useMemo(
    () => [sectionIds.incoming, sectionIds.queue, sectionIds.completed],
    [sectionIds.completed, sectionIds.incoming, sectionIds.queue],
  );

  const sectionSpyRefreshKey = [
    counts.incoming,
    counts.queue,
    counts.completed,
    sectionAvailability?.incoming,
    sectionAvailability?.queue,
    sectionAvailability?.completed,
  ].join(":");

  const activeSectionId = useWorkspaceSectionSpy(sectionIdList, {
    enabled: sectionSpyEnabled,
    refreshKey: sectionSpyRefreshKey,
    topInset: sectionSpyTopInset,
  });

  const stats = useMemo(
    () =>
      buildWorkspaceStatTiles({
        tab,
        isMobile,
        sectionIds,
        counts,
      }).map((tile, index) => {
        const sectionKey = workspaceTileSectionKey(tile.id);
        const isSectionAvailable = sectionAvailability?.[sectionKey] ?? false;
        const isDisabled = tile.count === 0 && !isSectionAvailable;

        return {
          ...tile,
          shortcutKey: String(index + 1),
          isActive: tile.sectionId === activeSectionId,
          isDisabled,
        };
      }),
    [
      activeSectionId,
      counts.completed,
      counts.incoming,
      counts.queue,
      isMobile,
      sectionAvailability?.completed,
      sectionAvailability?.incoming,
      sectionAvailability?.queue,
      sectionIds,
      tab,
    ],
  );

  const sectionJumpTargets = useMemo(
    () =>
      stats.map((tile) => ({
        sectionId: tile.sectionId,
        count: tile.count,
        isDisabled: tile.isDisabled,
      })),
    [stats],
  );

  useWorkspaceSectionJumpShortcuts(sectionJumpTargets, {
    enabled: sectionSpyEnabled && !statsLoading,
  });

  const config = useMemo(
    (): RegisteredBentoSlotConfig => ({
      stats,
      sorts: (isMobile ? mobileSorts : sorts) as MagicToggleOption<string>[],
      activeSortOrder: sortOrder,
      onSortChange: onSortChange as (order: string) => void,
      ariaLabel,
      viewModes,
      activeViewMode,
      onViewModeChange,
      viewModeAriaLabel,
      statsLoading,
    }),
    [
      activeViewMode,
      ariaLabel,
      isMobile,
      mobileSorts,
      onSortChange,
      onViewModeChange,
      sortOrder,
      sorts,
      stats,
      statsLoading,
      viewModeAriaLabel,
      viewModes,
    ],
  );

  useEffect(() => {
    registerTabConfig(tab, config);
  }, [config, registerTabConfig, tab]);
}
