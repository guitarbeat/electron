import { readInitialMainTab } from "@/app/appViewState";
import type { MainTab } from "@/shared/types";
import { scheduleIdleWork } from "@/utils/scheduleIdleWork";

let criticalPreloadPromise: Promise<void> | null = null;
let deferredPreloadPromise: Promise<void> | null = null;

const runPreloads = (modules: ReadonlyArray<() => Promise<unknown>>) =>
  Promise.allSettled(modules.map((load) => load())).then(() => undefined);

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
        scheduleIdleWork(loadNext, 1200);
      });
    };

    scheduleIdleWork(loadNext, 800);
  });

/** Warm the active workspace tab chunk. */
export const preloadWorkspaceTab = (tab: MainTab): Promise<unknown> =>
  tab === "places"
    ? import("@/components/places/PlacesList")
    : import("@/components/movies/MoviesView");

const criticalModulesForTab = (tab: MainTab) =>
  [
    () => import("@/app/AppWorkspaceShell"),
    () => preloadWorkspaceTab(tab),
  ] as const;

const DEFERRED_MODULES = [
  () => import("@/app/CohesionAudit"),
  () => import("@/app/QuizFlowModalContent"),
  () => import("@/branding/ElectronLogoLab"),
  () => import("@/components/effects/moire/Moire"),
  () => import("@/components/effects/RetroEffects"),
  () => import("@/components/effects/RadialMenu"),
  () => import("@/components/messages/MessageBoard"),
  () => import("@/components/quiz/QuizEditor"),
  () => import("@/components/spin-match/SpinSwipeGame"),
  () => import("@/components/spin-wheel/SpinWheelGame"),
] as const;

/** Warm the modules needed for the first interactive shell paint. */
export const preloadCriticalAppModules = (): Promise<void> => {
  if (criticalPreloadPromise) {
    return criticalPreloadPromise;
  }

  criticalPreloadPromise = runPreloads(
    criticalModulesForTab(readInitialMainTab()),
  );
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
