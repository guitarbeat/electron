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

import { useViewport, useUser } from "@/app/providerContexts";
import { ThemeProvider } from "@/app/providers";
import { usePwaRuntime } from "@/hooks";
import WorkspaceErrorBoundary from "@/app/WorkspaceErrorBoundary";
import { useAppTabNavigation } from "@/hooks";
import { useMediaQuery } from "@/hooks";
import { useTvSpatialNavigation } from "@/hooks";

import { scheduleIdleWork } from "@/utils";
import { MinigameModal } from "@/components/ui";
import { SidebarRail } from "@/components/ui";
import { ProfilePinPanel } from "@/components/ui";
import { WorkspaceTabFallback } from "@/components/ui";
import type { TogglePanel } from "@/app/AppWorkspaceShell";
const AppWorkspaceShell = React.lazy(() => import("@/app/AppWorkspaceShell"));
import {
  isLibraryWorkspaceTab,
  libraryWorkspaceStackClass,
} from "@/utils/workspaceConfig";
import { AppProviders } from "@/app/AppProviders";
import "./globals.css";
import "./component-styles.css";

const modalBodyStyle = {
  flex: 1,
  overflowY: "auto",
} satisfies React.CSSProperties;

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
  const { isMobile, isTv } = useViewport();
  useTvSpatialNavigation(isTv);

  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );


  const initialViewState = useMemo(() => readInitialAppViewState(), []);
  const { activeTab } = useAppTabNavigation({
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

  useEffect(() => {
    void preloadCriticalAppModules().catch((err) => {
      console.warn("Critical module preload error:", err);
    });
  }, []);

  // Preload deferred modules on idle work
  useEffect(() => {
    return scheduleIdleWork(() => {
      void preloadDeferredAppModules();
    }, 50);
  }, []);

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

  return (
    <ThemeProvider themeName="movies">
      <div
        className={`app-shell app-shell--viewport bg-main${isMobile ? " app-shell--mobile" : ""}`}
      >
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <SidebarRail
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
          onOpenQuiz={openQuizExperience}
        />

        <div className="app-shell__canvas app-shell__canvas--main app-shell__canvas--with-rail">
          <div
            className={`app-workspace-stack ${libraryWorkspaceStackClass(activeTab)}`}
          >
            <div
              className={`app-tab-shell ${isLibraryWorkspaceTab(activeTab) ? "app-tab-shell--movies" : `app-tab-shell--${activeTab}`} workspace-unified-shell`}
            >
              <WorkspaceErrorBoundary>
                <React.Suspense fallback={<WorkspaceTabFallback tab={activeTab} />}>
                  <AppWorkspaceShell
                    activeTab={activeTab}
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

        <ProfilePinPanel />
      </div>
    </ThemeProvider>
  );
};

const AppWithProviders: React.FC = () => (
  <AppProviders>
    <App />
  </AppProviders>
);

export default AppWithProviders;
