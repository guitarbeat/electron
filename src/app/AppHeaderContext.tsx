import { createContext, useContext } from "react";

export interface AppHeaderSlotContextValue {
  centerNode: HTMLDivElement | null;
  setCenterNode: (node: HTMLDivElement | null) => void;
  hasSearch: boolean;
  setHasSearch: (v: boolean) => void;
}

export const AppHeaderSlotContext =
  createContext<AppHeaderSlotContextValue | null>(null);

export function useAppHeaderSlot() {
  return useContext(AppHeaderSlotContext);
}
