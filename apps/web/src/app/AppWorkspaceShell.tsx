import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MessageCircle } from "lucide-react";
import { prefersReducedMotion } from "../utils";
import { logger } from "../services/logger";
import type { MainTab } from "../shared/types";
import {
  WorkspaceTabFallback,
  ProfileMenu,
} from "../components/ui";
import { BentoSlotContext } from "./providerContexts";
import type { RegisteredBentoSlotConfig } from "./providerContexts";
import { isLibraryWorkspaceTab } from "../utils/workspaceConfig";
import LibraryWorkspace from "../components/library/LibraryWorkspace";
import {
  MessageBoardPanel as MessageBoard,
} from "./lazyFeaturePanels";
import {
  GlobalErrorBoundary,
  type GlobalErrorBoundaryProps,
  type GlobalErrorBoundaryState,
} from "./GlobalErrorBoundary";

export {
  GlobalErrorBoundary,
  type GlobalErrorBoundaryProps,
  type GlobalErrorBoundaryState,
};

export type TogglePanel = "messages" | "spin";

// ============================================================================
// AppWorkspaceShell Component
// ============================================================================

type AppWorkspaceShellProps = {
  activeTab: MainTab;
  openPanels: Set<TogglePanel>;
  onTogglePanel: (panel: TogglePanel) => void;
};

const CHAT_EXIT_MS = 160;

const AppWorkspaceShell: React.FC<AppWorkspaceShellProps> = ({
  activeTab,
  openPanels,
  onTogglePanel,
}) => {
  const tabConfigsRef = useRef<
    Partial<Record<MainTab, RegisteredBentoSlotConfig>>
  >({});
  const [searchPortalEl, setSearchPortalEl] = useState<HTMLDivElement | null>(
    null,
  );
  const registerTabConfig = useCallback(
    (tab: MainTab, config: RegisteredBentoSlotConfig) => {
      tabConfigsRef.current[tab] = config;
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
    <LibraryWorkspace activeTab={activeTab} />
  ) : (
    <MessageBoard />
  );
  const isChatOpen = openPanels.has("messages");
  const [chatRendered, setChatRendered] = useState(isChatOpen);
  const [chatClosing, setChatClosing] = useState(false);

  // Performance timer observing tab transition and initial render responsiveness
  const prevTabRef = useRef<MainTab>(activeTab);
  useEffect(() => {
    const fromTab = prevTabRef.current;
    const timer = logger.startTimer(
      "workspace_tab_switch_duration_ms",
      { fromTab, toTab: activeTab },
      "AppWorkspaceShell",
    );
    prevTabRef.current = activeTab;

    const rafId = requestAnimationFrame(() => {
      void timer.stop({ activeTab });
    });

    return () => cancelAnimationFrame(rafId);
  }, [activeTab]);

  useEffect(() => {
    if (isChatOpen) {
      setChatRendered(true);
      setChatClosing(false);
      return;
    }
    if (!chatRendered) {
      return;
    }
    if (prefersReducedMotion()) {
      setChatRendered(false);
      setChatClosing(false);
      return;
    }
    setChatClosing(true);
    const timeoutId = window.setTimeout(() => {
      setChatRendered(false);
      setChatClosing(false);
    }, CHAT_EXIT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [chatRendered, isChatOpen]);

  // Capture unhandled window exceptions or promise rejections occurring within the workspace session
  useEffect(() => {
    const cleanup = logger.initGlobalErrorListeners(activeTab);
    return cleanup;
  }, [activeTab]);

  // Observed panel toggle handler that logs interaction latency and metrics
  const handleTogglePanel = useCallback(
    (panel: TogglePanel) => {
      const isCurrentlyOpen = openPanels.has(panel);
      void logger.logMetric(
        "panel_toggle_interaction",
        1,
        "count",
        {
          panel,
          action: isCurrentlyOpen ? "close" : "open",
          activeTab,
        },
        "AppWorkspaceShell",
      );
      onTogglePanel(panel);
    },
    [openPanels, onTogglePanel, activeTab],
  );

  // Handle Escape key to dismiss open chat panel
  useEffect(() => {
    if (!isChatOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleTogglePanel("messages");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isChatOpen, handleTogglePanel]);

  return (
    <BentoSlotContext.Provider value={contextValue}>
      <h1 className="sr-only">
        {isLibraryWorkspaceTab(activeTab) ? "Movies" : "Message Board"}
      </h1>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {isLibraryWorkspaceTab(activeTab)
          ? "Movies workspace"
          : "Messages workspace"}
      </p>

      {/* Main content area */}
      <main
        id="main-content"
        className="workspace-stage workspace-stage--simplified workspace-stage--fullbleed"
        tabIndex={-1}
      >
        {/* Primary workspace content */}
        <section
          className={`workspace-surface workspace-surface--${isLibraryWorkspaceTab(activeTab) ? "movies" : activeTab}`}
          style={{ position: "relative", minWidth: 0 }}
          aria-label={
            isLibraryWorkspaceTab(activeTab)
              ? "Movies workspace"
              : "Messages workspace"
          }
        >
          <GlobalErrorBoundary
            moduleName={`Workspace:${activeTab}`}
            fallbackTitle="WORKSPACE VIEW ERROR"
            fallbackDescription="The primary workspace view encountered a fatal render exception."
          >
            <React.Suspense fallback={<WorkspaceTabFallback tab={activeTab} />}>
              {workspaceContent}
            </React.Suspense>
          </GlobalErrorBoundary>
        </section>

        {/* Search portal for workspace components */}
        <div ref={setSearchPortalEl} style={{ display: "none" }} />

        {isLibraryWorkspaceTab(activeTab) ? (
          <div className="chat-fab-anchor">
            <button
              type="button"
              className={`chat-fab${isChatOpen ? " is-open" : ""}`}
              aria-label="Messages"
              aria-pressed={isChatOpen}
              aria-controls={chatRendered ? "floating-chat-panel" : undefined}
              onClick={() => handleTogglePanel("messages")}
            >
              <MessageCircle size={22} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        {/* Floating Chat Panel Dock */}
        {chatRendered ? (
          <section
            id="floating-chat-panel"
            className={`chat-dock${chatClosing ? " is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Messages"
            aria-hidden={chatClosing}
          >
            <button
              type="button"
              className="chat-dock__close"
              data-tv-close=""
              onClick={() => handleTogglePanel("messages")}
              aria-label="Close chat"
            >
              ×
            </button>
            <GlobalErrorBoundary moduleName="ChatDock">
              <React.Suspense fallback={null}>
                <MessageBoard />
              </React.Suspense>
            </GlobalErrorBoundary>
          </section>
        ) : null}

        {/* Floating Quick Controls (Profile Logins & Build Info) */}
        {!isLibraryWorkspaceTab(activeTab) ? <div
          className="floating-dock-cluster"
          role="region"
          aria-label="Quick profile controls"
        >
          <div className="floating-dock-cluster__profiles">
            <ProfileMenu />
          </div>
        </div> : null}
      </main>
    </BentoSlotContext.Provider>
  );
};

export default AppWorkspaceShell;

