import { useMediaQuery, mediaBreakpoints } from "./useMediaQuery";

/**
 * Hook to check if the viewport is below the mobile breakpoint (768px).
 * Uses useSyncExternalStore under the hood for hydration safety.
 */
export function useIsMobile(): boolean {
  return useMediaQuery(mediaBreakpoints.md);
}
