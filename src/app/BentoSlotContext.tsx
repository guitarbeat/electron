import { createContext, useContext } from "react";
import type {
  BentoStatTileConfig,
  BentoSortChipConfig,
  SortOrder,
} from "@/components/ui/BentoWorkspaceController";

export interface BentoSlotConfig {
  stats: BentoStatTileConfig[];
  sorts: BentoSortChipConfig[];
  activeSortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  ariaLabel?: string;
}

export interface BentoSlotContextValue {
  config: BentoSlotConfig | null;
  setConfig: (config: BentoSlotConfig) => void;
  searchPortalEl: HTMLDivElement | null;
  setSearchPortalEl: (el: HTMLDivElement | null) => void;
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
