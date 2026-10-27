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
import { cleanupOldImages } from "@/utils/imageCache";
import { AppProviders } from "@/app/AppProviders";
import { GlobalErrorBoundary } from "@/app/GlobalErrorBoundary";
import "./globals.css";
import "./component-styles.css";

const IDLE_CALLBACK_FALLBACK_TIMEOUT_MS = 2000;
const MIN_ARCADE_INTRO_MS = 560;
const MAX_ARCADE_WAIT_MS = 2200;
const ARCADE_EXIT_DURATION_MS = 720;

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
  const [isFrameCompact, setIsFrameCompact] = useState<boolean>(
    () => !prefersReducedMotion,
  );
  const [isBadgeExiting, setIsBadgeExiting] = useState<boolean>(false);
  const [isIntroMounted, setIsIntroMounted] = useState<boolean>(
    () => !prefersReducedMotion,
  );
  const [quizCompleted, setQuizCompleted] = useState<boolean>(() =>
    readQuizCompletionState(currentUser),
  );
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showQuizExperience, setShowQuizExperience] = useState(false);
  const [showSpinMatch, setShowSpinMatch] = useState(false);
  const [openPanels, setOpenPanels] = useState<Set<TogglePanel>>(new Set());

  useEffect(() => {
    if (prefersReducedMotion || typeof window === "undefined") {
      setIsFrameCompact(false);
      setIsBadgeExiting(true);
      setIsIntroMounted(false);
      return undefined;
    }

    let minTimeElapsed = false;
    let collectionReady =
      Boolean(
        (window as unknown as { __electronCollectionReady?: boolean })
          .__electronCollectionReady,
      ) || !isLibraryWorkspaceTab(activeTab);
    let hasTriggeredExpand = false;
    let unmountTimerId: number | undefined;

    const triggerExpansion = () => {
      if (hasTriggeredExpand) return;
      hasTriggeredExpand = true;
      setIsFrameCompact(false);
      setIsBadgeExiting(true);
      unmountTimerId = window.setTimeout(() => {
        setIsIntroMounted(false);
      }, ARCADE_EXIT_DURATION_MS);
    };

    const maybeTrigger = () => {
      if (minTimeElapsed && collectionReady) {
        triggerExpansion();
      }
    };

    const handleCollectionReady = () => {
      collectionReady = true;
      maybeTrigger();
    };

    window.addEventListener(
      "workspace-collection-ready",
      handleCollectionReady,
    );

    const minTimerId = window.setTimeout(() => {
      minTimeElapsed = true;
      maybeTrigger();
    }, MIN_ARCADE_INTRO_MS);

    const maxWaitTimerId = window.setTimeout(() => {
      minTimeElapsed = true;
      collectionReady = true;
      triggerExpansion();
    }, MAX_ARCADE_WAIT_MS);

    return () => {
      window.removeEventListener(
        "workspace-collection-ready",
        handleCollectionReady,
      );
      window.clearTimeout(minTimerId);
      window.clearTimeout(maxWaitTimerId);
      if (unmountTimerId !== undefined) {
        window.clearTimeout(unmountTimerId);
      }
    };
  }, [prefersReducedMotion, activeTab]);

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
    if (typeof window !== "undefined") {
      const scheduleIdle = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, IDLE_CALLBACK_FALLBACK_TIMEOUT_MS));
      scheduleIdle(() => {
        void cleanupOldImages().catch(() => {});
      });
    }
  }, []);

  useEffect(() => {
    setQuizCompleted(readQuizCompletionState(currentUser));
  }, [currentUser]);

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

        {/* Viewport Frame with signature round border edge — starts wrapping center arcade badge, then expands outward */}
        <ViewportFrame
          className={isFrameCompact ? "viewport-frame--compact" : ""}
        />

        {/* Center Aaron & Electra Retro Arcade Loading Badge framed by ViewportFrame */}
        {isIntroMounted ? (
          <div
            className={`y2k-arcade-loader${isBadgeExiting ? " is-exiting" : ""}`}
            role="status"
            aria-live="polite"
            aria-label="Loading Aaron and Electra movie collection"
          >
            <div className="y2k-arcade-loader__card">
              <div className="y2k-arcade-loader__header">
                <span>CINEMA ARCADE</span>
                <span className="y2k-arcade-loader__tag">2P CO-OP</span>
              </div>

              <div className="y2k-arcade-loader__players">
                <div className="y2k-arcade-loader__player y2k-arcade-loader__player--aaron">
                  <div className="y2k-arcade-loader__avatar-ring">
                    <img
                      src="/aaron-avatar.png"
                      alt="Aaron"
                      className="y2k-arcade-loader__avatar-img"
                      draggable={false}
                    />
                  </div>
                  <span className="y2k-arcade-loader__player-name">Aaron</span>
                </div>

                <span className="y2k-arcade-loader__versus" aria-hidden="true">
                  +
                </span>

                <div className="y2k-arcade-loader__player y2k-arcade-loader__player--electra">
                  <div className="y2k-arcade-loader__avatar-ring">
                    <img
                      src="/electra-button.png"
                      alt="Electra"
                      className="y2k-arcade-loader__avatar-img"
                      draggable={false}
                    />
                  </div>
                  <span className="y2k-arcade-loader__player-name">
                    Electra
                  </span>
                </div>
              </div>

              <div className="y2k-arcade-loader__footer">
                <div className="y2k-arcade-loader__bar" aria-hidden="true">
                  {Array.from({ length: 8 }, (_, idx) => (
                    <span
                      key={idx}
                      className="y2k-arcade-loader__segment"
                      style={
                        { "--seg-idx": idx } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
                <div className="y2k-arcade-loader__status">
                  <span>
                    {isBadgeExiting ? "READY TO WATCH" : "LOADING COLLECTION"}
                  </span>
                  <span>{isBadgeExiting ? "100%" : "SYNCING"}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

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
      <SpeedInsights />
    </AppProviders>
  </GlobalErrorBoundary>
);

export default AppWithProviders;
