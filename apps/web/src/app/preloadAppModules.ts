import { readInitialMainTab } from "@/app/appViewState";
import type { MainTab } from "@/shared/types";

let criticalPreloadPromise: Promise<void> | null = null;

/** Warm the active workspace tab chunk. */
export const preloadWorkspaceTab = (tab: MainTab): Promise<unknown> => {
  switch (tab) {
    case "messages":
      return import("@/components/messages");
    case "movies":
      return import("@/components/movies");
    case "places":
      return import("@/components/places");
    default:
      return Promise.resolve();
  }
};

/** Warm the workspace shell chunk (header + bento layout). */
export const preloadAppWorkspaceShell = (): Promise<unknown> =>
  import("@/app/AppWorkspaceShell");

/**
 * Warm modules for first paint. Only the workspace shell blocks readiness;
 * the active tab chunk loads in parallel via Suspense.
 */
export const preloadCriticalAppModules = (): Promise<void> => {
  if (criticalPreloadPromise) {
    return criticalPreloadPromise;
  }

  const tab = readInitialMainTab();
  criticalPreloadPromise = Promise.allSettled([
    preloadAppWorkspaceShell(),
    preloadWorkspaceTab(tab),
  ]).then(() => undefined);
  return criticalPreloadPromise;
};
