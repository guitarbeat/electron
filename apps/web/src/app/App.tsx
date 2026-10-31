import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useUser, useViewport } from "@/app/providerContexts";
import { ThemeProvider } from "@/app/providers";
import { usePwaRuntime } from "@/hooks";
import WorkspaceErrorBoundary from "@/app/WorkspaceErrorBoundary";
import { useAppTabNavigation } from "@/hooks";
import { useMediaQuery } from "@/hooks";
import { useTvSpatialNavigation } from "@/hooks";

import {
  MinigameModal,
  ProfilePinPanel,
  WorkspaceTabFallback,
  ViewportFrame,
  Vignette,
} from "@/components/ui";
import AppWorkspaceShell, { type TogglePanel } from "@/app/AppWorkspaceShell";
import {
  isLibraryWorkspaceTab,
  libraryWorkspaceStackClass,
} from "@/utils/workspaceConfig";
import { AppProviders } from "@/app/AppProviders";
import { GlobalErrorBoundary } from "@/app/GlobalErrorBoundary";
import "./globals.css";
import "./component-styles.css";

const modalBodyStyle = {
  flex: 1,
  overflowY: "auto",
} satisfies React.CSSProperties;

/** Settings, the wall's own way back in, gets focus when the quiz closes. */
const focusSettingsTrigger = () => {
  window.requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>('.y2k-command-dock__filters [data-notch-trigger="bottom"]')
      ?.focus({ preventScroll: true });
  });
};

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
  const [openPanels, setOpenPanels] = useState<Set<TogglePanel>>(() => {
    const next = new Set<TogglePanel>();
    if (initialViewState.showMessages) next.add("messages");
    return next;
  });

  const [quizCompleted, setQuizCompleted] = useState<boolean>(() =>
    readQuizCompletionState(currentUser),
  );
  const [showQuizExperience, setShowQuizExperience] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);

  useEffect(() => {
    setQuizCompleted(readQuizCompletionState(currentUser));
  }, [currentUser]);

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

  // The Movie quiz button in Settings opens the quiz with this event.
  useEffect(() => {
    const handleOpenQuiz = () => setShowQuizExperience(true);
    window.addEventListener("open-quiz-experience", handleOpenQuiz);
    return () => window.removeEventListener("open-quiz-experience", handleOpenQuiz);
  }, []);

  const setQuizExperienceOpen = useCallback((open: boolean) => {
    setShowQuizExperience(open);
    if (!open) focusSettingsTrigger();
  }, []);
  const setQuizEditorOpen = useCallback((open: boolean) => {
    setShowQuizEditor(open);
    if (!open) focusSettingsTrigger();
  }, []);

  const featureModals = useMemo(
    () =>
      buildFeatureModals({
        showMessages: false,
        showQuizEditor,
        showQuizExperience,
        showSpinMatch: false,
        quizCompleted,
        currentUser,
        setShowMessages: () => {},
        setShowQuizEditor: setQuizEditorOpen,
        setShowQuizExperience: setQuizExperienceOpen,
        setShowSpinMatch: () => {},
        onQuizComplete: (outcome?: QuizResult) => updateQuizCompletion(true, outcome),
        onQuizRetake: () => updateQuizCompletion(false, null),
        onQuizEdit: () => {
          setShowQuizExperience(false);
          setShowQuizEditor(true);
        },
      }).filter((modal) => modal.key.startsWith("quiz")),
    [currentUser, quizCompleted, setQuizEditorOpen, setQuizExperienceOpen, showQuizEditor, showQuizExperience, updateQuizCompletion],
  );

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
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        APP_VIEW_STATE_KEY,
        JSON.stringify({
          activeTab,
        } satisfies StoredAppViewState),
      );
    } catch {
      // Ignore storage quota or private mode errors
    }
  }, [activeTab]);

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

  return (
    <ThemeProvider themeName="movies">
      <div
        className={`app-shell app-shell--viewport bg-main${isMobile ? " app-shell--mobile" : ""}`}
      >
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        {/* Viewport Frame with signature round border edge */}
        <ViewportFrame />

        {/* Vignette edge lighting from woods.engineer */}
        <Vignette top bottom left right />

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
  <GlobalErrorBoundary
    moduleName="AppProviders"
    fallbackTitle="PROVIDER INITIALIZATION FAULT"
    fallbackDescription="A critical error occurred while mounting the workspace context providers."
  >
    <AppProviders>
      <App />
    </AppProviders>
  </GlobalErrorBoundary>
);

export default AppWithProviders;
