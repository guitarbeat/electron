import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import {
  APP_VIEW_STATE_KEY,
  readInitialAppViewState,
  stripLaunchUrlShortcuts,
  type StoredAppViewState,
} from "@/app/appViewState";
import { buildFeatureModals } from "@/app/buildMinigameModals";
import {
  readQuizCompletionState,
  writeQuizCompletionState,
  writeUserQuizOutcome,
} from "@/app/quizCompletionStorage";
import type { QuizResult } from "@/shared/types";

import { useViewport, useUser } from "@/app/providerContexts";
import { ThemeProvider } from "@/app/providers";
import { usePwaRuntime } from "@/hooks";
import WorkspaceErrorBoundary from "@/app/WorkspaceErrorBoundary";
import { useAppTabNavigation } from "@/hooks";
import { useMediaQuery } from "@/hooks";
import { useTvSpatialNavigation } from "@/hooks";

import { MinigameModal } from "@/components/ui";
import { ProfilePinPanel } from "@/components/ui";
import { WorkspaceTabFallback } from "@/components/ui";
import type { TogglePanel } from "@/app/AppWorkspaceShell";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
const AppWorkspaceShell = lazyWithRetry(
  () => import("@/app/AppWorkspaceShell"),
);
import {
  isLibraryWorkspaceTab,
  libraryWorkspaceStackClass,
} from "@/utils/workspaceConfig";
import { prefetchCatPosters } from "@/utils/catPosters";
import { AppProviders } from "@/app/AppProviders";
import "./globals.css";
import "./component-styles.css";

const modalBodyStyle = {
  flex: 1,
  overflowY: "auto",
} satisfies React.CSSProperties;

const App: React.FC = () => {
  const { currentUser } = useUser();
  usePwaRuntime();
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
    prefetchCatPosters();
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
    (completed: boolean, outcome?: QuizResult | null) => {
      setQuizCompleted(completed);
      writeQuizCompletionState(currentUser, completed);
      if (completed && outcome) {
        writeUserQuizOutcome(currentUser, outcome);
      } else if (!completed) {
        writeUserQuizOutcome(currentUser, null);
      }
    },
    [currentUser],
  );

  const openQuizExperience = useCallback(() => {
    setShowQuizExperience(true);
  }, []);

  const openSpinExperience = useCallback(() => {
    setShowSpinMatch(true);
  }, []);

  useEffect(() => {
    const handleOpenQuiz = () => {
      openQuizExperience();
    };
    window.addEventListener("open-quiz-experience", handleOpenQuiz);
    return () => {
      window.removeEventListener("open-quiz-experience", handleOpenQuiz);
    };
  }, [openQuizExperience]);

  useEffect(() => {
    const handleOpenSpin = () => {
      openSpinExperience();
    };
    window.addEventListener("open-spin-experience", handleOpenSpin);
    window.addEventListener("open-spin-match", handleOpenSpin);
    window.addEventListener("open-spin-game", handleOpenSpin);
    return () => {
      window.removeEventListener("open-spin-experience", handleOpenSpin);
      window.removeEventListener("open-spin-match", handleOpenSpin);
      window.removeEventListener("open-spin-game", handleOpenSpin);
    };
  }, [openSpinExperience]);

  useEffect(() => {
    const handleOpenChat = () => {
      setOpenPanels((prev) => {
        const next = new Set(prev);
        next.add("messages");
        return next;
      });
      window.setTimeout(() => {
        const input = document.querySelector<HTMLTextAreaElement | HTMLInputElement>(
          "#floating-chat-panel textarea, #floating-chat-panel input"
        );
        input?.focus();
      }, 120);
    };
    const handleToggleChat = () => {
      togglePanel("messages");
    };
    window.addEventListener("open-chat-experience", handleOpenChat);
    window.addEventListener("open-messages-experience", handleOpenChat);
    window.addEventListener("toggle-chat-panel", handleToggleChat);
    return () => {
      window.removeEventListener("open-chat-experience", handleOpenChat);
      window.removeEventListener("open-messages-experience", handleOpenChat);
      window.removeEventListener("toggle-chat-panel", handleToggleChat);
    };
  }, [togglePanel]);

  const handleQuizComplete = useCallback(
    (outcome?: QuizResult) => {
      updateQuizCompletion(true, outcome);
    },
    [updateQuizCompletion],
  );

  const handleQuizEdit = useCallback(() => {
    setShowQuizExperience(false);
    setShowQuizEditor(true);
  }, []);

  const handleQuizRetake = useCallback(() => {
    updateQuizCompletion(false, null);
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

        <div className="app-shell__canvas app-shell__canvas--main app-shell__canvas--with-rail">
          <div
            className={`app-workspace-stack ${libraryWorkspaceStackClass(activeTab)}`}
          >
            <div
              className={`app-tab-shell ${isLibraryWorkspaceTab(activeTab) ? "app-tab-shell--movies" : `app-tab-shell--${activeTab}`} workspace-unified-shell`}
            >
              <WorkspaceErrorBoundary>
                <React.Suspense
                  fallback={<WorkspaceTabFallback tab={activeTab} />}
                >
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
            isUnstyled={modal.isUnstyled}
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
    <SpeedInsights />
  </AppProviders>
);

export default AppWithProviders;
