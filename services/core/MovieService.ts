import { BaseGistService } from './BaseGistService.ts';
import { GIST_FILENAME } from '../../config/gistConfig.ts';
import type { Movie } from '../../types.ts';

export class MovieService extends BaseGistService<Movie[]> {
  constructor() {
    super({
      filename: GIST_FILENAME,
      cacheTTL: 10 * 60 * 1000, // 10 minutes cache
      enableETag: true, // Enable ETag for efficient caching
    });
  }

  protected parseData(content: string): Movie[] {
    try {
      const movies = JSON.parse(content);
      if (!Array.isArray(movies)) {
        throw new Error(`${this.options.filename} must be a JSON array of movie objects.`);
      }
      return movies;
    } catch (parseErr) {
      throw new Error(
        `${this.options.filename} contains invalid JSON. It must be a JSON array of movie objects.`
      );
    }
  }

  protected serializeData(data: Movie[]): string {
    return JSON.stringify(data, null, 2);
  }

  protected validateData(data: Movie[]): boolean {
    return Array.isArray(data);
  }

  protected getEmptyValue(): Movie[] {
    return [];
  }

  async fetchWithFallback(): Promise<Movie[]> {
    try {
      return await this.fetch();
    } catch (error) {
      console.warn(`Gist is missing "${this.options.filename}". Returning an empty movie list.`);
      return [];
    }
  }
}

// Singleton instance
export const movieService = new MovieService();

// Export functions for backward compatibility
export const getMovies = () => movieService.fetchWithFallback();
export const saveMovies = (movies: Movie[]) => movieService.save(movies);
