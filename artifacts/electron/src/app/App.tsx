import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5s before a background refetch is triggered
      staleTime: 5000,
      // Automatically refetch when the tab/window regains focus
      refetchOnWindowFocus: true,
    },
  },
});
import { SpeedInsights } from "@vercel/speed-insights/react";
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
import type { ThemeName } from "@/theme/themes";
import { useUser } from "@/app/useProviders";
import { usePwaRuntime } from "@/hooks/usePwaRuntime";
import LoadingScreen from "@/app/LoadingScreen";
import WorkspaceErrorBoundary from "@/app/WorkspaceErrorBoundary";
import { useAppTabNavigation } from "@/hooks/useAppTabNavigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";

import { scheduleIdleWork } from "@/utils/scheduleIdleWork";
import MinigameModal from "@/ui/MinigameModal";
import SidebarRail from "@/components/ui/SidebarRail";
import type { TogglePanel } from "@/app/AppWorkspaceShell";
import "./App.scss";

const AppWorkspaceShell = React.lazy(
  () => import("@/app/AppWorkspaceShell"),
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
  const { isMobile } = useViewport();
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );
  const [isBootReady, setIsBootReady] = useState(false);

  const initialViewState = useMemo(() => readInitialAppViewState(), []);
  const { activeTab, handleTabChange } = useAppTabNavigation({
    initialTab: initialViewState.activeTab,
    prefersReducedMotion,
    isMobile,
  });
  const [quizCompleted, setQuizCompleted] = useState<boolean>(() =>
    readQuizCompletionState(currentUser),
  );
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showQuizExperience, setShowQuizExperience] = useState(false);
  const [showSpinMatch, setShowSpinMatch] = useState(false);
  const [openPanels, setOpenPanels] = useState<Set<TogglePanel>>(new Set());

  const togglePanel = useCallback((panel: TogglePanel) => {
    setOpenPanels((prev) => {
      const next = new Set(prev);
      if (next.has(panel)) {
        next.delete(panel);
      } else {
        next.add(panel);
      }
      return next;
    });
  }, []);

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

  // Preload deferred modules immediately after boot (no delay)
  useEffect(() => {
    if (!isBootReady) {
      return undefined;
    }

    return scheduleIdleWork(() => {
      void preloadDeferredAppModules();
    }, 50);
  }, [isBootReady]);

  useEffect(() => {
    setQuizCompleted(readQuizCompletionState(currentUser));
  }, [currentUser]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      APP_VIEW_STATE_KEY,
      JSON.stringify({
        activeTab,
      } satisfies StoredAppViewState),
    );
  }, [activeTab]);

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

  const openMessages = useCallback(() => {
    handleTabChange("messages");
  }, [handleTabChange]);

  const featureModals = useMemo(
    () =>
      buildFeatureModals({
        showMessages: false,
        showQuizEditor,
        showQuizExperience,
        showSpinMatch,
        quizCompleted,
        currentUser,
        setShowMessages: () => {},
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
        <div className="app-shell app-shell--viewport bg-main">
          <ElectronLogoLab initialVariant={logoLabState.initialVariant} />
        </div>
      </ThemeProvider>
    );
  }

  if (!isBootReady) {
    return (
      <ThemeProvider themeName={(activeTab === "places" ? "places" : "movies") as ThemeName}>
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider themeName={(activeTab === "places" ? "places" : "movies") as ThemeName}>
      <div
        className={`app-shell app-shell--viewport bg-main${isMobile ? " app-shell--mobile" : ""}`}
      >
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <SidebarRail
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
          openPanels={openPanels}
          onTogglePanel={togglePanel}
        />

        <div className="app-shell__canvas app-shell__canvas--main app-shell__canvas--with-rail">
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
                    onOpenMessages={openMessages}
                    onOpenQuiz={openQuizExperience}
                    onOpenSpin={openSpinMatch}
                    openPanels={openPanels}
                    onTogglePanel={togglePanel}
                  />
                </React.Suspense>
              </WorkspaceErrorBoundary>
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
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <ToastProvider>
        <PwaInstallProvider>
          <ViewportProvider>
            <App />
            <SpeedInsights />
          </ViewportProvider>
        </PwaInstallProvider>
      </ToastProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default AppWithProviders;
