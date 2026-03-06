/**
 * Generic cache manager with TTL and concurrent request deduplication
 * Used across all services for consistent caching behavior
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  etag?: string; // ETag for HTTP caching
}

export class CacheManager<T> {
  private cache: CacheEntry<T> | null = null;
  private fetchPromise: Promise<T> | null = null;
  private readonly defaultTtl: number;

  constructor(defaultTtl: number = 5 * 60 * 1000) {
    this.defaultTtl = defaultTtl;
  }

  /**
   * Get cached data if valid, or fetch fresh data
   */
  async getOrFetch(
    fetchFn: (options?: CacheOptions) => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const now = Date.now();
    const ttl = options?.ttl ?? this.defaultTtl;

    // Check cache validity
    if (this.isValid(now, ttl, options?.etag)) {
      return this.cache!.data;
    }

    // Deduplicate concurrent requests
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    const fetchStartTime = Date.now();
    
    this.fetchPromise = fetchFn(options)
      .then((data) => {
        // Check if cache was updated while we were fetching
        if (this.cache && this.cache.timestamp > fetchStartTime) {
          return this.cache.data;
        }

        this.cache = {
          data,
          timestamp: Date.now(),
          etag: options?.etag,
        };
        return data;
      })
      .catch((error) => {
        console.error('Cache fetch error:', error);
        if (this.cache) {
          return this.cache.data; // Return stale data on error
        }
        throw error;
      })
      .finally(() => {
        this.fetchPromise = null;
      });

    return this.fetchPromise;
  }

  /**
   * Update cache with new data
   */
  set(data: T, etag?: string): void {
    this.cache = {
      data,
      timestamp: Date.now(),
      etag,
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache = null;
    this.fetchPromise = null;
  }

  /**
   * Check if cache is valid
   */
  private isValid(now: number, ttl: number, etag?: string): boolean {
    if (!this.cache) return false;

    // Check TTL
    if (now - this.cache.timestamp > ttl) return false;

    // Check ETag if provided
    if (etag && this.cache.etag !== etag) return false;

    return true;
  }

  /**
   * Get current cache data (without fetching)
   */
  getCurrent(): T | null {
    return this.cache?.data ?? null;
  }

  /**
   * Get cache metadata
   */
  getMetadata() {
    return {
      hasData: !!this.cache,
      timestamp: this.cache?.timestamp,
      etag: this.cache?.etag,
      age: this.cache ? Date.now() - this.cache.timestamp : null,
    };
  }
}
