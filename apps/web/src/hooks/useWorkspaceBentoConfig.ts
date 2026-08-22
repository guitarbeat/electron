import { useEffect, useMemo } from "react";
import { useBentoSlot, type RegisteredBentoSlotConfig } from "@/app/BentoSlotContext";
import type { MagicToggleOption } from "@/components/ui/MagicToggle";
import type { MainTab } from "@/shared/types";

interface UseWorkspaceBentoConfigOptions {
  tab: MainTab;
  ariaLabel: string;
  viewModes?: MagicToggleOption<string>[];
  activeViewMode?: string;
  onViewModeChange?: (mode: string) => void;
  viewModeAriaLabel?: string;
}

export function useWorkspaceBentoConfig({
  tab,
  ariaLabel,
  viewModes,
  activeViewMode,
  onViewModeChange,
  viewModeAriaLabel,
}: UseWorkspaceBentoConfigOptions): void {
  const { registerTabConfig } = useBentoSlot();

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
