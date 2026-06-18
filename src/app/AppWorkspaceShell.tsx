import React, { useState } from "react";

import type { MainTab } from "@/shared/types";
import WorkspaceTabFallback from "@/components/ui/WorkspaceTabFallback";
import BentoWorkspaceController from "@/components/ui/BentoWorkspaceController";
import { BentoSlotContext, type BentoSlotConfig } from "./BentoSlotContext";

const MoviesView = React.lazy(() => import("@/components/movies/MoviesView"));
const PlacesList = React.lazy(() => import("@/components/places/PlacesList"));

const EMPTY_BENTO_CONFIG: BentoSlotConfig = {
  stats: [],
  sorts: [],
  activeSortOrder: "recent",
  onSortChange: () => {},
};

interface AppWorkspaceShellProps {
  isMobile: boolean;
  activeTab: MainTab;
}

const AppWorkspaceShell: React.FC<AppWorkspaceShellProps> = ({
  isMobile,
  activeTab,
}) => {
  const [bentoConfig, setBentoConfig] = useState<BentoSlotConfig | null>(null);
  const [searchPortalEl, setSearchPortalEl] = useState<HTMLDivElement | null>(
    null,
  );

  const bento = bentoConfig ?? EMPTY_BENTO_CONFIG;
  const workspaceContent =
    activeTab === "movies" ? (
      <MoviesView isMobile={isMobile} />
    ) : (
      <PlacesList />
    );

  return (
    <BentoSlotContext.Provider value={{ setConfig: setBentoConfig, searchPortalEl }}>
      <main
        id="main-content"
        className={`workspace-stage workspace-stage--simplified${isMobile ? " workspace-stage--mobile-shell" : ""}`}
        tabIndex={-1}
        style={{ position: "relative" }}
      >
        <BentoWorkspaceController
          stats={bento.stats}
          sorts={bento.sorts}
          activeSortOrder={bento.activeSortOrder}
          onSortChange={bento.onSortChange}
          ariaLabel={bento.ariaLabel}
          viewModes={bento.viewModes}
          activeViewMode={bento.activeViewMode}
          onViewModeChange={bento.onViewModeChange}
          viewModeAriaLabel={bento.viewModeAriaLabel}
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
