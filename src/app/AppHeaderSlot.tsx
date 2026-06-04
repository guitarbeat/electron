import { useState, type ReactNode } from 'react';
import { AppHeaderSlotContext } from './AppHeaderContext.tsx';

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
