import { useEffect, useMemo } from "react";
import { useBentoSlot, type BentoSlotConfig } from "@/app/BentoSlotContext";
import type {
  BentoSortChipConfig,
  SortOrder,
} from "@/components/ui/BentoWorkspaceController";
import type { MagicToggleOption } from "@/components/ui/MagicToggle";
import {
  buildWorkspaceStatTiles,
  type WorkspaceSectionCounts,
  type WorkspaceSectionIds,
  type WorkspaceTab,
} from "@/utils/workspaceSectionLabels";

interface UseWorkspaceBentoConfigOptions {
  tab: WorkspaceTab;
  isMobile: boolean;
  sectionIds: WorkspaceSectionIds;
  counts: WorkspaceSectionCounts;
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  sorts: BentoSortChipConfig[];
  mobileSorts: BentoSortChipConfig[];
  ariaLabel: string;
  viewModes?: MagicToggleOption<string>[];
  activeViewMode?: string;
  onViewModeChange?: (mode: string) => void;
  viewModeAriaLabel?: string;
}

export function useWorkspaceBentoConfig({
  tab,
  isMobile,
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
}: UseWorkspaceBentoConfigOptions): void {
  const { setConfig } = useBentoSlot();

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

  const config = useMemo((): BentoSlotConfig => {
    const hasViewModes =
      Boolean(viewModes?.length) &&
      Boolean(activeViewMode) &&
      Boolean(onViewModeChange);

    return {
      stats,
      sorts: isMobile ? mobileSorts : sorts,
      activeSortOrder: sortOrder,
      onSortChange,
      ariaLabel,
      ...(hasViewModes
        ? {
            viewModes,
            activeViewMode,
            onViewModeChange,
            viewModeAriaLabel,
          }
        : {}),
    };
  }, [
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
  ]);

  useEffect(() => {
    setConfig(config);
  }, [config, setConfig]);
}
