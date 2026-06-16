let criticalPreloadPromise: Promise<void> | null = null;
let deferredPreloadPromise: Promise<void> | null = null;

const CRITICAL_MODULES = [
  () => import("@/app/AppWorkspaceShell"),
  () => import("@/components/effects/RadialMenu"),
] as const;

const DEFERRED_MODULES = [
  () => import("@/app/CohesionAudit"),
  () => import("@/app/QuizFlowModalContent"),
  () => import("@/branding/ElectronLogoLab"),
  () => import("@/components/effects/moire/Moire"),
  () => import("@/components/effects/RetroEffects"),
  () => import("@/components/messages/MessageBoard"),
  () => import("@/components/places/PlacesList"),
  () => import("@/components/quiz/QuizEditor"),
  () => import("@/components/spin-match/SpinSwipeGame"),
  () => import("@/components/spin-wheel/SpinWheelGame"),
] as const;

const runPreloads = (modules: ReadonlyArray<() => Promise<unknown>>) =>
  Promise.allSettled(modules.map((load) => load())).then(() => undefined);

/**
 * Warm the modules needed for the first interactive shell paint.
 */
export const preloadCriticalAppModules = (): Promise<void> => {
  if (criticalPreloadPromise) {
    return criticalPreloadPromise;
  }

  criticalPreloadPromise = runPreloads(CRITICAL_MODULES);
  return criticalPreloadPromise;
};

/**
 * Warm secondary feature chunks after the shell is visible.
 */
export const preloadDeferredAppModules = (): Promise<void> => {
  if (deferredPreloadPromise) {
    return deferredPreloadPromise;
  }

  deferredPreloadPromise = runPreloads(DEFERRED_MODULES);
  return deferredPreloadPromise;
};

/** @deprecated Use preloadCriticalAppModules + preloadDeferredAppModules. */
export const preloadAppModules = (): Promise<void> =>
  Promise.all([
    preloadCriticalAppModules(),
    preloadDeferredAppModules(),
  ]).then(() => undefined);
