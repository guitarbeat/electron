import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  APP_VIEW_STATE_KEY,
  readInitialAppViewState,
  stripLaunchUrlShortcuts,
  type StoredAppViewState,
} from "@/app/appViewState";
import { buildFeatureModals } from "@/app/buildMinigameModals";
import {
  preloadCriticalAppModules,
  preloadDeferredAppModules,
} from "@/app/preloadAppModules";
import {
  readQuizCompletionState,
  writeQuizCompletionState,
} from "@/app/quizCompletionStorage";
import { getRequestedLogoVariant, isLogoLabEnabled } from "@/app/logoLab";
import { PwaInstallProvider } from "@/app/PwaInstallProvider";
import { ViewportProvider, useViewport } from "@/app/ViewportContext";
import { ThemeProvider, ToastProvider, UserProvider } from "@/app/providers";
import { useUser } from "@/app/useProviders";
import { usePwaRuntime } from "@/hooks/usePwaRuntime";
import LoadingScreen from "@/app/LoadingScreen";
import WorkspaceErrorBoundary from "@/app/WorkspaceErrorBoundary";
import { useAudio } from "@/hooks/useAudio";
import { useAppTabNavigation } from "@/hooks/useAppTabNavigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";

import { scheduleIdleWork } from "@/utils/scheduleIdleWork";
import MinigameModal from "@/ui/MinigameModal";
import "./App.scss";

const AppWorkspaceShell = React.lazy(
  () => import("@/app/AppWorkspaceShell"),
);
const LazyAnalytics = React.lazy(() =>
  import("@vercel/analytics/react").then((module) => ({
    default: module.Analytics,
  })),
);
const MagicComponent = React.lazy(
  () =>
    import("@/components/effects/moire/Moire") as Promise<{
      default: React.ComponentType<{
        isVisible?: boolean;
        opacity?: number;
        color1?: string;
        color2?: string;
      }>;
    }>,
);
const RetroEffects = React.lazy<
  React.ComponentType<{ cursorTrailEnabled: boolean }>
>(() =>
  import("@/components/effects/RetroEffects").catch(
    () => ({ default: () => null }),
  ),
);
const RadialMenu = React.lazy<
  React.ComponentType<{
    onOpenMessages?: () => void;
    onOpenQuiz?: () => void;
    onOpenSpin?: () => void;
  }>
>(() =>
  import("@/components/effects/RadialMenu").catch(
    () => ({ default: () => null }),
  ),
);
const FishTankSection = React.lazy(
  () => import("@/components/effects/FishTankSection"),
);
const ElectronLogoLab = React.lazy(() => import("@/branding/ElectronLogoLab"));
const CohesionAudit = React.lazy(() => import("@/app/CohesionAudit"));
const modalBodyStyle = {
  flex: 1,
  overflowY: "auto",
} satisfies React.CSSProperties;
const isCohesionAuditRoute =
  typeof window !== "undefined" &&
  window.location.pathname.replace(/\/$/, "") === "/cohesion";

const App: React.FC = () => {
  const { currentUser } = useUser();
  const {
    isOnline,
    isStandalone,
    canInstallApp,
    hasUpdateReady,
    outboxStatus,
    handleApplyUpdate,
    handleRetryPendingSync,
    handleInstallApp,
  } = usePwaRuntime();
  const { playSwitch } = useAudio();
  const { isMobile } = useViewport();
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );
  const [isBootReady, setIsBootReady] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const initialViewState = useMemo(() => readInitialAppViewState(), []);
  const { activeTab, handleTabChange } = useAppTabNavigation({
    initialTab: initialViewState.activeTab,
    prefersReducedMotion,
    isMobile,
    onTabSwitch: playSwitch,
  });
  const [quizCompleted, setQuizCompleted] = useState<boolean>(() =>
    readQuizCompletionState(currentUser),
  );
  const [showMessages, setShowMessages] = useState(
    () => initialViewState.showMessages,
  );
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showQuizExperience, setShowQuizExperience] = useState(false);
  const [showSpinMatch, setShowSpinMatch] = useState(false);
  const [cursorTrailEnabled] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("cursorTrailEnabled") === "true",
  );

  useEffect(() => {
    stripLaunchUrlShortcuts();
  }, []);

  const logoLabState = useMemo(() => {
    if (typeof window === "undefined") {
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
    let cancelled = false;

    void preloadCriticalAppModules().finally(() => {
      if (!cancelled) {
        setIsBootReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void import("./app-skin.scss");
  }, []);

  useEffect(() => {
    if (!isBootReady) {
      return undefined;
    }

    return scheduleIdleWork(() => {
      void preloadDeferredAppModules();
    }, 300);
  }, [isBootReady]);

  useEffect(() => {
    setQuizCompleted(readQuizCompletionState(currentUser));
  }, [currentUser]);

  useEffect(() => {
    return scheduleIdleWork(() => setShowAnalytics(true), 4000);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      APP_VIEW_STATE_KEY,
      JSON.stringify({
        activeTab,
        showMessages,
      } satisfies StoredAppViewState),
    );
  }, [activeTab, showMessages]);

  const updateQuizCompletion = useCallback(
    (completed: boolean) => {
      setQuizCompleted(completed);
      writeQuizCompletionState(currentUser, completed);
    },
    [currentUser],
  );

  const openQuizExperience = useCallback(() => {
    setShowQuizExperience(true);
  }, []);

  const handleQuizComplete = useCallback(() => {
    updateQuizCompletion(true);
  }, [updateQuizCompletion]);

  const handleQuizEdit = useCallback(() => {
    setShowQuizExperience(false);
    setShowQuizEditor(true);
  }, []);

  const handleQuizRetake = useCallback(() => {
    updateQuizCompletion(false);
  }, [updateQuizCompletion]);

  const openSpinMatch = useCallback(() => {
    setShowSpinMatch(true);
  }, []);

  const featureModals = useMemo(
    () =>
      buildFeatureModals({
        showMessages,
        showQuizEditor,
        showQuizExperience,
        showSpinMatch,
        quizCompleted,
        currentUser,
        setShowMessages,
        setShowQuizEditor,
        setShowQuizExperience,
        setShowSpinMatch,
        onQuizComplete: handleQuizComplete,
        onQuizRetake: handleQuizRetake,
        onQuizEdit: handleQuizEdit,
      }),
    [
      currentUser,
      handleQuizComplete,
      handleQuizEdit,
      handleQuizRetake,
      quizCompleted,
      showMessages,
      showQuizEditor,
      showQuizExperience,
      showSpinMatch,
    ],
  );

  if (isCohesionAuditRoute) {
    return (
      <ThemeProvider>
        <CohesionAudit />
      </ThemeProvider>
    );
  }

  if (logoLabState.enabled) {
    return (
      <ThemeProvider>
        <RetroEffects cursorTrailEnabled={cursorTrailEnabled} />

        <div className="app-shell app-shell--viewport bg-main">
          {!prefersReducedMotion ? <MagicComponent isVisible /> : null}

          <ElectronLogoLab initialVariant={logoLabState.initialVariant} />
        </div>
      </ThemeProvider>
    );
  }

  if (!isBootReady) {
    return (
      <ThemeProvider themeName={activeTab}>
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider themeName={activeTab}>
      {cursorTrailEnabled ? (
        <React.Suspense fallback={null}>
          <RetroEffects cursorTrailEnabled={cursorTrailEnabled} />
        </React.Suspense>
      ) : null}
      <div
        className={`app-shell app-shell--viewport bg-main${isMobile ? " app-shell--mobile" : ""}`}
      >
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
          <div
            className={`app-workspace-stack app-workspace-stack--${activeTab}`}
          >
            <div
              className={`app-tab-shell app-tab-shell--${activeTab} workspace-unified-shell`}
            >
              <WorkspaceErrorBoundary>
                <React.Suspense fallback={null}>
                  <AppWorkspaceShell
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
                </React.Suspense>
              </WorkspaceErrorBoundary>
              <React.Suspense fallback={null}>
                {!isMobile ? <FishTankSection /> : null}
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
      {showAnalytics ? (
        <React.Suspense fallback={null}>
          <LazyAnalytics />
        </React.Suspense>
      ) : null}
    </ThemeProvider>
  );
};

const AppWithProviders: React.FC = () => (
  <UserProvider>
    <ToastProvider>
      <PwaInstallProvider>
        <ViewportProvider>
          <App />
        </ViewportProvider>
      </PwaInstallProvider>
    </ToastProvider>
  </UserProvider>
);

export default AppWithProviders;
