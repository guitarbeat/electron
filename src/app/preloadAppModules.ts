import type { MainTab } from "@/shared/types";

let criticalPreloadPromise: Promise<void> | null = null;
let deferredPreloadPromise: Promise<void> | null = null;

const APP_VIEW_STATE_KEY = "electron.appViewState.v1";

const readInitialTab = (): MainTab => {
  if (typeof window === "undefined") {
    return "movies";
  }

  const fromHash = window.location.hash.replace(/^#/, "");
  if (fromHash === "places") return "places";
  if (fromHash === "movies") return "movies";

  try {
    const raw = window.localStorage.getItem(APP_VIEW_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { activeTab?: string };
      if (parsed.activeTab === "places") return "places";
    }
  } catch {
    // ignore corrupt storage
  }

  return "movies";
};

const scheduleIdleWork = (work: () => void, timeoutMs = 2000): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  if (typeof window.requestIdleCallback === "function") {
    const idleId = window.requestIdleCallback(work, { timeout: timeoutMs });
    return () => window.cancelIdleCallback(idleId);
  }

  const timerId = globalThis.setTimeout(work, Math.min(timeoutMs, 400));
  return () => globalThis.clearTimeout(timerId);
};

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

/**
 * Warm the modules needed for the first interactive shell paint.
 */
export const preloadCriticalAppModules = (): Promise<void> => {
  if (criticalPreloadPromise) {
    return criticalPreloadPromise;
  }

  criticalPreloadPromise = runPreloads(criticalModulesForTab(readInitialTab()));
  return criticalPreloadPromise;
};

/**
 * Warm secondary feature chunks after the shell is visible.
 */
export const preloadDeferredAppModules = (): Promise<void> => {
  if (deferredPreloadPromise) {
    return deferredPreloadPromise;
  }

  const inactiveTab = readInitialTab() === "movies" ? "places" : "movies";
  deferredPreloadPromise = staggerPreloads([
    () => preloadWorkspaceTab(inactiveTab),
    ...DEFERRED_MODULES,
  ]);
  return deferredPreloadPromise;
};

/** @deprecated Use preloadCriticalAppModules + preloadDeferredAppModules. */
export const preloadAppModules = (): Promise<void> =>
  Promise.all([
    preloadCriticalAppModules(),
    preloadDeferredAppModules(),
  ]).then(() => undefined);
