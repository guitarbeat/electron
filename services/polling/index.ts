/**
 * Unified Polling System
 * Consolidated polling architecture with centralized management and React integration
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Core polling types
export interface PollingListener<T> {
  (data: T | undefined, error: any | null): void;
}

export interface PollingOptions {
  isPaused?: boolean;
  key?: string;
}

export interface PollingState<T> {
  data: T | undefined;
  error: any | null;
  isLoading: boolean;
  refresh: () => void;
}

export interface PollingConfig<T> {
  fetchFn: () => Promise<T>;
  interval: number | null;
  equalityFn?: (prev: T | undefined, next: T) => boolean;
  options?: PollingOptions;
}

// Centralized polling manager class
class PollingManager {
  private subscribers = new Map<string, Set<PollingListener<any>>>();
  private intervals = new Map<string, ReturnType<typeof setInterval>>();
  private fetchFns = new Map<string, () => Promise<any>>();
  private cache = new Map<string, any>();
  private errors = new Map<string, any>();
  private activeIntervals = new Map<string, number>();
  private inFlight = new Map<string, Promise<void>>();

  /**
   * Subscribe to polling for a specific key
   */
  subscribe<T>(
    key: string,
    fetchFn: () => Promise<T>,
    interval: number,
    listener: PollingListener<T>
  ): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    const listeners = this.subscribers.get(key)!;
    listeners.add(listener);

    // Update fetchFn (latest wins)
    this.fetchFns.set(key, fetchFn);

    // Emit cached data immediately if available
    this.emitCachedData(key, listener);

    // Start polling if not active
    this.startPollingIfNeeded(key, interval);

    return () => this.unsubscribe(key, listener);
  }

  /**
   * Unsubscribe from polling
   */
  private unsubscribe<T>(key: string, listener: PollingListener<T>): void {
    const listeners = this.subscribers.get(key);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.cleanup(key);
      }
    }
  }

  /**
   * Clean up resources when no more subscribers
   */
  private cleanup(key: string): void {
    this.stopPolling(key);
    this.subscribers.delete(key);
    this.cache.delete(key);
    this.errors.delete(key);
    this.fetchFns.delete(key);
    this.inFlight.delete(key);
  }

  /**
   * Emit cached data to new subscribers
   */
  private emitCachedData<T>(key: string, listener: PollingListener<T>): void {
    if (this.cache.has(key)) {
      listener(this.cache.get(key), null);
    } else if (this.errors.has(key)) {
      listener(undefined, this.errors.get(key));
    }
  }

  /**
   * Start polling if not already active
   */
  private startPollingIfNeeded(key: string, interval: number): void {
    if (!this.intervals.has(key)) {
      this.startPolling(key, interval);
    } else {
      // Restart if interval changed
      const currentInterval = this.activeIntervals.get(key);
      if (currentInterval !== interval) {
        this.stopPolling(key);
        this.startPolling(key, interval);
      }
    }
  }

  /**
   * Start polling for a key
   */
  private startPolling(key: string, interval: number): void {
    // Execute immediately
    void this.execute(key);
    const id = setInterval(() => void this.execute(key), interval);
    this.intervals.set(key, id);
    this.activeIntervals.set(key, interval);
  }

  /**
   * Stop polling for a key
   */
  private stopPolling(key: string): void {
    const id = this.intervals.get(key);
    if (id) {
      clearInterval(id);
      this.intervals.delete(key);
      this.activeIntervals.delete(key);
    }
  }

  /**
   * Execute polling fetch with race protection
   */
  private async execute(key: string): Promise<void> {
    const existingRequest = this.inFlight.get(key);
    if (existingRequest) {
      return existingRequest;
    }

    const fetchFn = this.fetchFns.get(key);
    if (!fetchFn) {
      return Promise.resolve();
    }

    const request = this.performFetch(key, fetchFn);
    this.inFlight.set(key, request);
    return request;
  }

  /**
   * Perform the actual fetch operation
   */
  private async performFetch(key: string, fetchFn: () => Promise<any>): Promise<void> {
    try {
      const data = await fetchFn();

      // Validate fetched data
      if (data === undefined || data === null) {
        throw new Error('Fetched data is null or undefined');
      }

      // Ignore stale responses
      if (!this.isCurrentFetch(key, fetchFn)) {
        return;
      }

      this.cache.set(key, data);
      this.errors.delete(key);
      this.notify(key, data, null);
    } catch (error) {
      console.error(`Polling failed for ${key}`, error);

      // Ignore stale errors
      if (!this.isCurrentFetch(key, fetchFn)) {
        return;
      }

      this.errors.set(key, error);
      this.notify(key, undefined, error);
    } finally {
      this.clearInFlight(key);
    }
  }

  /**
   * Check if fetch is still current
   */
  private isCurrentFetch(key: string, fetchFn: () => Promise<any>): boolean {
    return this.subscribers.has(key) && this.fetchFns.get(key) === fetchFn;
  }

  /**
   * Clear in-flight request
   */
  private clearInFlight(key: string): void {
    const request = this.inFlight.get(key);
    if (request) {
      this.inFlight.delete(key);
    }
  }

  /**
   * Notify all subscribers of data change
   */
  private notify(key: string, data: any, error: any): void {
    const listeners = this.subscribers.get(key);
    if (listeners) {
      listeners.forEach((listener) => listener(data, error));
    }
  }

  /**
   * Get cached data for a key
   */
  getData(key: string): any {
    return this.cache.get(key);
  }

  /**
   * Get cached error for a key
   */
  getError(key: string): any {
    return this.errors.get(key);
  }

  /**
   * Manual refresh for a key
   */
  refresh(key: string): Promise<void> {
    return this.execute(key);
  }
}

// Global singleton instance
export const pollingManager = new PollingManager();

/**
 * React hook for polling functionality
 */
export const usePolling = <T>(
  fetchFn: () => Promise<T>,
  interval: number | null,
  equalityFn?: (prev: T | undefined, next: T) => boolean,
  options: PollingOptions = {}
): PollingState<T> => {
  const { isPaused = false, key } = options;

  // Initialize state with cached data if available
  const [data, setData] = useState<T | undefined>(() => {
    if (key) {
      const cached = pollingManager.getData(key);
      if (cached !== undefined) return cached;
    }
    return undefined;
  });

  const [error, setError] = useState<any>(() => {
    if (key) {
      const cachedError = pollingManager.getError(key);
      if (cachedError) return cachedError;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(() => {
    if (key) {
      return (
        pollingManager.getData(key) === undefined && pollingManager.getError(key) === undefined
      );
    }
    return true;
  });

  // Refs for stable references
  const dataRef = useRef(data);
  const savedFetchFn = useRef(fetchFn);
  const savedEqualityFn = useRef(equalityFn);

  // Update refs when values change
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    savedFetchFn.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    savedEqualityFn.current = equalityFn;
  }, [equalityFn]);

  // Local execution for non-key polling
  const executeLocal = useCallback(async (isInitialLoad: boolean) => {
    if (isInitialLoad && !dataRef.current) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await savedFetchFn.current();

      if (result === undefined || result === null) {
        throw new Error('Fetched data is null or undefined');
      }

      setData((prevData: T | undefined) => {
        if (savedEqualityFn.current && savedEqualityFn.current(prevData, result)) {
          return prevData;
        }
        return result;
      });
    } catch (e) {
      console.error('Polling execution failed:', e);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Main polling effect
  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    if (key && interval !== null) {
      // Use shared polling manager
      const proxyFetch = () => savedFetchFn.current();

      const unsubscribe = pollingManager.subscribe(
        key,
        proxyFetch,
        interval,
        (newData, newError) => {
          if (newError) {
            setError(newError);
            setIsLoading(false);
          } else {
            setError(null);
            setData((prev: T | undefined) => {
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
        }
      );

      return unsubscribe;
    }

    // Local polling for non-key scenarios
    executeLocal(true); // initial fetch
    if (interval !== null) {
      const intervalId = setInterval(() => executeLocal(false), interval);
      return () => clearInterval(intervalId);
    }

    return undefined;
  }, [interval, executeLocal, isPaused, key]);

  // Manual refresh
  const refresh = useCallback(() => {
    if (key) {
      setIsLoading(true);
      pollingManager.refresh(key).catch(() => {
        setIsLoading(false);
      });
    } else {
      executeLocal(true);
    }
  }, [executeLocal, key]);

  return { data, error, isLoading, refresh };
};

export default usePolling;
