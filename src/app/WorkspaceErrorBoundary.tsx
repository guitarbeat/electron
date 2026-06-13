import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Error boundary wrapping the lazy-loaded workspace shell.
 * Catches module-fetch failures and React render errors so the app
 * shows a recoverable fallback instead of a blank screen.
 */
class WorkspaceErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[WorkspaceErrorBoundary] caught error:', error, info);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isNetworkError =
      this.state.errorMessage?.toLowerCase().includes('failed to fetch') ||
      this.state.errorMessage?.toLowerCase().includes('dynamically imported');

    return (
      <main
        id="main-content"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          minHeight: '40vh',
        }}
      >
        <div
          style={{
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center',
            padding: '2rem 1.5rem',
            borderRadius: '1rem',
            border: '1px solid rgba(148, 163, 200, 0.22)',
            background:
              'linear-gradient(180deg, rgba(14,22,58,0.9) 0%, rgba(8,12,36,0.94) 100%)',
            boxShadow: '0 24px 56px rgba(2,4,18,0.36), inset 0 1px 0 rgba(200,215,255,0.06)',
          }}
        >
          <span
            aria-hidden="true"
            style={{ fontSize: '2rem', lineHeight: 1, display: 'block', marginBottom: '0.75rem' }}
          >
            🎬
          </span>
          <h2
            style={{
              margin: '0 0 0.5rem',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#e8efff',
              letterSpacing: '-0.01em',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              margin: '0 0 1.25rem',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.875rem',
              lineHeight: 1.55,
              color: '#94a3c8',
            }}
          >
            {isNetworkError
              ? 'A part of the app failed to load. This can happen after an update or on a slow connection.'
              : 'An unexpected error occurred in the workspace.'}
          </p>
          <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isNetworkError && (
              <button
                type="button"
                onClick={this.handleRetry}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(148,163,200,0.3)',
                  background: 'rgba(148,163,200,0.1)',
                  color: '#c8d5f0',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '9999px',
                border: '1px solid rgba(244,114,182,0.4)',
                background: 'rgba(244,114,182,0.15)',
                color: '#f0e8ff',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '0.8125rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
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
