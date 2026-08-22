import React, { useCallback, useMemo, useState } from "react";

import type { MainTab } from "@/shared/types";
import WorkspaceTabFallback from "@/components/ui/WorkspaceTabFallback";
import { useUser } from "@/app/useProviders";
import {
  BentoSlotContext,
  type RegisteredBentoSlotConfig,
} from "./BentoSlotContext";
import {
  isLibraryWorkspaceTab,
} from "@/utils/libraryWorkspace";

import LibraryWorkspace from "@/components/library/LibraryWorkspace";
import MemoriesView from "@/components/memories/MemoriesView";
import MessageBoard from "@/components/messages/MessageBoard";
import QuizExperience from "@/components/quiz/QuizExperience";
import SpinSwipeGame from "@/components/spin-match/SpinSwipeGame";

export type TogglePanel = "messages" | "quiz" | "spin";

type AppWorkspaceShellProps = {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenMessages?: () => void;
  onOpenQuiz?: () => void;
  onOpenSpin?: () => void;
  openPanels: Set<TogglePanel>;
  onTogglePanel: (panel: TogglePanel) => void;
};

const AppWorkspaceShell: React.FC<AppWorkspaceShellProps> = ({
  activeTab,
  onTabChange,
  openPanels,
  onTogglePanel,
}) => {
  const [, setTabConfigs] = useState<Partial<Record<MainTab, RegisteredBentoSlotConfig>>>({});
  const [searchPortalEl, setSearchPortalEl] = useState<HTMLDivElement | null>(
    null,
  );
  const { currentUser } = useUser();

  const registerTabConfig = useCallback(
    (tab: MainTab, config: RegisteredBentoSlotConfig) => {
      setTabConfigs((previous) => ({ ...previous, [tab]: config }));
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      activeTab,
      registerTabConfig,
      searchPortalEl,
    }),
    [activeTab, registerTabConfig, searchPortalEl],
  );

  const workspaceContent = isLibraryWorkspaceTab(activeTab) ? (
    <LibraryWorkspace />
  ) : activeTab === "memories" ? (
    <MemoriesView onJumpToMovies={() => onTabChange("movies")} />
  ) : (
    <MessageBoard />
  );

  return (
    <BentoSlotContext.Provider value={contextValue}>
      <h1 className="sr-only">
        {isLibraryWorkspaceTab(activeTab) ? "Movies & Places" :
         activeTab === "memories" ? "Memory Board" :
         "Message Board"}
      </h1>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {isLibraryWorkspaceTab(activeTab) ? "Movies and places workspace" :
         activeTab === "memories" ? "Memories workspace" :
         "Messages workspace"}
      </p>

      {/* Main content area */}
      <main
        id="main-content"
        className="workspace-stage workspace-stage--simplified workspace-stage--fullbleed"
        tabIndex={-1}
      >
        {/* Toggle panels — inline, all can be open simultaneously */}
        {openPanels.size > 0 && (
          <div className="toggle-panels">
            {openPanels.has("messages") && (
              <section className="toggle-panel toggle-panel--messages" aria-label="Messages">
                <div className="toggle-panel__header">
                  <h2 className="toggle-panel__title">Messages</h2>
                  <button
                    type="button"
                    className="toggle-panel__close"
                    onClick={() => onTogglePanel("messages")}
                    aria-label="Close messages"
                  >
                    ×
                  </button>
                </div>
                <React.Suspense fallback={null}>
                  <MessageBoard />
                </React.Suspense>
              </section>
            )}

            {openPanels.has("quiz") && (
              <section className="toggle-panel toggle-panel--quiz" aria-label="Quiz">
                <div className="toggle-panel__header">
                  <h2 className="toggle-panel__title">Quiz</h2>
                  <button
                    type="button"
                    className="toggle-panel__close"
                    onClick={() => onTogglePanel("quiz")}
                    aria-label="Close quiz"
                  >
                    ×
                  </button>
                </div>
                <React.Suspense fallback={null}>
                  <QuizExperience
                    currentUser={currentUser}
                    quizCompleted={false}
                    onComplete={() => {}}
                    onRetake={() => {}}
                  />
                </React.Suspense>
              </section>
            )}

            {openPanels.has("spin") && (
              <section className="toggle-panel toggle-panel--spin" aria-label="Spin">
                <div className="toggle-panel__header">
                  <h2 className="toggle-panel__title">Spin</h2>
                  <button
                    type="button"
                    className="toggle-panel__close"
                    onClick={() => onTogglePanel("spin")}
                    aria-label="Close spin"
                  >
                    ×
                  </button>
                </div>
                <React.Suspense fallback={null}>
                  <SpinSwipeGame />
                </React.Suspense>
              </section>
            )}
          </div>
        )}

        {/* Primary workspace content */}
        <section
          className={`workspace-surface workspace-surface--${isLibraryWorkspaceTab(activeTab) ? "movies" : activeTab}`}
          style={{ position: "relative", zIndex: 1, minWidth: 0 }}
          aria-label={
            isLibraryWorkspaceTab(activeTab) ? "Movies and places workspace" :
            activeTab === "memories" ? "Memories workspace" :
            "Messages workspace"
          }
        >
          <React.Suspense fallback={<WorkspaceTabFallback tab={activeTab} />}>
            {workspaceContent}
          </React.Suspense>
        </section>

        {/* Search portal for workspace components */}
        <div ref={setSearchPortalEl} style={{ display: "none" }} />
      </main>
    </BentoSlotContext.Provider>
  );
};

export default AppWorkspaceShell;

