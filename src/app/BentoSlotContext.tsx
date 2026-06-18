import { createContext, useContext } from "react";
import type {
  BentoStatTileConfig,
  BentoSortChipConfig,
  SortOrder,
} from "@/components/ui/BentoWorkspaceController";
import type { MagicToggleOption } from "@/components/ui/MagicToggle";

export interface BentoSlotConfig {
  stats: BentoStatTileConfig[];
  sorts: BentoSortChipConfig[];
  activeSortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  ariaLabel?: string;
  viewModes?: MagicToggleOption<string>[];
  activeViewMode?: string;
  onViewModeChange?: (mode: string) => void;
  viewModeAriaLabel?: string;
}

export interface BentoSlotContextValue {
  setConfig: (config: BentoSlotConfig | null) => void;
  searchPortalEl: HTMLDivElement | null;
}

export const BentoSlotContext = createContext<BentoSlotContextValue | null>(
  null,
);

export function useBentoSlot(): BentoSlotContextValue {
  const ctx = useContext(BentoSlotContext);
  if (!ctx)
    throw new Error("useBentoSlot must be used within AppWorkspaceShell");
  return ctx;
}
