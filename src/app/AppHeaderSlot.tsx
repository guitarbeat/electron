/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

interface AppHeaderSlotContextValue {
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

export function AppHeaderSlotProvider({ children }: { children: ReactNode }) {
  const [centerNode, setCenterNode] = useState<HTMLDivElement | null>(null);
  const [hasSearch, setHasSearch] = useState(false);
  return (
    <AppHeaderSlotContext.Provider
      value={{ centerNode, setCenterNode, hasSearch, setHasSearch }}
    >
      {children}
    </AppHeaderSlotContext.Provider>
  );
}
