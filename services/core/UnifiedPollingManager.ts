type Listener<T> = (data: T | undefined, error: any | null) => void;
type FetchFunction<T> = () => Promise<T>;

interface PollingSubscription<T> {
  key: string;
  fetchFn: FetchFunction<T>;
  interval: number;
  listener: Listener<T>;
  active: boolean;
}

class UnifiedPollingManager {
  private subscriptions = new Map<string, Set<Listener<any>>>();
  private intervals = new Map<string, ReturnType<typeof setInterval>>();
  private fetchFunctions = new Map<string, FetchFunction<any>>();
  private cache = new Map<string, { data: any; timestamp: number }>();
  private errors = new Map<string, any>();
  private activeIntervals = new Map<string, number>();
  private inFlight = new Map<string, Promise<void>>();
  private cacheTTL = new Map<string, number>();

  subscribe<T>(
    key: string, 
    fetchFn: FetchFunction<T>, 
    interval: number, 
    listener: Listener<T>,
    options: { cacheTTL?: number } = {}
  ): () => void {
    // Store cache TTL if provided
    if (options.cacheTTL !== undefined) {
      this.cacheTTL.set(key, options.cacheTTL);
    }

    // Add listener
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    const listeners = this.subscriptions.get(key)!;
    listeners.add(listener);

    // Update fetch function (latest wins)
    this.fetchFunctions.set(key, fetchFn);

    // Emit cached data immediately if available and valid
    const cached = this.getCachedData(key);
    if (cached !== null) {
      listener(cached.data, null);
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

    // Return unsubscribe function
    return () => this.unsubscribe(key, listener);
  }

  unsubscribe<T>(key: string, listener: Listener<T>): void {
    const listeners = this.subscriptions.get(key);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.stopPolling(key);
        this.subscriptions.delete(key);
        this.cleanup(key);
      }
    }
  }

  private startPolling(key: string, interval: number): void {
    // Execute immediately
    void this.execute(key);
    const id = setInterval(() => void this.execute(key), interval);
    this.intervals.set(key, id);
    this.activeIntervals.set(key, interval);
  }

  private stopPolling(key: string): void {
    const id = this.intervals.get(key);
    if (id) {
      clearInterval(id);
      this.intervals.delete(key);
      this.activeIntervals.delete(key);
    }
  }

  private async execute(key: string): Promise<void> {
    // Prevent concurrent requests
    const existingRequest = this.inFlight.get(key);
    if (existingRequest) {
      return existingRequest;
    }

    const fetchFn = this.fetchFunctions.get(key);
    if (!fetchFn) {
      return Promise.resolve();
    }

    const request = (async () => {
      try {
        const data = await fetchFn();

        // Validation check
        if (data === undefined || data === null) {
          throw new Error('Fetched data is null or undefined');
        }

        // Ignore stale responses
        if (!this.subscriptions.has(key) || this.fetchFunctions.get(key) !== fetchFn) {
          return;
        }

        // Update cache
        this.cache.set(key, { data, timestamp: Date.now() });
        this.errors.delete(key);
        this.notify(key, data, null);
      } catch (e) {
        console.error(`Polling failed for ${key}`, e);

        // Ignore stale responses
        if (!this.subscriptions.has(key) || this.fetchFunctions.get(key) !== fetchFn) {
          return;
        }

        this.errors.set(key, e);
        this.notify(key, undefined, e);
      } finally {
        if (this.inFlight.get(key) === request!) {
          this.inFlight.delete(key);
        }
      }
    })();

    this.inFlight.set(key, request);
    return request;
  }

  private notify(key: string, data: any, error: any): void {
    const listeners = this.subscriptions.get(key);
    if (listeners) {
      listeners.forEach((listener) => listener(data, error));
    }
  }

  private getCachedData(key: string): { data: any; timestamp: number } | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const ttl = this.cacheTTL.get(key);
    if (ttl !== undefined && Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  private cleanup(key: string): void {
    this.cache.delete(key);
    this.errors.delete(key);
    this.fetchFunctions.delete(key);
    this.inFlight.delete(key);
    this.cacheTTL.delete(key);
  }

  // Public API for manual refresh
  refresh(key: string): Promise<void> {
    return this.execute(key);
  }

  // Get current data without triggering fetch
  getData(key: string): any {
    const cached = this.getCachedData(key);
    return cached?.data;
  }

  // Get current error
  getError(key: string): any {
    return this.errors.get(key);
  }

  // Clear cache for specific key
  clearCache(key: string): void {
    this.cache.delete(key);
  }
}

// Singleton instance
export const unifiedPollingManager = new UnifiedPollingManager();
