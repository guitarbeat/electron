import React from "react";
import { getErrorMessage, recordClientError } from "./shared.js";

export interface LazyWithRetryOptions {
  /**
   * Maximum number of retry attempts before giving up and propagating the error.
   * Default: 3
   */
  maxRetries?: number;
  /**
   * Initial delay in milliseconds before the first retry.
   * Default: 500ms
   */
  initialDelayMs?: number;
  /**
   * Maximum backoff delay in milliseconds.
   * Default: 4000ms
   */
  maxDelayMs?: number;
  /**
   * Exponential factor to multiply delay on each subsequent attempt.
   * Default: 2
   */
  backoffFactor?: number;
  /**
   * Optional name of the component being loaded, used in log messages and diagnostics.
   */
  componentName?: string;
}

const DEFAULT_OPTIONS: Required<Omit<LazyWithRetryOptions, "componentName">> = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 4000,
  backoffFactor: 2,
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a dynamic component import with exponential backoff retry for transient network / chunk load errors.
 */
export async function importWithExponentialBackoff<
  T extends React.ComponentType<unknown>,
>(
  importFn: () => Promise<{ default: T }>,
  options?: LazyWithRetryOptions,
): Promise<{ default: T }> {
  const maxRetries = options?.maxRetries ?? DEFAULT_OPTIONS.maxRetries;
  const initialDelayMs = options?.initialDelayMs ?? DEFAULT_OPTIONS.initialDelayMs;
  const maxDelayMs = options?.maxDelayMs ?? DEFAULT_OPTIONS.maxDelayMs;
  const backoffFactor = options?.backoffFactor ?? DEFAULT_OPTIONS.backoffFactor;
  const compName = options?.componentName || "AnonymousLazyComponent";

  let attempt = 0;

  while (true) {
    try {
      return await importFn();
    } catch (err) {
      attempt++;
      const errorMessage = getErrorMessage(err);
      const isLastAttempt = attempt > maxRetries;

      if (isLastAttempt) {
        console.error(
          `[lazyWithRetry] Failed to load component <${compName}> after ${attempt} attempts (${maxRetries} retries exhausted): ${errorMessage}`,
          err,
        );

        recordClientError(err, {
          source: "lazyWithRetry",
          component: compName,
          attempt,
          maxRetries,
        });

        throw err;
      }

      // Calculate exponential backoff delay: initialDelay * factor^(attempt - 1)
      const calculatedDelay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
      const backoffDelayMs = Math.min(calculatedDelay, maxDelayMs);

      console.warn(
        `[lazyWithRetry] Dynamic import failed for <${compName}> (attempt ${attempt}/${maxRetries + 1}). Retrying in ${backoffDelayMs}ms... Error: ${errorMessage}`,
        err,
      );

      await delay(backoffDelayMs);
    }
  }
}

/**
 * Wraps React.lazy with automatic exponential backoff retry logic.
 */
export const lazyWithRetry = <T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options?: LazyWithRetryOptions,
): React.LazyExoticComponent<T> =>
  React.lazy(() => importWithExponentialBackoff(importFn, options));


export default lazyWithRetry;

