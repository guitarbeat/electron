let preloadPromise: Promise<void> | null = null;

/**
 * Warm the lazily split UI modules while the loading screen is visible so the
 * first interaction after boot doesn't need to wait on extra chunks.
 */
export const preloadAppModules = (): Promise<void> => {
  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = Promise.allSettled([
    import('@/app/AppWorkspaceShell'),
    import('@/app/CohesionAudit'),
    import('@/app/QuizFlowModalContent'),
    import('@/branding/ElectronLogoLab'),
    import('@/components/effects/moire/Moire'),
    import('@/components/effects/RadialMenu'),
    import('@/components/effects/RetroEffects'),
    import('@/components/messages/MessageBoard'),
    import('@/components/places/PlacesList'),
    import('@/components/quiz/QuizEditor'),
    import('@/components/spin-match/SpinSwipeGame'),
    import('@/components/spin-wheel/SpinWheelGame'),
  ]).then(() => undefined);

  return preloadPromise;
};

