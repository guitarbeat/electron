import React, { useCallback, useMemo, useState } from "react";

import type { MainTab } from "@/shared/types";
import WorkspaceTabFallback from "@/components/ui/WorkspaceTabFallback";
import BentoWorkspaceController, {
  type WorkspaceChromeHeaderProps,
} from "@/components/ui/BentoWorkspaceController";
import WorkspaceKeyboardHelp from "@/components/ui/WorkspaceKeyboardHelp";
import { useViewport } from "@/app/ViewportContext";
import { useWorkspaceKeyboardHelp } from "@/hooks/useWorkspaceKeyboardHelp";
import {
  BentoSlotContext,
  type RegisteredBentoSlotConfig,
} from "./BentoSlotContext";

const MoviesView = React.lazy(() => import("@/components/movies/MoviesView"));
const PlacesList = React.lazy(() => import("@/components/places/PlacesList"));

const EMPTY_BENTO_CONFIG: RegisteredBentoSlotConfig = {};

interface AppWorkspaceShellProps extends WorkspaceChromeHeaderProps {}

const AppWorkspaceShell: React.FC<AppWorkspaceShellProps> = ({
  activeTab,
  onTabChange,
  onOpenMessages,
  onOpenQuiz,
  quizCompleted,
  pwaStatus,
  onInstallApp,
  onApplyUpdate,
  onRetrySync,
  onOpenSpin,
}) => {
  const { isMobile } = useViewport();
  const keyboardHelp = useWorkspaceKeyboardHelp();
  const [tabConfigs, setTabConfigs] = useState<
    Partial<Record<MainTab, RegisteredBentoSlotConfig>>
  >({});
  const [searchPortalEl, setSearchPortalEl] = useState<HTMLDivElement | null>(
    null,
  );

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

  const bento = tabConfigs[activeTab] ?? EMPTY_BENTO_CONFIG;
  const workspaceContent =
    activeTab === "movies" ? <MoviesView /> : <PlacesList />;

  return (
    <BentoSlotContext.Provider value={contextValue}>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {activeTab === "movies" ? "Movies workspace" : "Places workspace"}
      </p>
      <p className="sr-only">
        Press question mark for keyboard shortcuts.
      </p>
      <WorkspaceKeyboardHelp
        isOpen={keyboardHelp.isOpen}
        onClose={keyboardHelp.close}
      />
      <main
        id="main-content"
        className={`workspace-stage workspace-stage--simplified${isMobile ? " workspace-stage--mobile-shell" : ""}`}
        tabIndex={-1}
        style={{ position: "relative" }}
      >
        <BentoWorkspaceController
          activeTab={activeTab}
          onTabChange={onTabChange}
          onOpenMessages={onOpenMessages}
          onOpenQuiz={onOpenQuiz}
          quizCompleted={quizCompleted}
          pwaStatus={pwaStatus}
          onInstallApp={onInstallApp}
          onApplyUpdate={onApplyUpdate}
          onRetrySync={onRetrySync}
          onOpenSpin={onOpenSpin}
          ariaLabel={bento.ariaLabel}
          viewModes={bento.viewModes}
          activeViewMode={bento.activeViewMode}
          onViewModeChange={bento.onViewModeChange}
          viewModeAriaLabel={bento.viewModeAriaLabel}
          onOpenKeyboardHelp={keyboardHelp.open}
        >
          <div ref={setSearchPortalEl} />
        </BentoWorkspaceController>

        <section
          className={`workspace-surface workspace-surface--${activeTab}`}
          style={{ position: "relative", zIndex: 1, minWidth: 0 }}
          aria-label={
            activeTab === "movies" ? "Movies workspace" : "Places workspace"
          }
        >
          <React.Suspense fallback={<WorkspaceTabFallback tab={activeTab} />}>
            {workspaceContent}
          </React.Suspense>
        </section>
      </main>
    </BentoSlotContext.Provider>
  );
};

export default AppWorkspaceShell;
