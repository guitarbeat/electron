import React, { Suspense, type ReactNode } from "react";
import { AlertCircle, Lock, RefreshCw, WifiOff } from "lucide-react";
import { getErrorMessage } from "@/utils";

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

export const LazyBoundary: React.FC<LazyBoundaryProps> = ({ children, label }) => (
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
}

/**
 * Error boundary wrapping the lazy-loaded workspace shell.
 * Catches module-fetch failures and React render errors so the app
 * shows a recoverable fallback instead of a blank screen.
 */
export class WorkspaceErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: null, errorStack: null };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = getErrorMessage(error, "An unexpected error occurred.");
    const stack = error instanceof Error ? error.stack ?? null : null;
    return { hasError: true, errorMessage: message, errorStack: stack };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[WorkspaceErrorBoundary] caught error:", error, info);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: null, errorStack: null });
  };

  private getErrorCategory(): {
    icon: React.ReactNode;
    title: string;
    description: string;
    suggestion: string;
  } {
    const msg = (this.state.errorMessage ?? "").toLowerCase();

    if (msg.includes("failed to fetch") || msg.includes("dynamically imported") || msg.includes("loading chunk")) {
      return {
        icon: <RefreshCw size={36} strokeWidth={1.8} style={{ color: "var(--color-accent, #c88d59)" }} />,
        title: "Connection interrupted",
        description: "A part of the app couldn't be loaded from the server.",
        suggestion: "This usually happens after a deploy or on an unstable connection. Reloading should fix it.",
      };
    }

    if (msg.includes("network") || msg.includes("offline") || msg.includes("timeout")) {
      return {
        icon: <WifiOff size={36} strokeWidth={1.8} style={{ color: "var(--color-accent, #c88d59)" }} />,
        title: "Network issue",
        description: "The app couldn't reach the server.",
        suggestion: "Check your internet connection and try again.",
      };
    }

    if (msg.includes("permission") || msg.includes("unauthorized") || msg.includes("403") || msg.includes("401")) {
      return {
        icon: <Lock size={36} strokeWidth={1.8} style={{ color: "var(--color-accent, #c88d59)" }} />,
        title: "Access denied",
        description: "You don't have permission to view this content.",
        suggestion: "Try signing in again or switching profiles.",
      };
    }

    return {
      icon: <AlertCircle size={36} strokeWidth={1.8} style={{ color: "var(--color-accent, #c88d59)" }} />,
      title: "Something went wrong",
      description: "The workspace encountered an error it couldn't recover from.",
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
          minHeight: "50vh",
        }}
      >
        <div
          style={{
            maxWidth: "32rem",
            width: "100%",
            textAlign: "center",
            padding: "2.5rem 2rem",
            borderRadius: "1rem",
            border: "1px solid var(--color-border-subtle, rgba(148,163,200,0.12))",
            background: "var(--color-surface-1, rgba(12,18,42,0.85))",
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
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
              fontSize: "1.25rem",
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
              fontSize: "0.9rem",
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
              fontSize: "0.8rem",
              lineHeight: 1.5,
              color: "var(--color-text-tertiary, #4a5a7a)",
              fontStyle: "italic",
            }}
          >
            {suggestion}
          </p>

          {/* Error details (dev mode or expandable) */}
          {this.state.errorMessage && (
            <details
              style={{
                margin: "0 0 1.25rem",
                textAlign: "left",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--color-border-subtle, rgba(148,163,200,0.1))",
              }}
            >
              <summary
                style={{
                  fontFamily: "var(--font-body, system-ui, sans-serif)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--color-text-tertiary, #4a5a7a)",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                Error details
              </summary>
              <pre
                style={{
                  margin: "0.5rem 0 0",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.7rem",
                  lineHeight: 1.4,
                  color: "var(--color-error, #fca5a5)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: "8rem",
                  overflow: "auto",
                }}
              >
                {this.state.errorMessage}
                {import.meta.env.DEV && this.state.errorStack && (
                  <>
                    {"\n\n"}
                    {this.state.errorStack}
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
            }}
          >
            {!isNetworkError && (
              <button
                type="button"
                onClick={this.handleRetry}
                style={{
                  padding: "0.6rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--color-border, rgba(148,163,200,0.18))",
                  background: "transparent",
                  color: "var(--color-text-primary, #f0f4ff)",
                  fontFamily: "var(--font-body, system-ui, sans-serif)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                padding: "0.6rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "var(--color-accent, #38bdf8)",
                color: "#fff",
                fontFamily: "var(--font-body, system-ui, sans-serif)",
                fontSize: "0.85rem",
                fontWeight: 600,
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
