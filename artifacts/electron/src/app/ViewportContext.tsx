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
  isTv: boolean;
  isSilkBrowser: boolean;
}

const ViewportContext = createContext<ViewportContextValue | null>(null);

export const ViewportProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);

  const isSilkBrowser = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /Silk|Kindle|FireTV|AFTS|AFTB|AmazonWebAppPlatform/i.test(navigator.userAgent);
  }, []);

  const isTv = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return isSilkBrowser || /tv|smarttv|googletv|appletv|firetv|hbbtv/i.test(navigator.userAgent);
  }, [isSilkBrowser]);

  useMemo(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (isTv) {
      root.classList.add("is-tv-runtime");
    } else {
      root.classList.remove("is-tv-runtime");
    }

    if (isSilkBrowser) {
      root.classList.add("is-silk-browser");
    } else {
      root.classList.remove("is-silk-browser");
    }
  }, [isTv, isSilkBrowser]);

  const value = useMemo(
    () => ({ isMobile, isTv, isSilkBrowser }),
    [isMobile, isTv, isSilkBrowser]
  );

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
