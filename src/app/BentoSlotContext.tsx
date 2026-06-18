import { createContext, useContext } from "react";
import type { BentoStatTileConfig } from "@/components/ui/StatTile";
import type { MagicToggleOption } from "@/components/ui/MagicToggle";
import type { MainTab } from "@/shared/types";

export interface BentoSlotConfig<TSort extends string = string> {
  stats: BentoStatTileConfig[];
  statsLoading?: boolean;
  sorts: MagicToggleOption<TSort>[];
  activeSortOrder: TSort;
  onSortChange: (order: TSort) => void;
  ariaLabel?: string;
  viewModes?: MagicToggleOption<string>[];
  activeViewMode?: string;
  onViewModeChange?: (mode: string) => void;
  viewModeAriaLabel?: string;
}

export type RegisteredBentoSlotConfig = BentoSlotConfig<string>;

export interface BentoSlotContextValue {
  activeTab: MainTab;
  registerTabConfig: (tab: MainTab, config: RegisteredBentoSlotConfig) => void;
  searchPortalEl: HTMLDivElement | null;
}

export const BentoSlotContext = createContext<BentoSlotContextValue | null>(
  null,
);

export function useBentoSlot(): BentoSlotContextValue {
  const ctx = useContext(BentoSlotContext);
  if (!ctx) {
    throw new Error("useBentoSlot must be used within AppWorkspaceShell");
  }
  return ctx;
}
