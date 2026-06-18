import { useEffect, useMemo } from "react";
import { useBentoSlot, type RegisteredBentoSlotConfig } from "@/app/BentoSlotContext";
import { useViewport } from "@/app/ViewportContext";
import type { MagicToggleOption } from "@/components/ui/MagicToggle";
import type { MainTab } from "@/shared/types";
import {
  buildWorkspaceStatTiles,
  type WorkspaceSectionCounts,
  type WorkspaceSectionIds,
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
}: UseWorkspaceBentoConfigOptions<TSort>): void {
  const { isMobile } = useViewport();
  const { registerTabConfig } = useBentoSlot();

  const stats = useMemo(
    () =>
      buildWorkspaceStatTiles({
        tab,
        isMobile,
        sectionIds,
        counts,
      }),
    [
      tab,
      isMobile,
      sectionIds,
      counts.incoming,
      counts.queue,
      counts.completed,
    ],
  );

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
      viewModeAriaLabel,
      viewModes,
    ],
  );

  useEffect(() => {
    registerTabConfig(tab, config);
  }, [config, registerTabConfig, tab]);
}
