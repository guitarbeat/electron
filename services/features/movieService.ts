/**
 * Consolidated Movie Service using BaseService pattern
 * Replaces legacy movieService.ts with improved architecture
 */

import { BaseService } from '../core/BaseService.ts';
import { GIST_FILENAME } from '../../config/gistConfig.ts';
import type { Movie } from '../../types.ts';

export class MovieService extends BaseService<Movie[]> {
  constructor() {
    super(GIST_FILENAME, 5 * 60 * 1000); // 5 minutes TTL
  }

  protected parseContent(content: string | undefined): Movie[] {
    if (!content) {
      console.warn(`Gist is missing "${GIST_FILENAME}". Returning empty movie list.`);
      return [];
    }

    try {
      const movies = JSON.parse(content);
      if (!Array.isArray(movies)) {
        throw new Error(`${GIST_FILENAME} must be a JSON array of movie objects.`);
      }
      return movies;
    } catch (parseErr) {
      throw new Error(
        `${GIST_FILENAME} contains invalid JSON. It must be a JSON array of movie objects.`
      );
    }
  }

  /**
   * Get movies with ETag caching
   */
  async getMovies(): Promise<Movie[]> {
    return this.fetch();
  }

  /**
   * Save movies to gist
   */
  async saveMovies(movies: Movie[]): Promise<void> {
    return this.save(movies);
  }

  /**
   * Clear movie cache
   */
  clearMovieCache(): void {
    this.clearCache();
  }
}

// Export singleton instance
export const movieService = new MovieService();
