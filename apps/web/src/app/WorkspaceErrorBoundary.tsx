import React, { Suspense, type ReactNode } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  Database,
  Lock,
  RefreshCw,
  Trash2,
  WifiOff,
} from "lucide-react";
import {
  copyTextToClipboard,
  formatDiagnosticReport,
  getErrorMessage,
  recordClientError,
} from "@/utils";

// ============================================================================
// AppSuspenseFallback Component
// ============================================================================

interface AppSuspenseFallbackProps {
  label?: string;
}

/**
 * Visible placeholder for lazy-loaded UI boundaries (replaces null Suspense fallbacks).
 */
export const AppSuspenseFallback: React.FC<AppSuspenseFallbackProps> = ({
  label = "Loading",
}) => (
  <div
    className="app-suspense-fallback"
    role="status"
    aria-live="polite"
    aria-label={label}
  >
    <span className="app-suspense-fallback-bar" aria-hidden="true" />
  </div>
);

// ============================================================================
// LazyBoundary Component
// ============================================================================

interface LazyBoundaryProps {
  children: ReactNode;
  label?: string;
}

export const LazyBoundary: React.FC<LazyBoundaryProps> = ({
  children,
  label,
}) => (
  <Suspense fallback={<AppSuspenseFallback label={label} />}>
    {children}
  </Suspense>
);

// ============================================================================
// WorkspaceErrorBoundary Component
// ============================================================================

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
  errorStack: string | null;
  componentStack: string | null;
  errorObject: unknown;
  copiedReport: boolean;
}

/**
 * Error boundary wrapping the lazy-loaded workspace shell.
 * Catches module-fetch failures and React render errors so the app
 * shows a recoverable fallback with rich diagnostics instead of a blank screen.
 */
export class WorkspaceErrorBoundary extends React.Component<Props, State> {
  private copyTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
      errorStack: null,
      componentStack: null,
      errorObject: null,
      copiedReport: false,
    };
  }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    const message = getErrorMessage(error, "An unexpected workspace error occurred.");
    const stack = error instanceof Error ? (error.stack ?? null) : null;
    return {
      hasError: true,
      errorMessage: message,
      errorStack: stack,
      errorObject: error,
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    const compStack = info.componentStack ?? null;
    this.setState({ componentStack: compStack });

    recordClientError(error, { context: "WorkspaceErrorBoundary" }, compStack ?? undefined);

    if (import.meta.env.DEV) {
      console.error("[WorkspaceErrorBoundary] caught error:", error, info);
    }
  }

  componentWillUnmount() {
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      errorMessage: null,
      errorStack: null,
      componentStack: null,
      errorObject: null,
      copiedReport: false,
    });
  };

  private handleClearCacheAndReload = () => {
    try {
      if (typeof window !== "undefined") {
        // Clear workspace scope storage caches
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (
            key &&
            (key.startsWith("movienight_") ||
              key.startsWith("movieList.") ||
              key.startsWith("workspace_"))
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => window.localStorage.removeItem(k));
      }
    } catch {
      // Ignore cleanup error
    }
    window.location.reload();
  };

  private handleCopyErrorReport = async () => {
    const report = formatDiagnosticReport(
      this.state.errorObject || this.state.errorMessage,
      { componentStack: this.state.componentStack },
    );

    try {
      await copyTextToClipboard(report);
      this.setState({ copiedReport: true });
      if (this.copyTimeout) clearTimeout(this.copyTimeout);
      this.copyTimeout = setTimeout(() => {
        this.setState({ copiedReport: false });
      }, 3000);
    } catch (err) {
      console.warn("Could not copy error report to clipboard", err);
    }
  };

  private getErrorCategory(): {
    icon: React.ReactNode;
    title: string;
    description: string;
    suggestion: string;
  } {
    const msg = (this.state.errorMessage ?? "").toLowerCase();

    if (
      msg.includes("failed to fetch") ||
      msg.includes("dynamically imported") ||
      msg.includes("loading chunk") ||
      msg.includes("module")
    ) {
      return {
        icon: (
          <RefreshCw
            size={36}
            strokeWidth={1.8}
            style={{ color: "var(--color-accent, #38bdf8)" }}
          />
        ),
        title: "Connection interrupted",
        description: "A part of the app couldn't be loaded from the server.",
        suggestion:
          "This usually happens after an application update or on a momentary disconnection. Reloading will fetch the latest assets.",
      };
    }

    if (
      msg.includes("neon") ||
      msg.includes("postgres") ||
      msg.includes("database_url") ||
      msg.includes("500") ||
      msg.includes("database")
    ) {
      return {
        icon: (
          <Database
            size={36}
            strokeWidth={1.8}
            style={{ color: "var(--color-accent, #38bdf8)" }}
          />
        ),
        title: "Database sync issue",
        description: "The shared database could not complete the operation.",
        suggestion:
          "Your local state remains preserved. Check connection credentials or retry sync.",
      };
    }

    if (
      msg.includes("network") ||
      msg.includes("offline") ||
      msg.includes("timeout")
    ) {
      return {
        icon: (
          <WifiOff
            size={36}
            strokeWidth={1.8}
            style={{ color: "var(--color-accent, #38bdf8)" }}
          />
        ),
        title: "Network issue",
        description: "The app couldn't reach the server.",
        suggestion: "Check your internet connection and try again.",
      };
    }

    if (
      msg.includes("permission") ||
      msg.includes("unauthorized") ||
      msg.includes("403") ||
      msg.includes("401")
    ) {
      return {
        icon: (
          <Lock
            size={36}
            strokeWidth={1.8}
            style={{ color: "var(--color-accent, #38bdf8)" }}
          />
        ),
        title: "Access denied",
        description: "You don't have permission to view this content.",
        suggestion: "Try signing in again or switching profiles.",
      };
    }

    return {
      icon: (
        <AlertCircle
          size={36}
          strokeWidth={1.8}
          style={{ color: "var(--color-accent, #38bdf8)" }}
        />
      ),
      title: "Something went wrong",
      description:
        "The workspace encountered an unexpected error during rendering.",
      suggestion: "Try again, or reload the page if the problem persists.",
    };
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { icon, title, description, suggestion } = this.getErrorCategory();
    const isNetworkError =
      this.state.errorMessage?.toLowerCase().includes("failed to fetch") ||
      this.state.errorMessage?.toLowerCase().includes("dynamically imported");

    return (
      <main
        id="main-content"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          minHeight: "60vh",
        }}
      >
        <div
          style={{
            maxWidth: "36rem",
            width: "100%",
            textAlign: "center",
            padding: "2.5rem 2rem",
            borderRadius: "1rem",
            border:
              "1px solid var(--color-border-subtle, rgba(148,163,200,0.12))",
            background: "var(--color-surface-1, rgba(12,18,42,0.92))",
            boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
          }}
        >
          {/* Icon */}
          <div
            aria-hidden="true"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            {icon}
          </div>

          {/* Title */}
          <h2
            style={{
              margin: "0 0 0.5rem",
              fontFamily: "var(--font-body, system-ui, sans-serif)",
              fontSize: "1.35rem",
              fontWeight: 700,
              color: "var(--color-text-primary, #f0f4ff)",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h2>

          {/* Description */}
          <p
            style={{
              margin: "0 0 0.5rem",
              fontFamily: "var(--font-body, system-ui, sans-serif)",
              fontSize: "0.92rem",
              lineHeight: 1.5,
              color: "var(--color-text-secondary, #94a3b8)",
            }}
          >
            {description}
          </p>

          {/* Suggestion */}
          <p
            style={{
              margin: "0 0 1.5rem",
              fontFamily: "var(--font-body, system-ui, sans-serif)",
              fontSize: "0.82rem",
              lineHeight: 1.5,
              color: "var(--color-text-tertiary, #64748b)",
              fontStyle: "italic",
            }}
          >
            {suggestion}
          </p>

          {/* Error details */}
          {this.state.errorMessage && (
            <details
              style={{
                margin: "0 0 1.5rem",
                textAlign: "left",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                background: "rgba(0,0,0,0.35)",
                border:
                  "1px solid var(--color-border-subtle, rgba(148,163,200,0.12))",
              }}
            >
              <summary
                style={{
                  fontFamily: "var(--font-body, system-ui, sans-serif)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--color-text-tertiary, #94a3b8)",
                  cursor: "pointer",
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>Diagnostics & Error Details</span>
                <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>Click to toggle</span>
              </summary>
              <pre
                style={{
                  margin: "0.75rem 0 0",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.72rem",
                  lineHeight: 1.45,
                  color: "var(--color-error, #fca5a5)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: "12rem",
                  overflow: "auto",
                }}
              >
                {this.state.errorMessage}
                {this.state.errorStack && (
                  <>
                    {"\n\n--- Stack Trace ---\n"}
                    {this.state.errorStack}
                  </>
                )}
                {this.state.componentStack && (
                  <>
                    {"\n\n--- Component Stack ---\n"}
                    {this.state.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Copy Report button */}
            <button
              type="button"
              onClick={this.handleCopyErrorReport}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1rem",
                borderRadius: "0.5rem",
                border:
                  "1px solid var(--color-border, rgba(148,163,200,0.18))",
                background: "rgba(255,255,255,0.04)",
                color: "var(--color-text-secondary, #cbd5e1)",
                fontFamily: "var(--font-body, system-ui, sans-serif)",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Copy error report with diagnostic info to clipboard"
            >
              {this.state.copiedReport ? (
                <>
                  <Check size={14} style={{ color: "#4ade80" }} />
                  <span style={{ color: "#4ade80" }}>Report Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Report</span>
                </>
              )}
            </button>

            {!isNetworkError && (
              <button
                type="button"
                onClick={this.handleRetry}
                style={{
                  padding: "0.55rem 1.25rem",
                  borderRadius: "0.5rem",
                  border:
                    "1px solid var(--color-border, rgba(148,163,200,0.18))",
                  background: "transparent",
                  color: "var(--color-text-primary, #f0f4ff)",
                  fontFamily: "var(--font-body, system-ui, sans-serif)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            )}

            <button
              type="button"
              onClick={this.handleClearCacheAndReload}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1rem",
                borderRadius: "0.5rem",
                border:
                  "1px solid var(--color-border, rgba(148,163,200,0.18))",
                background: "transparent",
                color: "var(--color-text-tertiary, #94a3b8)",
                fontFamily: "var(--font-body, system-ui, sans-serif)",
                fontSize: "0.82rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
              title="Clears local cache snapshots in case of corrupted local data and refreshes"
            >
              <Trash2 size={13} />
              <span>Reset cache</span>
            </button>

            <button
              type="button"
              onClick={this.handleReload}
              style={{
                padding: "0.55rem 1.35rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "var(--color-accent, #38bdf8)",
                color: "#0c122a",
                fontFamily: "var(--font-body, system-ui, sans-serif)",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(56, 189, 248, 0.25)",
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      </main>
    );
  }
}

export default WorkspaceErrorBoundary;

