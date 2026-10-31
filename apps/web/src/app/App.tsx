import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  APP_VIEW_STATE_KEY,
  readInitialAppViewState,
  stripLaunchUrlShortcuts,
  type StoredAppViewState,
} from "@/app/appViewState";

import { useViewport } from "@/app/providerContexts";
import { ThemeProvider } from "@/app/providers";
import { usePwaRuntime } from "@/hooks";
import WorkspaceErrorBoundary from "@/app/WorkspaceErrorBoundary";
import { useAppTabNavigation } from "@/hooks";
import { useMediaQuery } from "@/hooks";
import { useTvSpatialNavigation } from "@/hooks";

import {
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

const App: React.FC = () => {
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
