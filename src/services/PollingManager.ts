type Listener<T> = (data: T | undefined, error: any | null) => void;

class PollingManager {
  private subscribers = new Map<string, Set<Listener<any>>>();
  private intervals = new Map<string, ReturnType<typeof setInterval>>();
  private fetchFns = new Map<string, () => Promise<any>>();
  private cache = new Map<string, any>();
  private errors = new Map<string, any>();
  private activeIntervals = new Map<string, number>();
  private inFlight = new Map<string, Promise<void>>();

  subscribe<T>(key: string, fetchFn: () => Promise<T>, interval: number, listener: Listener<T>) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    const listeners = this.subscribers.get(key)!;
    listeners.add(listener);

    // Update fetchFn (latest wins)
    this.fetchFns.set(key, fetchFn);

    // If cache exists, emit immediately
    if (this.cache.has(key)) {
      listener(this.cache.get(key), null);
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

  unsubscribe<T>(key: string, listener: Listener<T>) {
    const listeners = this.subscribers.get(key);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.stopPolling(key);
        this.subscribers.delete(key);
        // Clear cache on last unsubscribe to ensure freshness on next mount
        this.cache.delete(key);
        this.errors.delete(key);
        this.fetchFns.delete(key);
        this.inFlight.delete(key);
      }
    }
  }

  startPolling(key: string, interval: number) {
    // Execute immediately
    void this.execute(key);
    const id = setInterval(() => void this.execute(key), interval);
    this.intervals.set(key, id);
    this.activeIntervals.set(key, interval);
  }

  stopPolling(key: string) {
    const id = this.intervals.get(key);
    if (id) {
      clearInterval(id);
      this.intervals.delete(key);
      this.activeIntervals.delete(key);
    }
  }

  private execute(key: string): Promise<void> {
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
    const request = (async () => {
      try {
        const data = await fetchFn();

        // Validation check similar to original hook
        if (data === undefined || data === null) {
          throw new Error('Fetched data is null or undefined');
        }

        // Check if this response is stale before processing
        if (!this.subscribers.has(key) || this.fetchFns.get(key) !== currentFetchFn) {
          return; // Silently ignore stale response
        }

        this.cache.set(key, data);
        this.errors.delete(key);
        this.notify(key, data, null);
      } catch (e) {
        console.error(`Polling failed for ${key}`, e);

        // Check if this error response is stale before processing
        if (!this.subscribers.has(key) || this.fetchFns.get(key) !== currentFetchFn) {
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

  private notify(key: string, data: any, error: any) {
    const listeners = this.subscribers.get(key);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data, error);
        } catch (listenerError) {
          console.error(`Polling listener failed for ${key}`, listenerError);
        }
      });
    }
  }

  getData(key: string) {
    return this.cache.get(key);
  }

  getError(key: string) {
    return this.errors.get(key);
  }

  refresh(key: string) {
    return this.execute(key);
  }
}

export const pollingManager = new PollingManager();
