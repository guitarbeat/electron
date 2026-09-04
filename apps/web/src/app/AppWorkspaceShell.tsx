import React, {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  copyTextToClipboard,
  formatDiagnosticReport,
  getErrorMessage,
  prefersReducedMotion,
} from "../utils";
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
import { BuildInfoBadge } from "./BuildInfoBadge";
import {
  MessageBoardPanel as MessageBoard,
  SpinSwipeGamePanel as SpinSwipeGame,
} from "./lazyFeaturePanels";

// ============================================================================
// GlobalErrorBoundary Component (Y2K Retro-Themed Sub-Component Fallback)
// ============================================================================

export interface GlobalErrorBoundaryProps {
  children: ReactNode;
  moduleName?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onReset?: () => void;
}

export interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: unknown;
  errorInfo: React.ErrorInfo | null;
  errorTime: string | null;
  copiedDump: boolean;
  retryCount: number;
}

/**
 * Robust Global Error Boundary featuring a Y2K cyber-retro diagnostic
 * display ('font-retro' aesthetic) when sub-components crash, logging comprehensive
 * component stack traces and diagnostic context to the centralized logger.
 */
export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  private copyTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorTime: null,
      copiedDump: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: unknown): Partial<GlobalErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorTime: new Date().toISOString(),
    };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    const moduleName = this.props.moduleName || "WorkspaceShellModule";
    const componentStack = errorInfo.componentStack ?? "";

    this.setState({ errorInfo });

    // Log critical crash and component stack traces directly to centralized logger
    void logger.logCriticalError(error, {
      module: moduleName,
      componentStack,
      boundary: "GlobalErrorBoundary",
      retryCount: this.state.retryCount,
      extra: {
        fallbackTitle: this.props.fallbackTitle,
        fallbackDescription: this.props.fallbackDescription,
      },
    });
  }

  componentWillUnmount(): void {
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
    }
  }

  private handleReboot = (): void => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (err) {
        console.warn("[GlobalErrorBoundary] onReset error:", err);
      }
    }

    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorTime: null,
      copiedDump: false,
      retryCount: prev.retryCount + 1,
    }));
  };

  private handleReloadSystem = (): void => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private handleCopyDump = async (): Promise<void> => {
    const moduleName = this.props.moduleName || "WorkspaceShellModule";
    const report = formatDiagnosticReport(this.state.error, {
      componentStack: this.state.errorInfo?.componentStack,
      context: {
        theme: "Y2K_DIAGNOSTIC_CORE_DUMP",
        module: moduleName,
        retryCount: this.state.retryCount,
        crashTime: this.state.errorTime,
      },
    });

    try {
      await copyTextToClipboard(report);
      this.setState({ copiedDump: true });
      if (this.copyTimeout) clearTimeout(this.copyTimeout);
      this.copyTimeout = setTimeout(() => {
        this.setState({ copiedDump: false });
      }, 3000);
    } catch (err) {
      console.warn("[GlobalErrorBoundary] Failed to copy core dump to clipboard:", err);
    }
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const moduleName = this.props.moduleName || "CORE_SUBSYSTEM";
    const errorMessage = getErrorMessage(
      this.state.error,
      "AN UNEXPECTED Y2K KERNEL FAULT HAS OCCURRED IN THIS COMPONENT.",
    );
    const stackTrace =
      this.state.error instanceof Error
        ? this.state.error.stack
        : String(this.state.error || "NO_STACK_AVAILABLE");
    const componentStack = this.state.errorInfo?.componentStack;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="y2k-error-boundary-container font-retro"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          minHeight: "18rem",
          width: "100%",
          boxSizing: "border-box",
          fontFamily: "var(--font-retro, 'Plus Jakarta Sans', system-ui, sans-serif)",
        }}
      >
        {/* Y2K Retro Window Shell */}
        <div
          className="y2k-error-window font-retro"
          style={{
            maxWidth: "44rem",
            width: "100%",
            backgroundColor: "#050814",
            border: "2px solid #00f0ff",
            boxShadow:
              "0 0 0 1px #002244, 4px 4px 0px 0px rgba(0, 240, 255, 0.4), 0 20px 50px rgba(0, 0, 0, 0.8)",
            borderRadius: "4px",
            overflow: "hidden",
            color: "#d0f0fd",
            fontFamily: "var(--font-retro, 'Plus Jakarta Sans', system-ui, sans-serif)",
          }}
        >
          {/* Y2K Retro Window Title Bar */}
          <div
            className="y2k-title-bar"
            style={{
              background: "linear-gradient(90deg, #0033aa 0%, #0066cc 60%, #00f0ff 100%)",
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "2px solid #00f0ff",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.82rem",
              letterSpacing: "0.05em",
              userSelect: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1rem" }}>💾</span>
              <span style={{ textTransform: "uppercase" }}>
                SYSTEM_EXCEPTION // {moduleName}
              </span>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "18px",
                  height: "18px",
                  backgroundColor: "#0a1e3f",
                  border: "1px solid #ffffff",
                  fontSize: "10px",
                  fontWeight: 900,
                  color: "#ffffff",
                  lineHeight: 1,
                  boxShadow: "inset 1px 1px 0 #3b82f6",
                }}
              >
                _
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "18px",
                  height: "18px",
                  backgroundColor: "#0a1e3f",
                  border: "1px solid #ffffff",
                  fontSize: "10px",
                  fontWeight: 900,
                  color: "#ffffff",
                  lineHeight: 1,
                  boxShadow: "inset 1px 1px 0 #3b82f6",
                }}
              >
                □
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "18px",
                  height: "18px",
                  backgroundColor: "#ff0055",
                  border: "1px solid #ffffff",
                  fontSize: "10px",
                  fontWeight: 900,
                  color: "#ffffff",
                  lineHeight: 1,
                }}
              >
                ✕
              </span>
            </div>
          </div>

          {/* Window Body */}
          <div style={{ padding: "1.25rem 1.25rem 1.5rem" }}>
            {/* Banner Alert Header */}
            <div
              style={{
                backgroundColor: "rgba(255, 0, 85, 0.12)",
                border: "1px solid #ff0055",
                padding: "0.75rem 1rem",
                borderRadius: "2px",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "1.35rem", lineHeight: 1 }}>⚠️</span>
              <div>
                <div
                  style={{
                    color: "#ff3366",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    letterSpacing: "0.03em",
                    marginBottom: "2px",
                  }}
                >
                  {this.props.fallbackTitle || "FATAL CRASH: MODULE FAULT 0xY2K"}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#fca5a5", lineHeight: 1.4 }}>
                  {this.props.fallbackDescription ||
                    "A critical component crashed during runtime. Safe failure protocol is engaged."}
                </div>
              </div>
            </div>

            {/* Error Metadata Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "8px",
                marginBottom: "1rem",
                fontSize: "0.75rem",
                backgroundColor: "#02040a",
                padding: "0.6rem 0.75rem",
                border: "1px solid rgba(0, 240, 255, 0.25)",
              }}
            >
              <div>
                <span style={{ color: "#00f0ff", fontWeight: 700 }}>MODULE:</span> {moduleName}
              </div>
              <div>
                <span style={{ color: "#00f0ff", fontWeight: 700 }}>TIMESTAMP:</span>{" "}
                {this.state.errorTime ? this.state.errorTime.slice(11, 19) : "N/A"}
              </div>
              <div>
                <span style={{ color: "#00f0ff", fontWeight: 700 }}>RETRIES:</span> {this.state.retryCount}
              </div>
            </div>

            {/* Raw Error Message */}
            <div
              style={{
                backgroundColor: "#080c1d",
                border: "1px solid rgba(0, 240, 255, 0.4)",
                padding: "0.75rem",
                marginBottom: "1rem",
                fontSize: "0.8rem",
                color: "#38bdf8",
                wordBreak: "break-word",
                lineHeight: 1.45,
              }}
            >
              <span style={{ color: "#f43f5e", fontWeight: 700 }}>ERROR: </span>
              {errorMessage}
            </div>

            {/* Collapsible Stack / Core Dump with Component Tree */}
            <details
              style={{
                marginBottom: "1.25rem",
                backgroundColor: "#030611",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                padding: "0.5rem 0.75rem",
                borderRadius: "2px",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  color: "#94a3b8",
                  userSelect: "none",
                  outline: "none",
                }}
              >
                [+] VIEW SYSTEM CORE DUMP & COMPONENT STACK
              </summary>
              <pre
                style={{
                  margin: "0.6rem 0 0",
                  padding: "0.6rem",
                  backgroundColor: "#000000",
                  border: "1px dashed #334155",
                  fontSize: "0.68rem",
                  color: "#4ade80",
                  lineHeight: 1.4,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  maxHeight: "11rem",
                  overflowY: "auto",
                  fontFamily: "'Courier New', Courier, monospace, ui-monospace",
                }}
              >
                {stackTrace}
                {componentStack && (
                  <>
                    {"\n\n--- REACT COMPONENT TREE ---\n"}
                    {componentStack.trim()}
                  </>
                )}
              </pre>
            </details>

            {/* Y2K Retro Action Buttons */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.6rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={this.handleCopyDump}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-retro, 'Plus Jakarta Sans', system-ui, sans-serif)",
                  fontWeight: 700,
                  backgroundColor: "#0f172a",
                  color: this.state.copiedDump ? "#4ade80" : "#94a3b8",
                  border: "2px solid #334155",
                  boxShadow: "inset 1px 1px 0 #475569, inset -1px -1px 0 #020617",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span>{this.state.copiedDump ? "✓ COPIED DUMP" : "📋 COPY DUMP"}</span>
              </button>

              <button
                type="button"
                onClick={this.handleReboot}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-retro, 'Plus Jakarta Sans', system-ui, sans-serif)",
                  fontWeight: 700,
                  backgroundColor: "#0284c7",
                  color: "#ffffff",
                  border: "2px solid #38bdf8",
                  boxShadow: "inset 1px 1px 0 #7dd3fc, inset -1px -1px 0 #0369a1",
                  cursor: "pointer",
                }}
              >
                ⚡ REBOOT MODULE
              </button>

              <button
                type="button"
                onClick={this.handleReloadSystem}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-retro, 'Plus Jakarta Sans', system-ui, sans-serif)",
                  fontWeight: 700,
                  backgroundColor: "#ff0055",
                  color: "#ffffff",
                  border: "2px solid #ff4d88",
                  boxShadow: "inset 1px 1px 0 #ff80aa, inset -1px -1px 0 #990033",
                  cursor: "pointer",
                }}
              >
                🔄 RESTART APP
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

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
  const hasInlinePanels = openPanels.has("spin");
  const [chatRendered, setChatRendered] = useState(isChatOpen);
  const [chatClosing, setChatClosing] = useState(false);

  // Initialize Web Vitals and initial navigation timing observability on shell mount
  useEffect(() => {
    logger.initWebVitalsObservability("AppWorkspaceShell:WebVitals");
  }, []);

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
        {isLibraryWorkspaceTab(activeTab) ? "Movies & Places" : "Message Board"}
      </h1>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {isLibraryWorkspaceTab(activeTab)
          ? "Movies and places workspace"
          : "Messages workspace"}
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
              <section
                className="toggle-panel toggle-panel--spin"
                aria-label="Spin"
              >
                <div className="toggle-panel__header">
                  <h2 className="toggle-panel__title">Spin</h2>
                  <button
                    type="button"
                    className="toggle-panel__close"
                    onClick={() => handleTogglePanel("spin")}
                    aria-label="Close spin"
                  >
                    ×
                  </button>
                </div>
                <GlobalErrorBoundary moduleName="SpinWheelGame">
                  <React.Suspense fallback={null}>
                    <SpinSwipeGame />
                  </React.Suspense>
                </GlobalErrorBoundary>
              </section>
            )}
          </div>
        )}

        {/* Primary workspace content */}
        <section
          className={`workspace-surface workspace-surface--${isLibraryWorkspaceTab(activeTab) ? "movies" : activeTab}`}
          style={{ position: "relative", zIndex: 1, minWidth: 0 }}
          aria-label={
            isLibraryWorkspaceTab(activeTab)
              ? "Movies and places workspace"
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

        {/* Floating Chat Panel Dock */}
        {chatRendered ? (
          <section
            id="floating-chat-panel"
            className={`chat-dock${chatClosing ? " is-closing" : ""}`}
            aria-label="Messages"
            aria-live="polite"
            aria-hidden={chatClosing}
          >
            <button
              type="button"
              className="chat-dock__close"
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
        <div
          className="floating-dock-cluster"
          role="region"
          aria-label="Quick profile controls"
        >
          <BuildInfoBadge />
          <div className="floating-dock-cluster__profiles">
            <ProfileMenu />
          </div>
        </div>
      </main>
    </BentoSlotContext.Provider>
  );
};

export default AppWorkspaceShell;

