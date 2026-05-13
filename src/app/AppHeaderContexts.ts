import { createContext } from 'react';

export interface AppHeaderSlotContextValue {
  centerNode: HTMLDivElement | null;
  setCenterNode: (node: HTMLDivElement | null) => void;
  hasSearch: boolean;
  setHasSearch: (v: boolean) => void;
}

export const AppHeaderSlotContext = createContext<AppHeaderSlotContextValue | null>(null);
