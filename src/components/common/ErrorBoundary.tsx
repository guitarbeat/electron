/**
 * Error Boundary Component
 * Provides error catching and recovery for component trees with user-friendly error display
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
  }

  componentDidUpdate(prevProps: Props) {
    const { children, resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange && prevProps.children !== children) {
      this.reset();
      return;
    }

    if (hasError && resetKeys) {
      const prevPropsAsRecord = prevProps as unknown as Record<string, unknown>;
      const propsAsRecord = this.props as unknown as Record<string, unknown>;
      const prevKeys = resetKeys.map((key) => prevPropsAsRecord[String(key)]);
      const currentKeys = resetKeys.map((key) => propsAsRecord[String(key)]);

      if (prevKeys.some((key, index) => key !== currentKeys[index])) {
        this.reset();
      }
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;

    this.setState({ errorInfo });

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    onError?.(error, errorInfo);

    // Auto-reset after 30 seconds for transient errors
    this.resetTimeoutId = setTimeout(() => {
      this.reset();
    }, 30000);
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  reset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  render() {
    const { children, fallback } = this.props;
    const { error, errorId, errorInfo, hasError } = this.state;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === 'function' ? fallback(error, this.reset) : fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            padding: '20px',
            border: '1px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#ffe0e0',
            color: '#d63031',
            fontFamily: 'monospace',
            fontSize: '14px',
            maxWidth: '600px',
          }}
        >
          <h2 style={{ margin: '0 0 10px 0', color: '#d63031' }}>🚨 Something went wrong</h2>

          <p style={{ margin: '0 0 15px 0' }}>
            An unexpected error occurred. The error ID is: <code>{errorId}</code>
          </p>

          {process.env.NODE_ENV === 'development' && error && (
            <details style={{ marginBottom: '15px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Error Details (Development Only)
              </summary>
              <pre
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px',
                }}
              >
                {error.toString()}
                {errorInfo && errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={this.reset}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0984e3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Try Again
            </button>

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#636e72',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Reload Page
            </button>
          </div>

          <p style={{ margin: '15px 0 0 0', fontSize: '12px', color: '#636e72' }}>
            This error will automatically reset in 30 seconds.
          </p>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook for functional components to handle errors
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    console.error('Error captured by useErrorHandler:', error);
    setError(error);
  }, []);

  // Throw error to be caught by ErrorBoundary
  if (error) {
    throw error;
  }

  return { captureError, resetError };
}

/**
 * HOC to wrap components with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
