/**
 * Centralized error handling utilities
 */

export type ErrorHandler = (error: unknown, fallback: string) => string;

export const getErrorMessage: ErrorHandler = (error, fallback) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export const createError = (err: unknown, defaultMessage: string): Error => {
  return err instanceof Error ? err : new Error(defaultMessage);
};

export const isNetworkError = (error: unknown): boolean => {
  return error instanceof Error && (
    error.message.includes('Network Error') ||
    error.message.includes('fetch')
  );
};

export const isAuthError = (error: unknown): boolean => {
  return error instanceof Error && (
    error.message.includes('Unauthorized') ||
    error.message.includes('Authentication')
  );
};

export const logError = (error: unknown, context?: string): void => {
  const message = error instanceof Error ? error.message : String(error);
  const errorInfo = context ? `[${context}] ${message}` : message;
  
  if (process.env.NODE_ENV === 'development') {
    console.error(errorInfo, error);
  }
  
  // In production, you might want to send this to a logging service
  // e.g., Sentry, LogRocket, etc.
};
