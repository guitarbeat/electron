export interface PollingSubscription {
  key: string;
  fetchFn: () => Promise<any>;
  interval: number;
  listener: (data: any) => void;
}

export class PollingManager {
  private static instance: PollingManager;
  private subscriptions: Map<string, PollingSubscription[]> = new Map();
  private intervals: Map<string, number> = new Map();
  private lastData: Map<string, any> = new Map();
  private isPolling: Map<string, boolean> = new Map();

  static getInstance(): PollingManager {
    if (!PollingManager.instance) {
      PollingManager.instance = new PollingManager();
    }
    return PollingManager.instance;
  }

  subscribe<T>(
    key: string,
    fetchFn: () => Promise<T>,
    listener: (data: T) => void,
    interval: number = 30000
  ): () => void {
    const subscription: PollingSubscription = {
      key,
      fetchFn,
      interval,
      listener: listener as (data: any) => void,
    };

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }
    this.subscriptions.get(key)!.push(subscription);

    // Start polling if this is the first subscription for this key
    if (this.subscriptions.get(key)!.length === 1) {
      this.startPolling(key, fetchFn, interval);
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(key);
      if (subs) {
        const index = subs.indexOf(subscription);
        if (index > -1) {
          subs.splice(index, 1);
        }
        
        // Stop polling if no more subscriptions for this key
        if (subs.length === 0) {
          this.stopPolling(key);
        }
      }
    };
  }

  private startPolling<T>(key: string, fetchFn: () => Promise<T>, interval: number): void {
    if (this.isPolling.get(key)) {
      return; // Already polling
    }

    this.isPolling.set(key, true);

    // Execute immediately, then set up interval
    this.execute(key, fetchFn);

    const intervalId = setInterval(() => {
      this.execute(key, fetchFn);
    }, interval);

    this.intervals.set(key, intervalId);
  }

  private stopPolling(key: string): void {
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
    this.isPolling.set(key, false);
    this.lastData.delete(key);
  }

  private async execute<T>(key: string, fetchFn: () => Promise<T>): Promise<void> {
    try {
      const data = await fetchFn();
      
      // Only notify if data has changed
      const lastData = this.lastData.get(key);
      if (JSON.stringify(data) !== JSON.stringify(lastData)) {
        this.lastData.set(key, data);
        this.notify(key, data);
      }
    } catch (error) {
      console.error(`Polling error for key ${key}:`, error);
    }
  }

  private notify<T>(key: string, data: T): void {
    const subscriptions = this.subscriptions.get(key);
    if (subscriptions) {
      subscriptions.forEach(sub => {
        try {
          sub.listener(data);
        } catch (error) {
          console.error(`Error in polling listener for key ${key}:`, error);
        }
      });
    }
  }

  // Manual refresh for all subscriptions with given key
  public refresh(key: string): void {
    const subscriptions = this.subscriptions.get(key);
    if (subscriptions && subscriptions.length > 0) {
      const fetchFn = subscriptions[0].fetchFn;
      this.execute(key, fetchFn);
    }
  }

  // Clear all polling (useful for cleanup)
  public clear(): void {
    this.intervals.forEach(intervalId => clearInterval(intervalId));
    this.intervals.clear();
    this.subscriptions.clear();
    this.lastData.clear();
    this.isPolling.clear();
  }
}

// Export singleton instance
export const pollingManager = PollingManager.getInstance();
