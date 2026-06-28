import React, { useCallback, useMemo, useState } from "react";

import type { MainTab } from "@/shared/types";
import WorkspaceTabFallback from "@/components/ui/WorkspaceTabFallback";
import FloatingWorkspacePanel, {
  type FloatingWorkspacePanelProps,
} from "@/components/ui/FloatingWorkspacePanel";
import type { WorkspaceChromeHeaderProps } from "@/components/ui/BentoWorkspaceController";
import ProfilePinPanel from "@/components/ui/ProfilePinPanel";
import { ProfilePinProvider } from "@/app/ProfilePinContext";
import {
  BentoSlotContext,
  type RegisteredBentoSlotConfig,
} from "./BentoSlotContext";

const MoviesView = React.lazy(() => import("@/components/movies/MoviesView"));
const PlacesList = React.lazy(() => import("@/components/places/PlacesList"));

const EMPTY_BENTO_CONFIG: RegisteredBentoSlotConfig = {};

type AppWorkspaceShellProps = WorkspaceChromeHeaderProps & {
  onOpenMessages?: () => void;
  onOpenQuiz?: () => void;
  onOpenSpin?: () => void;
};

const AppWorkspaceShell: React.FC<AppWorkspaceShellProps> = ({
  activeTab,
  onTabChange,
  pwaStatus,
  onInstallApp,
  onApplyUpdate,
  onRetrySync,
  onOpenMessages,
  onOpenQuiz,
  onOpenSpin,
}) => {
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
      <ProfilePinProvider>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {activeTab === "movies" ? "Movies workspace" : "Places workspace"}
        </p>

        <main
          id="main-content"
          className="workspace-stage workspace-stage--simplified workspace-stage--fullbleed"
          tabIndex={-1}
          style={{ position: "relative" }}
        >
          <ProfilePinPanel />

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

        {/* Floating command panel — replaces the sticky topbar */}
        <FloatingWorkspacePanel
          activeTab={activeTab}
          onTabChange={onTabChange}
          pwaStatus={pwaStatus}
          onInstallApp={onInstallApp}
          onApplyUpdate={onApplyUpdate}
          onRetrySync={onRetrySync}
          ariaLabel={bento.ariaLabel}
          viewModes={bento.viewModes}
          activeViewMode={bento.activeViewMode}
          onViewModeChange={bento.onViewModeChange}
          viewModeAriaLabel={bento.viewModeAriaLabel}
          onOpenMessages={onOpenMessages}
          onOpenQuiz={onOpenQuiz}
          onOpenSpin={onOpenSpin}
        >
          <div ref={setSearchPortalEl} style={{ width: "100%" }} />
        </FloatingWorkspacePanel>
      </ProfilePinProvider>
    </BentoSlotContext.Provider>
  );
};

export default AppWorkspaceShell;
