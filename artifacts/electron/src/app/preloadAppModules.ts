import { readInitialMainTab } from "@/app/appViewState";
import type { MainTab } from "@/shared/types";
import { scheduleIdleWork } from "@/utils/scheduleIdleWork";

let criticalPreloadPromise: Promise<void> | null = null;
let deferredPreloadPromise: Promise<void> | null = null;

const staggerPreloads = (
  modules: ReadonlyArray<() => Promise<unknown>>,
): Promise<void> =>
  new Promise((resolve) => {
    let index = 0;

    const loadNext = () => {
      if (index >= modules.length) {
        resolve();
        return;
      }

      const load = modules[index];
      index += 1;
      void Promise.resolve(load()).finally(() => {
        // Minimal delay between chunks — just yield to main thread
        scheduleIdleWork(loadNext, 50);
      });
    };

    // Start immediately
    scheduleIdleWork(loadNext, 0);
  });

/** Warm the active workspace tab chunk. */
export const preloadWorkspaceTab = (tab: MainTab): Promise<unknown> => {
  if (tab === "memories") return import("@/components/memories/MemoriesView");
  if (tab === "messages") return import("@/components/messages/MessageBoard");
  return Promise.all([
    import("@/components/movies/MoviesView"),
    import("@/components/places/PlacesList"),
  ]);
};

/** Warm the workspace shell chunk (header + bento layout). */
export const preloadAppWorkspaceShell = (): Promise<unknown> =>
  import("@/app/AppWorkspaceShell");

// Only preload functional feature modules (no decorative effects)
const DEFERRED_MODULES = [
  () => import("@/components/messages/MessageBoard"),
  () => import("@/components/spin-match/SpinSwipeGame"),
  () => import("@/components/quiz/QuizExperience"),
  () => import("@/components/quiz/QuizEditor"),
  () => import("@/components/spin-wheel/SpinWheelGame"),
] as const;

/**
 * Warm modules for first paint. Only the workspace shell blocks readiness;
 * the active tab chunk loads in parallel via Suspense.
 */
export const preloadCriticalAppModules = (): Promise<void> => {
  if (criticalPreloadPromise) {
    return criticalPreloadPromise;
  }

  const tab = readInitialMainTab();
  criticalPreloadPromise = preloadAppWorkspaceShell().then(() => {
    void preloadWorkspaceTab(tab);
  });
  return criticalPreloadPromise;
};

/** Warm secondary feature chunks after the shell is visible. */
export const preloadDeferredAppModules = (): Promise<void> => {
  if (deferredPreloadPromise) {
    return deferredPreloadPromise;
  }

  const initialTab = readInitialMainTab();
  const allTabs = ["movies", "memories", "messages"] as const;
  const inactiveTabs = allTabs.filter((t) => t !== initialTab);
  deferredPreloadPromise = staggerPreloads([
    ...inactiveTabs.map((t) => () => preloadWorkspaceTab(t)),
    ...DEFERRED_MODULES,
  ]);
  return deferredPreloadPromise;
};
