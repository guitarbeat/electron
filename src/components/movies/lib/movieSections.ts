import type { Movie, MovieSuggestion } from '@/shared/types';

export interface MovieSections {
  suggestions: MovieSuggestion[];
  upNext: Movie[];
  watched: Movie[];
}

export const buildMovieSections = (
  movies: Movie[],
  pendingSuggestions: MovieSuggestion[]
): MovieSections => ({
  suggestions: pendingSuggestions,
  upNext: movies.filter((movie) => movie.watchedBy.length < 2),
  watched: movies.filter((movie) => movie.watchedBy.length === 2),
});
