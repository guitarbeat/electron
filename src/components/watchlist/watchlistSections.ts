import type { Movie, MovieSuggestion } from '@/shared/types';

export interface WatchlistSections {
  suggestions: MovieSuggestion[];
  queue: Movie[];
  watched: Movie[];
}

export const buildWatchlistSections = (
  movies: Movie[],
  pendingSuggestions: MovieSuggestion[]
): WatchlistSections => ({
  suggestions: pendingSuggestions,
  queue: movies.filter((movie) => movie.watchedBy.length < 2),
  watched: movies.filter((movie) => movie.watchedBy.length === 2),
});
