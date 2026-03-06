/**
 * Base service class with standardized caching and GitHub integration
 * Provides common patterns for all feature services
 */

import { CacheManager } from './CacheManager.ts';
import { gitHubClient } from './GitHubClient.ts';
import { GIST_TOKEN } from '../../config/gistConfig.ts';

export abstract class BaseService<T> {
  protected cache: CacheManager<T>;
  protected filename: string;

  constructor(filename: string, defaultTtl: number = 5 * 60 * 1000) {
    this.filename = filename;
    this.cache = new CacheManager<T>(defaultTtl);
  }

  /**
   * Parse raw content from gist
   */
  protected abstract parseContent(content: string | undefined): T;

  /**
   * Serialize data for gist storage
   */
  protected serializeData(data: T): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Fetch data with caching
   */
  async fetch(options?: { etag?: string }): Promise<T> {
    return this.cache.getOrFetch(
      async (opts) => {
        const response = await gitHubClient.fetchGist({
          token: GIST_TOKEN,
          eTag: opts?.etag,
          cache: 'no-cache',
        });

        // Handle 304 Not Modified
        if (response.status === 304) {
          const cached = this.cache.getCurrent();
          if (cached) return cached;
        }

        if (!response.ok) {
          const errorMessage = await gitHubClient.buildErrorMessage(response);
          throw new Error(errorMessage);
        }

        const gist = await response.json();
        const content = gitHubClient.getFileContent(gist, this.filename);
        
        return this.parseContent(content);
      },
      options
    );
  }

  /**
   * Save data to gist
   */
  async save(data: T): Promise<void> {
    const content = this.serializeData(data);
    const response = await gitHubClient.patchGistFile({
      token: GIST_TOKEN,
      filename: this.filename,
      content,
    });

    if (!response.ok) {
      const errorMessage = await gitHubClient.buildErrorMessage(response);
      throw new Error(errorMessage);
    }

    // Update cache with new data
    const etag = response.headers.get('ETag');
    this.cache.set(data, etag ?? undefined);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache metadata
   */
  getCacheMetadata() {
    return this.cache.getMetadata();
  }
}
