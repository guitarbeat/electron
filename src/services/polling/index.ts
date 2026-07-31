import { useState, useEffect, useRef, useCallback } from "react";
import { consoleError } from "../../utils/shared.ts";

type Listener<T> = (data: T | undefined, error: unknown | null) => void;
interface PollingOptions {
  allowNull?: boolean;
}

/**
 * Consolidated polling management system that provides both a PollingManager class
 * and usePolling hook in a single cohesive module.
 */
class PollingManager {
  private subscribers = new Map<string, Set<Listener<unknown>>>();
  private intervals = new Map<string, ReturnType<typeof setInterval>>();
  private fetchFns = new Map<string, () => Promise<unknown>>();
  private cache = new Map<string, unknown>();
  private errors = new Map<string, unknown>();
  private activeIntervals = new Map<string, number>();
  private inFlight = new Map<string, Promise<void>>();
  private options = new Map<string, PollingOptions>();
  private visibilityListenerBound = false;

  private ensureVisibilityListener() {
    if (this.visibilityListenerBound || typeof document === "undefined") {
      return;
    }

    this.visibilityListenerBound = true;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        return;
      }

      for (const key of this.subscribers.keys()) {
        void this.execute(key);
      }
    });
  }

  /**
   * Subscribe to polling updates for a given key
   */
  subscribe<T>(
    key: string,
    fetchFn: () => Promise<T>,
    interval: number,
    listener: Listener<T>,
    options: PollingOptions = {},
  ) {
    this.ensureVisibilityListener();

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    const listeners = this.subscribers.get(key)!;
    listeners.add(listener as Listener<unknown>);

    // Update fetchFn (latest wins)
    this.fetchFns.set(key, fetchFn);
    this.options.set(key, options);

    // If cache exists, emit immediately
    if (this.cache.has(key)) {
      listener(this.cache.get(key) as T, null);
    } else if (this.errors.has(key)) {
      listener(undefined, this.errors.get(key));
    }

    // Start polling if not active
    if (!this.intervals.has(key)) {
      this.startPolling(key, interval);
    } else {
      // If interval changed, restart polling
      const currentInterval = this.activeIntervals.get(key);
      if (currentInterval !== interval) {
        this.stopPolling(key);
        this.startPolling(key, interval);
      }
    }

    return () => this.unsubscribe(key, listener);
  }

  /**
   * Unsubscribe from polling updates
   */
  unsubscribe<T>(key: string, listener: Listener<T>) {
    const listeners = this.subscribers.get(key);
    if (listeners) {
      listeners.delete(listener as Listener<unknown>);
      if (listeners.size === 0) {
        this.stopPolling(key);
        this.subscribers.delete(key);
        this.fetchFns.delete(key);
        this.inFlight.delete(key);
        this.options.delete(key);
        // Keep cache and errors so remounting components (e.g. tab switches)
        // get instant data on re-subscribe; a fresh fetch fires immediately anyway.
      }
    }
  }

  /**
   * Start polling for a given key
   */
  startPolling(key: string, interval: number) {
    // Execute immediately
    void this.execute(key);
    const id = setInterval(() => void this.execute(key), interval);
    this.intervals.set(key, id);
    this.activeIntervals.set(key, interval);
  }

  /**
   * Stop polling for a given key
   */
  stopPolling(key: string) {
    const id = this.intervals.get(key);
    if (id) {
      clearInterval(id);
      this.intervals.delete(key);
      this.activeIntervals.delete(key);
    }
  }

  /**
   * Execute polling for a given key with race protection and deduplication
   */
  private execute(key: string): Promise<void> {
    if (typeof document !== "undefined" && document.hidden) {
      return Promise.resolve();
    }

    const existingRequest = this.inFlight.get(key);
    if (existingRequest) {
      return existingRequest;
    }

    const fetchFn = this.fetchFns.get(key);
    if (!fetchFn) {
      return Promise.resolve();
    }

    // Track the current fetch function to detect stale responses
    const currentFetchFn = fetchFn;
    const allowNull = this.options.get(key)?.allowNull ?? false;
    let request: Promise<void> | null = null;
    request = (async () => {
      try {
        const data = await fetchFn();

        // Validation check similar to original hook
        if (data === undefined || (!allowNull && data === null)) {
          throw new Error("Fetched data is null or undefined");
        }

        // Check if this response is stale before processing
        if (
          !this.subscribers.has(key) ||
          this.fetchFns.get(key) !== currentFetchFn
        ) {
          return; // Silently ignore stale response
        }

        this.cache.set(key, data);
        this.errors.delete(key);
        this.notify(key, data, null);
      } catch (e) {
        consoleError(`Polling failed for ${key}:`, e);

        // Check if this error response is stale before processing
        if (
          !this.subscribers.has(key) ||
          this.fetchFns.get(key) !== currentFetchFn
        ) {
          return; // Silently ignore stale error
        }

        this.errors.set(key, e);
        this.notify(key, undefined, e);
      } finally {
        // Clean up inFlight only if this is still the current request
        if (this.inFlight.get(key) === request) {
          this.inFlight.delete(key);
        }
      }
    })();

    this.inFlight.set(key, request);
    return request;
  }

  /**
   * Notify all subscribers of data or error updates
   */
  private notify(key: string, data: unknown, error: unknown) {
    const listeners = this.subscribers.get(key);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          (listener as Listener<unknown>)(data, error);
        } catch (listenerError) {
          console.error(`Polling listener failed for ${key}`, listenerError);
        }
      });
    }
  }

  /**
   * Get cached data for a key
   */
  getData(key: string) {
    return this.cache.get(key);
  }

  /**
   * Get cached error for a key
   */
  getError(key: string) {
    return this.errors.get(key);
  }

  /**
   * Refresh data for a specific key
   */
  refresh(key: string) {
    return this.execute(key);
  }
}

// Global polling manager instance
export const pollingManager = new PollingManager();

/**
 * React hook for polling data with caching and race protection
 */
export const usePolling = <T>(
  fetchFn: () => Promise<T>,
  interval: number | null,
  equalityFn?: (prev: T | undefined, next: T) => boolean,
  options: { isPaused?: boolean; key?: string; allowNull?: boolean } = {},
) => {
  const { isPaused = false, key, allowNull = false } = options;

  const [data, setData] = useState<T | undefined>(() => {
    if (key) {
      const cached = pollingManager.getData(key);
      if (cached !== undefined) return cached as T;
    }
    return undefined;
  });

  const [error, setError] = useState<Error | null>(() => {
    if (key) {
      const cachedError = pollingManager.getError(key);
      if (cachedError) {
        return cachedError instanceof Error
          ? cachedError
          : new Error(String(cachedError));
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(() => {
    if (key) {
      return (
        pollingManager.getData(key) === undefined &&
        pollingManager.getError(key) === undefined
      );
    }
    return true;
  });

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const savedFetchFn = useRef(fetchFn);
  const savedEqualityFn = useRef(equalityFn);

  useEffect(() => {
    savedFetchFn.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    savedEqualityFn.current = equalityFn;
  }, [equalityFn]);

  const executeLocal = useCallback(
    async (isInitialLoad: boolean) => {
      if (isInitialLoad && !dataRef.current) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const result = await savedFetchFn.current();

        if (result === undefined || (!allowNull && result === null)) {
          throw new Error("Fetched data is null or undefined");
        }

        setData((prevData) => {
          if (
            savedEqualityFn.current &&
            savedEqualityFn.current(prevData, result)
          ) {
            return prevData;
          }
          return result;
        });
      } catch (e) {
        consoleError(`Polling execution failed${key ? ` for ${key}` : ""}:`, e);
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
      }
    },
    [allowNull, key],
  );

  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    if (key && interval !== null) {
      const proxyFetch = () => savedFetchFn.current();

      const unsubscribe = pollingManager.subscribe(
        key,
        proxyFetch,
        interval,
        (newData, newError) => {
          if (newError) {
            setError(
              newError instanceof Error
                ? newError
                : new Error(String(newError)),
            );
            setIsLoading(false);
          } else {
            setError(null);
            setData((prev) => {
              if (
                savedEqualityFn.current &&
                newData !== undefined &&
                savedEqualityFn.current(prev, newData as T)
              ) {
                return prev;
              }
              return newData;
            });
            setIsLoading(false);
          }
        },
        { allowNull },
      );

      return unsubscribe;
    }
    executeLocal(true);
    if (interval !== null) {
      const intervalId = setInterval(() => executeLocal(false), interval);
      return () => clearInterval(intervalId);
    }

    return undefined;
  }, [allowNull, executeLocal, interval, isPaused, key]);

  const refresh = useCallback(() => {
    if (key && interval !== null) {
      setIsLoading(true);
      setError(null);
      pollingManager.refresh(key).catch((error) => {
        consoleError(`Polling refresh failed for ${key}:`, error);
        setError(error instanceof Error ? error : new Error(String(error)));
        setIsLoading(false);
      });
    } else {
      executeLocal(true);
    }
  }, [executeLocal, interval, key]);

  return { data, error, isLoading, refresh };
};

// Export types for external use
export type { Listener, PollingOptions };
