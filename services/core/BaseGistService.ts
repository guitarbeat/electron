import { GIST_TOKEN } from '../../config/gistConfig.ts';
import { fetchGist, getGistFileContent, patchGistFile } from '../gistClient.ts';

export interface CacheEntry<T> {
  data: T;
  etag?: string;
  timestamp: number;
}

export interface GistServiceOptions {
  filename: string;
  cacheTTL?: number;
  enableETag?: boolean;
}

export abstract class BaseGistService<T> {
  protected cache: CacheEntry<T> | null = null;
  protected readonly options: Required<GistServiceOptions>;

  constructor(options: GistServiceOptions) {
    this.options = {
      cacheTTL: 5 * 60 * 1000, // 5 minutes default
      enableETag: true,
      ...options,
    };
  }

  protected abstract parseData(content: string): T;
  protected abstract serializeData(data: T): string;
  protected abstract validateData(data: T): boolean;

  protected isCacheValid(): boolean {
    if (!this.cache) return false;
    if (this.options.cacheTTL > 0) {
      return Date.now() - this.cache.timestamp < this.options.cacheTTL;
    }
    return true;
  }

  async fetch(): Promise<T> {
    // Check cache validity
    if (this.isCacheValid()) {
      return this.cache!.data;
    }

    try {
      const response = await fetchGist({
        token: GIST_TOKEN,
        eTag: this.options.enableETag ? this.cache?.etag : undefined,
        cache: 'no-cache',
      });

      // Handle 304 Not Modified
      if (response.status === 304 && this.cache) {
        return this.cache.data;
      }

      if (!response.ok) {
        throw new Error(`GitHub API responded with ${response.status}`);
      }

      const gist = await response.json();
      const content = getGistFileContent(gist, this.options.filename);
      
      if (content === null || content === '') {
        return this.getEmptyValue();
      }

      const data = this.parseData(content);
      
      if (!this.validateData(data)) {
        throw new Error(`Invalid data format for ${this.options.filename}`);
      }

      // Update cache
      this.cache = {
        data,
        etag: response.headers.get('ETag') || undefined,
        timestamp: Date.now(),
      };

      return data;
    } catch (error) {
      console.error(`Error fetching ${this.options.filename}:`, error);
      
      // Return cached data on error if available
      if (this.cache) {
        return this.cache.data;
      }
      
      throw error;
    }
  }

  async save(data: T): Promise<void> {
    if (!this.validateData(data)) {
      throw new Error(`Invalid data format for ${this.options.filename}`);
    }

    try {
      const content = this.serializeData(data);
      const response = await patchGistFile(
        this.options.filename,
        content,
        GIST_TOKEN
      );

      if (!response.ok) {
        const errorBody = await response.json();
        console.error('GitHub API error details:', errorBody);
        throw new Error(`GitHub API responded with ${response.status}`);
      }

      // Update cache with new data
      this.cache = {
        data,
        etag: response.headers.get('ETag') || undefined,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Error saving ${this.options.filename}:`, error);
      throw error;
    }
  }

  protected abstract getEmptyValue(): T;

  clearCache(): void {
    this.cache = null;
  }

  getCachedData(): T | null {
    return this.isCacheValid() ? this.cache?.data || null : null;
  }
}
