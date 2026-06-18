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
        scheduleIdleWork(loadNext, 600);
      });
    };

    scheduleIdleWork(loadNext, 400);
  });

/** Warm the active workspace tab chunk. */
export const preloadWorkspaceTab = (tab: MainTab): Promise<unknown> =>
  tab === "places"
    ? import("@/components/places/PlacesList")
    : import("@/components/movies/MoviesView");

/** Warm the workspace shell chunk (header + bento layout). */
export const preloadAppWorkspaceShell = (): Promise<unknown> =>
  import("@/app/AppWorkspaceShell");

const DEFERRED_MODULES = [
  () => import("@/components/effects/RadialMenu"),
  () => import("@/components/messages/MessageBoard"),
  () => import("@/components/spin-match/SpinSwipeGame"),
  () => import("@/components/quiz/QuizExperience"),
  () => import("@/components/effects/RetroEffects"),
  () => import("@/components/quiz/QuizEditor"),
  () => import("@/components/spin-wheel/SpinWheelGame"),
  () => import("@/app/CohesionAudit"),
  () => import("@/branding/ElectronLogoLab"),
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
  const inactiveTab: MainTab = initialTab === "movies" ? "places" : "movies";
  deferredPreloadPromise = staggerPreloads([
    () => preloadWorkspaceTab(inactiveTab),
    ...DEFERRED_MODULES,
  ]);
  return deferredPreloadPromise;
};
