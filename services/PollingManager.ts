/* eslint-disable @typescript-eslint/no-explicit-any */
type Listener<T> = (data: T | undefined, error: any | null) => void;

class PollingManager {
  private subscribers = new Map<string, Set<Listener<any>>>();

  private intervals = new Map<string, ReturnType<typeof setInterval>>();

  private fetchFns = new Map<string, () => Promise<any>>();

  private cache = new Map<string, any>();

  private errors = new Map<string, any>();

  private activeIntervals = new Map<string, number>();

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
      }
    }
  }

  private startPolling(key: string, interval: number) {
    // Execute immediately
    this.execute(key);
    const id = setInterval(() => this.execute(key), interval);
    this.intervals.set(key, id);
    this.activeIntervals.set(key, interval);
  }

  private stopPolling(key: string) {
    const id = this.intervals.get(key);
    if (id) {
      clearInterval(id);
      this.intervals.delete(key);
      this.activeIntervals.delete(key);
    }
  }

  private async execute(key: string) {
    const fetchFn = this.fetchFns.get(key);
    if (!fetchFn) return;

    try {
      const data = await fetchFn();

      // Validation check similar to original hook
      if (data === undefined || data === null) {
        throw new Error('Fetched data is null or undefined');
      }

      this.cache.set(key, data);
      this.errors.delete(key);
      this.notify(key, data, null);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Polling failed for ${key}`, e);
      this.errors.set(key, e);
      this.notify(key, undefined, e);
    }
  }

  private notify(key: string, data: any, error: any) {
    const listeners = this.subscribers.get(key);
    if (listeners) {
      listeners.forEach((l) => l(data, error));
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
