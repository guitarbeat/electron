import { useEffect, useMemo } from "react";
import { useBentoSlot, type RegisteredBentoSlotConfig } from "@/app/BentoSlotContext";
import type { MagicToggleOption } from "@/components/ui/MagicToggle";
import type { MainTab } from "@/shared/types";
import { useWorkspaceSectionJumpShortcuts } from "@/hooks/useWorkspaceSectionJumpShortcuts";
import {
  type WorkspaceSectionAvailability,
  type WorkspaceSectionCounts,
  type WorkspaceSectionIds,
  type WorkspaceSectionKey,
} from "@/utils/workspaceConfig";

const SECTION_KEYS: WorkspaceSectionKey[] = ["incoming", "queue", "completed"];

interface UseWorkspaceBentoConfigOptions {
  tab: MainTab;
  sectionIds: WorkspaceSectionIds;
  counts: WorkspaceSectionCounts;
  ariaLabel: string;
  viewModes?: MagicToggleOption<string>[];
  activeViewMode?: string;
  onViewModeChange?: (mode: string) => void;
  viewModeAriaLabel?: string;
  /** Enable 1–3 section jump shortcuts once workspace content is ready. */
  sectionShortcutsEnabled?: boolean;
  /** Sections rendered in the DOM even when count is still zero (e.g. loading skeleton). */
  sectionAvailability?: WorkspaceSectionAvailability;
}

export function useWorkspaceBentoConfig({
  tab,
  sectionIds,
  counts,
  ariaLabel,
  viewModes,
  activeViewMode,
  onViewModeChange,
  viewModeAriaLabel,
  sectionShortcutsEnabled = true,
  sectionAvailability,
}: UseWorkspaceBentoConfigOptions): void {
  const { registerTabConfig } = useBentoSlot();

  const sectionJumpTargets = useMemo(
    () =>
      SECTION_KEYS.map((section) => {
        const count = counts[section];
        const isSectionAvailable = sectionAvailability?.[section] ?? false;

        return {
          sectionId: sectionIds[section],
          count,
          isDisabled: count === 0 && !isSectionAvailable,
        };
      }),
    [
      counts.completed,
      counts.incoming,
      counts.queue,
      sectionAvailability?.completed,
      sectionAvailability?.incoming,
      sectionAvailability?.queue,
      sectionIds.completed,
      sectionIds.incoming,
      sectionIds.queue,
    ],
  );

  useWorkspaceSectionJumpShortcuts(sectionJumpTargets, {
    enabled: sectionShortcutsEnabled,
  });

  const config = useMemo(
    (): RegisteredBentoSlotConfig => ({
      ariaLabel,
      viewModes,
      activeViewMode,
      onViewModeChange,
      viewModeAriaLabel,
    }),
    [
      activeViewMode,
      ariaLabel,
      onViewModeChange,
      viewModeAriaLabel,
      viewModes,
    ],
  );

  useEffect(() => {
    registerTabConfig(tab, config);
  }, [config, registerTabConfig, tab]);
}
