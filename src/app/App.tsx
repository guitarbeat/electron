import React, {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  APP_VIEW_STATE_KEY,
  readHashMainTab,
  readInitialAppViewState,
  stripLaunchUrlShortcuts,
  type StoredAppViewState,
} from "@/app/appViewState";
import { buildFeatureModals } from "@/app/buildMinigameModals";
import {
  preloadCriticalAppModules,
  preloadDeferredAppModules,
  preloadWorkspaceTab,
} from "@/app/preloadAppModules";
import {
  readQuizCompletionState,
  writeQuizCompletionState,
} from "@/app/quizCompletionStorage";
import { getRequestedLogoVariant, isLogoLabEnabled } from "@/app/logoLab";
import { PwaInstallProvider } from "@/app/PwaInstallProvider";
import { ThemeProvider, ToastProvider, UserProvider } from "@/app/providers";
import { useAppSession, useUser, useTheme } from "@/app/useProviders";
import { usePwaRuntime } from "@/hooks/usePwaRuntime";
import AppHeader from "@/app/AppHeader";
import LoadingScreen from "@/app/LoadingScreen";
import WorkspaceErrorBoundary from "@/app/WorkspaceErrorBoundary";
import VignetteOverlay from "@/components/effects/VignetteOverlay";
import { useAudio } from "@/hooks/useAudio";
import { mediaBreakpoints, useMediaQuery } from "@/hooks/useMediaQuery";
import type { MainTab } from "@/shared/types";

import { scheduleIdleWork } from "@/utils/scheduleIdleWork";
import MinigameModal from "@/ui/MinigameModal";
import "./App.scss";
import "./app-skin.scss";

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

const webGLAvailable: boolean = (() => {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
})();

/**
 * Reads the active theme tokens and feeds the Moiré shader its accent colors,
 * so the background stays color-linked to the rest of the UI.
 */
const ThemedMoire: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const { theme } = useTheme();

  if (!enabled || !webGLAvailable) {
    return null;
  }

  return (
    <React.Suspense fallback={null}>
      <MagicComponent
        isVisible
        opacity={0.2}
        color1={theme.moire.color1}
        color2={theme.moire.color2}
      />
    </React.Suspense>
  );
};

type ViewTransitionCapableDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    finished: Promise<void>;
  };
};

const runWithViewTransition = (
  update: () => void,
  disabled: boolean,
): void => {
  if (disabled) {
    update();
    return;
  }

  const transitionDocument = document as ViewTransitionCapableDocument;
  if (typeof transitionDocument.startViewTransition === "function") {
    transitionDocument.startViewTransition(update);
    return;
  }

  update();
};

const App: React.FC = () => {
  const { currentUser } = useUser();
  const { isSessionLoading } = useAppSession();
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
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );
  const [isBootReady, setIsBootReady] = useState(false);
  const [showMoire, setShowMoire] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const initialViewState = useMemo(() => readInitialAppViewState(), []);
  const [activeTab, setActiveTab] = useState<MainTab>(
    () => initialViewState.activeTab,
  );
  const [quizCompleted, setQuizCompleted] = useState<boolean>(() =>
    readQuizCompletionState(currentUser),
  );
  const [showMessages, setShowMessages] = useState(
    () => initialViewState.showMessages,
  );
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showQuizFlow, setShowQuizFlow] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showSpinWheelOnly, setShowSpinWheelOnly] = useState(false);
  const [isSpinWheelLocked, setIsSpinWheelLocked] = useState(false);
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

    const cancelDeferredPreload = scheduleIdleWork(() => {
      void preloadDeferredAppModules();
    });

    return () => {
      cancelled = true;
      cancelDeferredPreload();
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isMobile) {
      return undefined;
    }

    return scheduleIdleWork(() => setShowMoire(true), 1500);
  }, [prefersReducedMotion, isMobile]);

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

      void preloadWorkspaceTab(tab);

      runWithViewTransition(
        () => {
          startTransition(() => {
            setActiveTab(tab);
          });
        },
        prefersReducedMotion || isMobile,
      );
    },
    [activeTab, isMobile, playSwitch, prefersReducedMotion],
  );

  // Keep URL hash in sync with active tab
  useEffect(() => {
    const hashTab = readHashMainTab();
    if (hashTab !== activeTab) {
      window.history.replaceState(null, "", `#${activeTab}`);
    }
  }, [activeTab]);

  // Respond to back/forward navigation and direct hash links
  useEffect(() => {
    const onHashChange = () => {
      const tab = readHashMainTab();
      if (tab) handleTabChange(tab);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [handleTabChange]);

  const openSpinMatch = useCallback(() => {
    setShowSpinWheel(true);
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

          <VignetteOverlay />

          <ElectronLogoLab initialVariant={logoLabState.initialVariant} />
        </div>
      </ThemeProvider>
    );
  }

  if (isSessionLoading || !isBootReady) {
    return (
      <ThemeProvider themeName={activeTab}>
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider themeName={activeTab}>
      <React.Suspense fallback={null}>
        <RetroEffects cursorTrailEnabled={cursorTrailEnabled} />
      </React.Suspense>
      <div className={`app-shell app-shell--viewport bg-main${isMobile ? " app-shell--mobile" : ""}`}>
        {!prefersReducedMotion ? <ThemedMoire enabled={showMoire} /> : null}

        <VignetteOverlay />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        {!isMobile ? (
          <React.Suspense fallback={null}>
            <RadialMenu
              onOpenMessages={() => setShowMessages(true)}
              onOpenQuiz={openQuizExperience}
              onOpenSpin={openSpinMatch}
            />
          </React.Suspense>
        ) : null}

        <div className="app-shell__canvas app-shell__canvas--main">
          <div
            className={`app-workspace-stack app-workspace-stack--${activeTab}`}
          >
            <div
              className={`app-tab-shell app-tab-shell--${activeTab} workspace-unified-shell`}
            >
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
                onOpenSpin={openSpinMatch}
                onOpenMessages={() => setShowMessages(true)}
                onOpenQuiz={openQuizExperience}
              />
              <WorkspaceErrorBoundary>
                <React.Suspense fallback={null}>
                  <AppWorkspaceShell
                    isMobile={isMobile}
                    activeTab={activeTab}
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
        <App />
      </PwaInstallProvider>
    </ToastProvider>
  </UserProvider>
);

export default AppWithProviders;
