import type {
  ContentTab,
  Movie,
  MovieSuggestion,
  SortMode,
} from '../../shared/types.ts';

const normalizeSearch = (value: string): string => value.trim().toLowerCase();

export const sortWatchlistMovies = (
  movies: Movie[],
  sortMode: SortMode
): Movie[] => {
  const next = [...movies];

  switch (sortMode) {
    case 'title':
      next.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'year':
      next.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
      break;
    case 'recent':
    default:
      next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  return next;
};

export const filterWatchlistMovies = (
  movies: Movie[],
  searchQuery: string
): Movie[] => {
  const normalizedSearch = normalizeSearch(searchQuery);
  if (!normalizedSearch) {
    return movies;
  }

  return movies.filter((movie) =>
    `${movie.title} ${movie.year || ''} ${movie.category || ''}`
      .toLowerCase()
      .includes(normalizedSearch)
  );
};

export const filterPendingSuggestions = (
  suggestions: MovieSuggestion[],
  searchQuery: string
): MovieSuggestion[] => {
  const normalizedSearch = normalizeSearch(searchQuery);
  if (!normalizedSearch) {
    return suggestions;
  }

  return suggestions.filter((suggestion) =>
    `${suggestion.title} ${suggestion.suggestedBy} ${suggestion.reason || ''}`
      .toLowerCase()
      .includes(normalizedSearch)
  );
};

export const getWatchlistTabCounts = (
  movies: Movie[],
  pendingSuggestions: MovieSuggestion[]
): Record<ContentTab, number> => ({
  queue: movies.filter((movie) => movie.watchedBy.length < 2).length,
  watched: movies.filter((movie) => movie.watchedBy.length === 2).length,
  suggestions: pendingSuggestions.length,
});

export interface WatchlistTabView {
  movies: Movie[];
  suggestions: MovieSuggestion[];
  surprisePool: string[];
  emptyState: string;
}

export const buildWatchlistTabView = ({
  contentTab,
  movies,
  pendingSuggestions,
  sortMode,
  searchQuery,
}: {
  contentTab: ContentTab;
  movies: Movie[];
  pendingSuggestions: MovieSuggestion[];
  sortMode: SortMode;
  searchQuery: string;
}): WatchlistTabView => {
  if (contentTab === 'suggestions') {
    const suggestions = filterPendingSuggestions(pendingSuggestions, searchQuery);

    return {
      movies: [],
      suggestions,
      surprisePool: suggestions.map((suggestion) => suggestion.title).filter(Boolean),
      emptyState: searchQuery.trim()
        ? 'No suggestions found matching your search'
        : 'No pending suggestions right now',
    };
  }

  const tabMovies = movies.filter((movie) =>
    contentTab === 'queue' ? movie.watchedBy.length < 2 : movie.watchedBy.length === 2
  );
  const filteredMovies = filterWatchlistMovies(
    sortWatchlistMovies(tabMovies, sortMode),
    searchQuery
  );

  return {
    movies: filteredMovies,
    suggestions: [],
    surprisePool: filteredMovies.map((movie) => movie.title).filter(Boolean),
    emptyState: searchQuery.trim()
      ? 'No matching movies found'
      : contentTab === 'watched'
        ? 'No watched movies yet'
        : 'No movies in queue',
  };
};
