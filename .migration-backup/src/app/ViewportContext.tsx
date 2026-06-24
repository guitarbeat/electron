/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useMemo,
  type FC,
  type ReactNode,
} from "react";
import { mediaBreakpoints, useMediaQuery } from "@/hooks/useMediaQuery";

interface ViewportContextValue {
  isMobile: boolean;
}

const ViewportContext = createContext<ViewportContextValue | null>(null);

export const ViewportProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const value = useMemo(() => ({ isMobile }), [isMobile]);

  return (
    <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>
  );
};

export function useViewport(): ViewportContextValue {
  const ctx = useContext(ViewportContext);
  if (!ctx) {
    throw new Error("useViewport must be used within ViewportProvider");
  }
  return ctx;
}
