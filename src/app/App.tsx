import React, { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { buildFeatureModals } from '@/app/buildMinigameModals';
import { preloadAppModules } from '@/app/preloadAppModules';
import { readQuizCompletionState, writeQuizCompletionState } from '@/app/quizCompletionStorage';
import { getRequestedLogoVariant, isLogoLabEnabled } from '@/app/logoLab';
import { ThemeProvider, ToastProvider, UserProvider } from '@/app/providers';
import { useAppSession, useTheme, useToast, useUser } from '@/app/useProviders';
import AppHeader from '@/app/AppHeader';
import LoadingScreen from '@/app/LoadingScreen';
const MagicComponent = React.lazy(() => import('@/components/effects/moire/Moire'));
const RetroEffects = React.lazy(() => import('@/components/effects/RetroEffects'));

const RadialMenu = React.lazy(() => import('@/components/effects/RadialMenu'));
import VignetteOverlay from '@/components/effects/VignetteOverlay';
const ElectronLogoLab = React.lazy(() => import('@/branding/ElectronLogoLab'));
import { useAudio } from '@/hooks/useAudio';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import type { MainTab } from '@/shared/types';
import {
  flushPendingSync,
  getOutboxStatusSummary,
  syncOutboxStatusEvent,
  type OutboxStatusSummary,
} from '@/services/state/stateClient';

import MinigameModal from '@/ui/MinigameModal';
import './App.scss';

const AppWorkspaceShell = React.lazy(() => import('@/app/AppWorkspaceShell'));
const CohesionAudit = React.lazy(() => import('@/app/CohesionAudit'));
const modalBodyStyle = { flex: 1, overflowY: 'auto' } satisfies React.CSSProperties;
const isCohesionAuditRoute =
  typeof window !== 'undefined' && window.location.pathname.replace(/\/$/, '') === '/cohesion';
const APP_VIEW_STATE_KEY = 'electron.appViewState.v1';
const MIN_LOADING_SCREEN_MS = 2200;

/**
 * Reads the active theme tokens and feeds the Moiré shader its accent colors,
 * so the background stays color-linked to the rest of the UI.
 */
const ThemedMoire: React.FC = () => {
  const { themeTokens } = useTheme();
  return (
    <MagicComponent
      isVisible
      opacity={0.2}
      color1={themeTokens.accent}
      color2={themeTokens.secondary}
    />
  );
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type ViewTransitionCapableDocument = Document & {
  startViewTransition?: (
    callback: () => void | Promise<void>
  ) => { finished: Promise<void> };
};

const getRequestedTab = (value: string | null): MainTab | null => {
  if (!value) return null;
  if (value === 'places') return 'places';
  if (value === 'movies') return 'movies';
  return null;
};

interface StoredAppViewState {
  activeTab: MainTab;
  showMessages: boolean;
}

const readStoredAppViewState = (): StoredAppViewState | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(APP_VIEW_STATE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredAppViewState>;
    return {
      activeTab: parsed.activeTab === 'places' ? 'places' : 'movies',
      showMessages: Boolean(parsed.showMessages),
    };
  } catch {
    return null;
  }
};

const isStandaloneDisplayMode = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

const App: React.FC = () => {
  const { currentUser } = useUser();
  const { isSessionLoading } = useAppSession();
  const { showToast, dismissToast } = useToast();
  const { playSwitch } = useAudio();
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [hasInitialLoadingScreenElapsed, setHasInitialLoadingScreenElapsed] = useState(false);

  const persistedViewState = useMemo(() => readStoredAppViewState(), []);
  const [activeTab, setActiveTab] = useState<MainTab>(persistedViewState?.activeTab ?? 'movies');
  const [quizCompleted, setQuizCompleted] = useState<boolean>(() =>
    readQuizCompletionState(currentUser)
  );
  const [showMessages, setShowMessages] = useState(persistedViewState?.showMessages ?? false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showQuizFlow, setShowQuizFlow] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showSpinWheelOnly, setShowSpinWheelOnly] = useState(false);
  const [isSpinWheelLocked, setIsSpinWheelLocked] = useState(false);
  const [cursorTrailEnabled] = useState<boolean>(
    () => localStorage.getItem('cursorTrailEnabled') === 'true'
  );
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [isStandalone, setIsStandalone] = useState<boolean>(isStandaloneDisplayMode);
  const [canInstallApp, setCanInstallApp] = useState(false);
  const [hasUpdateReady, setHasUpdateReady] = useState(false);
  const [outboxStatus, setOutboxStatus] = useState<OutboxStatusSummary>(() =>
    getOutboxStatusSummary()
  );
  const installPromptRef = React.useRef<InstallPromptEvent | null>(null);
  const installToastIdRef = React.useRef<string | null>(null);
  const updateToastIdRef = React.useRef<string | null>(null);
  const updateRegistrationRef = React.useRef<ServiceWorkerRegistration | null>(null);
  const shortcutHandledRef = React.useRef(false);
  const offlineToastIdRef = React.useRef<string | null>(null);

  const logoLabState = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        enabled: false,
        initialVariant: undefined,
      };
    }

    return {
      enabled: isLogoLabEnabled(window.location.search),
      initialVariant: getRequestedLogoVariant(window.location.search),
    };
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', 'movies');
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setHasInitialLoadingScreenElapsed(true);
    }, MIN_LOADING_SCREEN_MS);

    void preloadAppModules();

    return () => {
      window.clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    setQuizCompleted(readQuizCompletionState(currentUser));
  }, [currentUser]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      APP_VIEW_STATE_KEY,
      JSON.stringify({
        activeTab,
        showMessages,
      } satisfies StoredAppViewState)
    );
  }, [activeTab, showMessages]);

  useEffect(() => {
    if (shortcutHandledRef.current || typeof window === 'undefined') {
      return;
    }

    shortcutHandledRef.current = true;
    const search = new URLSearchParams(window.location.search);
    const requestedTab = getRequestedTab(search.get('tab'));
    const requestedPanel = search.get('panel');
    let didApplyShortcut = false;

    if (requestedTab) {
      setActiveTab(requestedTab);
      didApplyShortcut = true;
    }

    if (requestedPanel === 'messages') {
      setShowMessages(true);
      didApplyShortcut = true;
    }

    if (didApplyShortcut) {
      search.delete('tab');
      search.delete('panel');
      const next = `${window.location.pathname}${search.toString() ? `?${search.toString()}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', next);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      installPromptRef.current = event as InstallPromptEvent;
      setCanInstallApp(true);

      if (installToastIdRef.current) {
        dismissToast(installToastIdRef.current);
      }

      installToastIdRef.current = showToast({
        type: 'info',
        message: 'Install Electron for a quicker launch.',
        persistent: true,
        actionLabel: 'Install',
        onAction: async () => {
          const promptEvent = installPromptRef.current;
          if (!promptEvent) return;

          await promptEvent.prompt();
          const choice = await promptEvent.userChoice;
          if (choice.outcome === 'accepted') {
            showToast({
              type: 'success',
              message: 'Electron added to your device.',
            });
          }
          installPromptRef.current = null;
          setCanInstallApp(false);
          if (installToastIdRef.current) {
            dismissToast(installToastIdRef.current);
            installToastIdRef.current = null;
          }
        },
      });
    };

    const handleInstalled = () => {
      installPromptRef.current = null;
      setCanInstallApp(false);
      setIsStandalone(true);
      if (installToastIdRef.current) {
        dismissToast(installToastIdRef.current);
        installToastIdRef.current = null;
      }
      showToast({
        type: 'success',
        message: 'Electron is installed and ready to launch like an app.',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [dismissToast, showToast]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return undefined;
    }

    let isMounted = true;
    let hasReloaded = false;

    const showUpdateToast = (registration: ServiceWorkerRegistration) => {
      setHasUpdateReady(true);
      if (updateToastIdRef.current) {
        dismissToast(updateToastIdRef.current);
      }

      updateRegistrationRef.current = registration;
      updateToastIdRef.current = showToast({
        type: 'info',
        message: 'A newer app version is ready.',
        persistent: true,
        actionLabel: 'Refresh',
        onAction: () => {
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        },
      });
    };

    const watchRegistration = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        showUpdateToast(registration);
      }

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (
            installing.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            showUpdateToast(registration);
          }
        });
      });
    };

    navigator.serviceWorker.ready
      .then((registration) => {
        if (!isMounted) return;
        watchRegistration(registration);
      })
      .catch(() => undefined);

    const handleControllerChange = () => {
      if (hasReloaded) return;
      hasReloaded = true;
      setHasUpdateReady(false);
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [dismissToast, showToast]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleOffline = () => {
      setIsOnline(false);
      document.documentElement.classList.add('app-offline');
      if (offlineToastIdRef.current) {
        dismissToast(offlineToastIdRef.current);
      }
      offlineToastIdRef.current = showToast({
        type: 'error',
        message: 'You are offline. Saved app screens still work, but sync is paused.',
        persistent: true,
      });
    };

    const handleOnline = () => {
      setIsOnline(true);
      document.documentElement.classList.remove('app-offline');
      if (offlineToastIdRef.current) {
        dismissToast(offlineToastIdRef.current);
        offlineToastIdRef.current = null;
      }
      void flushPendingSync().then(setOutboxStatus).catch(() => undefined);
      updateRegistrationRef.current?.update().catch(() => undefined);
      showToast({
        type: 'success',
        message: 'Back online. Sync and update checks have resumed.',
      });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    if (!navigator.onLine) {
      handleOffline();
    } else {
      document.documentElement.classList.remove('app-offline');
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [dismissToast, showToast]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const applyOutboxStatus = () => {
      setOutboxStatus(getOutboxStatusSummary());
    };

    const handleOutboxEvent = (event: Event) => {
      const customEvent = event as CustomEvent<OutboxStatusSummary>;
      setOutboxStatus(customEvent.detail ?? getOutboxStatusSummary());
    };

    const handleVisibilitySync = () => {
      setIsStandalone(isStandaloneDisplayMode());
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void flushPendingSync().then(setOutboxStatus).catch(() => undefined);
        updateRegistrationRef.current?.update().catch(() => undefined);
      }
    };

    applyOutboxStatus();
    window.addEventListener(syncOutboxStatusEvent, handleOutboxEvent as EventListener);
    window.addEventListener('focus', handleVisibilitySync);
    document.addEventListener('visibilitychange', handleVisibilitySync);

    const syncInterval = window.setInterval(() => {
      if (!navigator.onLine) {
        return;
      }

      void flushPendingSync().then(setOutboxStatus).catch(() => undefined);
    }, 45000);

    return () => {
      window.removeEventListener(syncOutboxStatusEvent, handleOutboxEvent as EventListener);
      window.removeEventListener('focus', handleVisibilitySync);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
      window.clearInterval(syncInterval);
    };
  }, []);

  const updateQuizCompletion = useCallback(
    (completed: boolean) => {
      setQuizCompleted(completed);
      writeQuizCompletionState(currentUser, completed);
    },
    [currentUser]
  );

  const openQuizExperience = useCallback(() => {
    setShowQuizFlow(true);
  }, []);

  const handleQuizComplete = useCallback(() => {
    updateQuizCompletion(true);
    setShowQuizFlow(false);
  }, [updateQuizCompletion]);

  const handleQuizRetake = useCallback(() => {
    updateQuizCompletion(false);
  }, [updateQuizCompletion]);

  const handleTabChange = useCallback(
    (tab: MainTab) => {
      if (tab === activeTab) {
        return;
      }

      playSwitch();

      const nextTab = () => {
        startTransition(() => {
          setActiveTab(tab);
        });
      };

      const transitionDocument = document as ViewTransitionCapableDocument;
      if (prefersReducedMotion || typeof transitionDocument.startViewTransition !== 'function') {
        nextTab();
        return;
      }

      transitionDocument.startViewTransition(() => {
        nextTab();
      });
    },
    [activeTab, playSwitch, prefersReducedMotion]
  );

  const openSpinMatch = useCallback(() => {
    setShowSpinWheel(true);
  }, []);

  const handleInstallApp = useCallback(async () => {
    const promptEvent = installPromptRef.current;
    if (!promptEvent) {
      return;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      showToast({
        type: 'success',
        message: 'Electron added to your device.',
      });
    }
    installPromptRef.current = null;
    setCanInstallApp(false);
    if (installToastIdRef.current) {
      dismissToast(installToastIdRef.current);
      installToastIdRef.current = null;
    }
  }, [dismissToast, showToast]);

  const handleApplyUpdate = useCallback(() => {
    setHasUpdateReady(false);
    updateRegistrationRef.current?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  }, []);

  const handleRetryPendingSync = useCallback(() => {
    void flushPendingSync().then(setOutboxStatus).catch(() => undefined);
  }, []);

  const featureModals = useMemo(
    () =>
      buildFeatureModals({
        showMessages,
        showQuizEditor,
        showQuizFlow,
        showSpinWheel,
        showSpinWheelOnly,
        quizCompleted,
        isSpinWheelLocked,
        currentUser,
        setShowMessages,
        setShowQuizEditor,
        setShowQuizFlow,
        setShowSpinWheel,
        setShowSpinWheelOnly,
        setIsSpinWheelLocked,
        onQuizComplete: handleQuizComplete,
        onQuizRetake: handleQuizRetake,
      }),
    [
      currentUser,
      handleQuizComplete,
      handleQuizRetake,
      isSpinWheelLocked,
      quizCompleted,
      showMessages,
      showQuizEditor,
      showQuizFlow,
      showSpinWheel,
      showSpinWheelOnly,
    ]
  );

  if (isCohesionAuditRoute) {
    return (
      <ThemeProvider>
        <React.Suspense fallback={null}>
          <CohesionAudit />
        </React.Suspense>
      </ThemeProvider>
    );
  }

  if (logoLabState.enabled) {
    return (
      <ThemeProvider>
        <React.Suspense fallback={null}>
          <RetroEffects cursorTrailEnabled={cursorTrailEnabled} />
        </React.Suspense>
        <div className="app-shell app-shell--viewport bg-main">
          <React.Suspense fallback={null}>
            {!prefersReducedMotion ? <MagicComponent isVisible /> : null}
          </React.Suspense>
          <VignetteOverlay />
          <React.Suspense fallback={null}>
            <ElectronLogoLab initialVariant={logoLabState.initialVariant} />
          </React.Suspense>
        </div>
      </ThemeProvider>
    );
  }

  if (isSessionLoading || !hasInitialLoadingScreenElapsed) {
    return (
      <ThemeProvider>
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <React.Suspense fallback={null}>
        <RetroEffects cursorTrailEnabled={cursorTrailEnabled} />
      </React.Suspense>
      <div className="app-shell app-shell--viewport bg-main">
        <React.Suspense fallback={null}>
          {!prefersReducedMotion ? <ThemedMoire /> : null}
        </React.Suspense>
        <VignetteOverlay />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>


        <React.Suspense fallback={null}>
          <RadialMenu
            onOpenMessages={() => setShowMessages(true)}
            onOpenQuiz={openQuizExperience}
            onOpenSpin={openSpinMatch}
          />
        </React.Suspense>

        <div className="app-shell__canvas app-shell__canvas--main">
          <div className={`app-workspace-stack app-workspace-stack--${activeTab}`}>
            <div className={`app-tab-shell app-tab-shell--${activeTab}${activeTab === 'movies' ? ' movies-unified-shell' : ''}`}>
              <AppHeader
                activeTab={activeTab}
                onTabChange={handleTabChange}
                pwaStatus={{
                  isOnline,
                  isStandalone,
                  canInstall: canInstallApp,
                  hasUpdateReady,
                  pendingSyncCount: outboxStatus.pendingCount,
                  blockedSyncCount: outboxStatus.blockedCount,
                }}
                onInstallApp={() => void handleInstallApp()}
                onApplyUpdate={handleApplyUpdate}
                onRetrySync={handleRetryPendingSync}
              />
              <React.Suspense fallback={null}>
                <AppWorkspaceShell
                  isMobile={isMobile}
                  activeTab={activeTab}
                />
              </React.Suspense>
            </div>
          </div>
        </div>

        {featureModals.map((modal) => (
          <MinigameModal
            key={modal.key}
            isOpen={modal.isOpen}
            onClose={modal.onClose}
            title={modal.title}
            ariaLabel={modal.ariaLabel}
            maxWidth={modal.maxWidth}
            maxHeight={modal.maxHeight}
            closeDisabled={modal.closeDisabled}
            closeDisabledLabel={modal.closeDisabledLabel}
          >
            <div style={modal.contentStyle ?? modalBodyStyle}>
              {modal.isOpen ? modal.content : null}
            </div>
          </MinigameModal>
        ))}

      </div>
    </ThemeProvider>
  );
};

const AppWithProviders: React.FC = () => (
  <UserProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </UserProvider>
);

export default AppWithProviders;
