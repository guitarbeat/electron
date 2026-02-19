import { useMemo } from 'react';
import { useMovies } from '../../../hooks/useMovies';
import { useSuggestions } from '../../../hooks/useSuggestions';
import { useMemories } from '../../../hooks/useMemories';
import { buildMovieMemorySummaries } from '../../memories/memoryUtils';
import { SortMode, ContentTab } from '../types';
import { User } from '../../../types';

interface UseWatchlistDataProps {
  currentUser: User | null;
  isPaused: boolean;
  sortMode: SortMode;
  contentTab: ContentTab;
  searchQuery: string;
  showMemoriesOnly: boolean;
}

export const useWatchlistData = ({
  currentUser,
  isPaused,
  sortMode,
  contentTab,
  searchQuery,
  showMemoriesOnly,
}: UseWatchlistDataProps) => {
  const {
    movies,
    isLoading,
    isSubmitting,
    addMovie,
    toggleWatched,
    deleteMovie,
    refresh: refreshMovies,
    manualMetadataUpdate,
  } = useMovies(currentUser, isPaused);

  const {
    pendingSuggestions,
    addSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    isLoading: isSuggestionsLoading,
  } = useSuggestions(isPaused);

  const {
    memories,
    addMemory,
    updateMemory,
    deleteMemory: deleteMemoryRecord,
    toggleMemoryPin,
    isLoading: isMemoriesLoading,
    error: memoriesError,
  } = useMemories(isPaused);

  const unwatchedMovies = useMemo(
    () => (movies ? movies.filter((movie) => movie.watchedBy.length < 2) : []),
    [movies]
  );
  const watchedMovies = useMemo(
    () => (movies ? movies.filter((movie) => movie.watchedBy.length === 2) : []),
    [movies]
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const movieMemorySummaries = useMemo(
    () => buildMovieMemorySummaries(movies || [], memories),
    [movies, memories]
  );

  const memoryErrorMessage =
    memoriesError instanceof Error
      ? memoriesError.message
      : memoriesError
        ? String(memoriesError)
        : null;

  const sortedMovies = useMemo(() => {
    if (!movies) return [];
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
        break;
    }
    return next;
  }, [movies, sortMode]);

  const filteredMovies = useMemo(() => {
    return sortedMovies.filter((movie) => {
      const inTab =
        contentTab === 'all' ||
        (contentTab === 'to-watch' && movie.watchedBy.length < 2) ||
        (contentTab === 'watched' && movie.watchedBy.length === 2);
      if (!inTab) return false;
      if (showMemoriesOnly && !movieMemorySummaries.has(movie.id)) return false;
      if (!normalizedSearch) return true;
      return `${movie.title} ${movie.year || ''} ${movie.category || ''}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [sortedMovies, contentTab, normalizedSearch, showMemoriesOnly, movieMemorySummaries]);

  const filteredSuggestions = useMemo(() => {
    if (showMemoriesOnly) {
      return [];
    }
    if (contentTab !== 'all' && contentTab !== 'suggestions') {
      return [];
    }
    return pendingSuggestions.filter((suggestion) => {
      if (!normalizedSearch) return true;
      return `${suggestion.title} ${suggestion.suggestedBy} ${suggestion.reason || ''}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [pendingSuggestions, contentTab, normalizedSearch, showMemoriesOnly]);

  const tabCounts = useMemo(
    () => ({
      all: sortedMovies.length,
      'to-watch': sortedMovies.filter((movie) => movie.watchedBy.length < 2).length,
      watched: sortedMovies.filter((movie) => movie.watchedBy.length === 2).length,
      suggestions: pendingSuggestions.length,
    }),
    [sortedMovies, pendingSuggestions]
  );

  return {
    movies,
    isLoading,
    isSubmitting,
    addMovie,
    toggleWatched,
    deleteMovie,
    refreshMovies,
    manualMetadataUpdate,
    pendingSuggestions,
    addSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    isSuggestionsLoading,
    memories,
    addMemory,
    updateMemory,
    deleteMemoryRecord,
    toggleMemoryPin,
    isMemoriesLoading,
    memoriesError: memoryErrorMessage,
    unwatchedMovies,
    watchedMovies,
    movieMemorySummaries,
    filteredMovies,
    filteredSuggestions,
    tabCounts,
  };
};
