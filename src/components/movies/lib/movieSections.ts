import type { Movie, MovieSuggestion } from '@/shared/types';
import { buildCollectionSections, type CollectionSections } from '../../../utils/workspace.ts';

export type MovieSections = CollectionSections<Movie, MovieSuggestion>;

export const buildMovieSections = (
  movies: Movie[],
  pendingSuggestions: MovieSuggestion[],
): MovieSections => {
  const sections = buildCollectionSections(
    movies,
    pendingSuggestions,
    (movie) => movie.watchedBy.length === 2,
  );

  return {
    suggestions: sections.suggestions,
    queue: sections.queue,
    completed: sections.completed,
  };
};
