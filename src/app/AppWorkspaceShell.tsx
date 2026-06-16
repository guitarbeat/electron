import React, { type FC, useEffect, useRef, useState } from "react";

import type { MainTab } from "@/shared/types";
import MoviesView from "@/components/movies/MoviesView";
import BentoWorkspaceController from "@/components/ui/BentoWorkspaceController";
import { BentoSlotContext, type BentoSlotConfig } from "./BentoSlotContext";

const PlacesList = React.lazy(() => import("@/components/places/PlacesList"));

const PlacesTabFallback: FC = () => (
  <div
    className="watchlist-container places-container"
    role="status"
    aria-label="Loading places"
    aria-live="polite"
  >
    <div
      style={{
        padding: "2rem 1rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        opacity: 0.65,
        color: "var(--color-text-secondary)",
        fontFamily: "var(--font-interface)",
        fontSize: "0.9rem",
      }}
    >
      <span style={{ fontSize: "1.75rem", lineHeight: 1 }} aria-hidden="true">
        🗺️
      </span>
      <span>Loading places…</span>
    </div>
  </div>
);

interface AppWorkspaceShellProps {
  isMobile: boolean;
  activeTab: MainTab;
}

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({
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

  return (
    <BentoSlotContext.Provider value={{ setConfig: setBentoConfig, searchPortalEl }}>
      <main
        id="main-content"
        className={`workspace-stage workspace-stage--simplified${isMobile ? " workspace-stage--mobile-shell" : ""}`}
        tabIndex={-1}
        style={{ position: "relative", overflow: "hidden" }}
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
          {activeTab === "movies" ? (
            <MoviesView isMobile={isMobile} />
          ) : (
            <React.Suspense fallback={<PlacesTabFallback />}>
              <PlacesList />
            </React.Suspense>
          )}
        </section>
      </main>
    </BentoSlotContext.Provider>
  );
};

export default AppWorkspaceShell;
