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

/** Workspace shell is statically bundled in App.tsx for instant paint. */
export const preloadAppWorkspaceShell = (): Promise<unknown> =>
  Promise.resolve();

/**
 * Warm modules and critical API endpoints for first paint.
 * Preloads the workspace shell, active tab chunk, and initial session/movies state in parallel.
 */
export const preloadCriticalAppModules = (): Promise<void> => {
  if (criticalPreloadPromise) {
    return criticalPreloadPromise;
  }

  const tab = readInitialMainTab();
  const warmEndpoints = () => {
    if (typeof window === "undefined" || typeof fetch !== "function") {
      return Promise.resolve();
    }
    try {
      if (window.localStorage.getItem("useMockData") === "true") {
        return Promise.resolve();
      }
    } catch {
      // Ignore storage access errors
    }

    return Promise.allSettled([
      fetch("/api/session", {
        method: "GET",
        credentials: "include",
      }).catch(() => undefined),
      fetch(`/api/state/${tab === "messages" ? "messages" : "movies"}`, {
        method: "GET",
        credentials: "include",
      }).catch(() => undefined),
    ]);
  };

  criticalPreloadPromise = Promise.allSettled([
    preloadAppWorkspaceShell(),
    preloadWorkspaceTab(tab),
    warmEndpoints(),
  ]).then(() => undefined);
  return criticalPreloadPromise;
};
