interface BoundedResponseCacheOptions {
  ttlMs: number;
  maxEntries: number;
  now?: () => number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CachedProxyResponse {
  body: string;
  contentType: string;
  status: number;
  statusText: string;
}

export class BoundedResponseCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly now: () => number;

  constructor(private readonly options: BoundedResponseCacheOptions) {
    this.now = options.now ?? Date.now;
  }

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    const now = this.now();
    for (const [entryKey, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(entryKey);
    }
    this.entries.delete(key);
    while (this.entries.size >= this.options.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey === undefined) break;
      this.entries.delete(oldestKey);
    }
    this.entries.set(key, { value, expiresAt: now + this.options.ttlMs });
  }
}

export const isAbsoluteUrl = (value: string): boolean =>
  /^[a-z][a-z\d+\-.]*:\/\//i.test(value);

export const jsonProxyResponse = (body: unknown, status: number): Response =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const cachedProxyResponse = (
  cached: CachedProxyResponse,
  cacheStatus: 'HIT' | 'MISS' = 'HIT'
): Response =>
  new Response(cached.body, {
    status: cached.status,
    statusText: cached.statusText,
    headers: {
      'Content-Type': cached.contentType,
      'Cache-Control': 'no-store',
      'X-Cache': cacheStatus,
    },
  });
