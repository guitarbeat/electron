import React, { useEffect, useRef, useState } from "react";

import type { MainTab } from "@/shared/types";
import WorkspaceTabFallback from "@/components/ui/WorkspaceTabFallback";
import BentoWorkspaceController from "@/components/ui/BentoWorkspaceController";
import { BentoSlotContext, type BentoSlotConfig } from "./BentoSlotContext";

const MoviesView = React.lazy(() => import("@/components/movies/MoviesView"));
const PlacesList = React.lazy(() => import("@/components/places/PlacesList"));

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

  const previousTabRef = useRef(activeTab);
  useEffect(() => {
    if (previousTabRef.current === activeTab) {
      return;
    }
    previousTabRef.current = activeTab;
    setBentoConfig(null);
  }, [activeTab]);

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
          stats={bentoConfig?.stats ?? []}
          sorts={bentoConfig?.sorts ?? []}
          activeSortOrder={bentoConfig?.activeSortOrder ?? "recent"}
          onSortChange={bentoConfig?.onSortChange ?? (() => {})}
          ariaLabel={bentoConfig?.ariaLabel}
          viewModes={bentoConfig?.viewModes}
          activeViewMode={bentoConfig?.activeViewMode}
          onViewModeChange={bentoConfig?.onViewModeChange}
          viewModeAriaLabel={bentoConfig?.viewModeAriaLabel}
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
