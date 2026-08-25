import React, { useCallback, useMemo, useState } from "react";

import type { MainTab } from "@/shared/types";
import { MessageIcon, WorkspaceTabFallback, ProfileMenu } from "@/components/ui";
import { BentoSlotContext } from "@/app/providerContexts";
import type { RegisteredBentoSlotConfig } from "@/app/providerContexts";
import {
  isLibraryWorkspaceTab,
} from "@/utils/workspaceConfig";

import {
  LibraryWorkspacePanel as LibraryWorkspace,
  MessageBoardPanel as MessageBoard,
  SpinSwipeGamePanel as SpinSwipeGame,
} from "./lazyFeaturePanels";

export type TogglePanel = "messages" | "spin";

type AppWorkspaceShellProps = {
  activeTab: MainTab;
  openPanels: Set<TogglePanel>;
  onTogglePanel: (panel: TogglePanel) => void;
};

const AppWorkspaceShell: React.FC<AppWorkspaceShellProps> = ({
  activeTab,
  openPanels,
  onTogglePanel,
}) => {
  const [, setTabConfigs] = useState<Partial<Record<MainTab, RegisteredBentoSlotConfig>>>({});
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

  const workspaceContent = isLibraryWorkspaceTab(activeTab) ? (
    <LibraryWorkspace activeTab={activeTab} />
  ) : (
    <MessageBoard />
  );
  const isChatOpen = openPanels.has("messages");
  const hasInlinePanels = openPanels.has("spin");

  return (
    <BentoSlotContext.Provider value={contextValue}>
      <h1 className="sr-only">
        {isLibraryWorkspaceTab(activeTab) ? "Movies & Places" :
         "Message Board"}
      </h1>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {isLibraryWorkspaceTab(activeTab) ? "Movies and places workspace" :
         "Messages workspace"}
      </p>

      {/* Main content area */}
      <main
        id="main-content"
        className="workspace-stage workspace-stage--simplified workspace-stage--fullbleed"
        tabIndex={-1}
      >
        {/* Toggle panels — inline, all can be open simultaneously */}
        {hasInlinePanels && (
          <div className="toggle-panels">
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
            "Messages workspace"
          }
        >
          <React.Suspense fallback={<WorkspaceTabFallback tab={activeTab} />}>
            {workspaceContent}
          </React.Suspense>
        </section>

        {/* Search portal for workspace components */}
        <div ref={setSearchPortalEl} style={{ display: "none" }} />

        {/* Floating Chat Panel Dock */}
        {isChatOpen ? (
          <section
            id="floating-chat-panel"
            className="chat-dock"
            aria-label="Messages"
            aria-live="polite"
          >
            <button
              type="button"
              className="chat-dock__close"
              onClick={() => onTogglePanel("messages")}
              aria-label="Close chat"
            >
              ×
            </button>
            <React.Suspense fallback={null}>
              <MessageBoard />
            </React.Suspense>
          </section>
        ) : null}

        {/* Floating Quick Controls Cluster (Profile Logins + Chat Bubble) */}
        <div
          className="floating-dock-cluster"
          role="region"
          aria-label="Quick profile and messaging controls"
        >
          <div className="floating-dock-cluster__profiles">
            <ProfileMenu />
          </div>
          <div className="floating-dock-cluster__divider" aria-hidden="true" />
          <button
            type="button"
            className={`chat-fab${isChatOpen ? " is-open" : ""}`}
            onPointerEnter={() => void import("@/components/messages")}
            onFocus={() => void import("@/components/messages")}
            onClick={() => onTogglePanel("messages")}
            aria-label={isChatOpen ? "Close chat" : "Open chat"}
            aria-expanded={isChatOpen}
            aria-controls="floating-chat-panel"
          >
            <MessageIcon size={24} />
          </button>
        </div>
      </main>
    </BentoSlotContext.Provider>
  );
};

export default AppWorkspaceShell;
