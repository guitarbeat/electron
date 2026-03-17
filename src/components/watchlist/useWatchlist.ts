import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ALL_MOVIES_FILTER, buildMovieMemorySummaries } from '@/components/memories/memoryUtils';
import {
  addMemory as addMemoryService,
  deleteMemory as deleteMemoryService,
  getMemories,
  toggleMemoryPin as toggleMemoryPinService,
  updateMemory as updateMemoryService,
} from '@/services/memoryService';
import { usePolling } from '@/hooks/usePolling';
import { SortMode, ContentTab, Movie, User, SharedMemory } from '@/types';
import { useMovies } from '@/hooks/useMovies';
import { useSuggestions } from '@/hooks/useSuggestions';
import { useToast } from '@/context';

const MEMORY_FILTER_STORAGE_KEY = 'queueMemoryFilter';
const MEMORY_FILTER_DEFAULT = 'all';
const POLLING_INTERVAL = 30000;
const memoriesEqual = (prev: SharedMemory[] | undefined, next: SharedMemory[]) => {
  if (!prev) return false;
  if (prev.length !== next.length) return false;
  return JSON.stringify(prev) === JSON.stringify(next);
};

interface UseWatchlistProps {
  currentUser: User | null;
  isPaused: boolean;
}

interface WatchlistToast {
  message: string;
  type: 'success' | 'error' | 'info';
  onUndo?: () => void;
}

const breakpoints = {
  sm: '(max-width: 640px)',
  md: '(max-width: 768px)',
  lg: '(max-width: 1024px)',
  xl: '(max-width: 1280px)',
};

const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (callback: () => void) => {
      const matchMedia = window.matchMedia(query);
      matchMedia.addEventListener('change', callback);
      return () => {
        matchMedia.removeEventListener('change', callback);
      };
    },
    [query]
  );

  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

export const useWatchlist = ({ currentUser, isPaused }: UseWatchlistProps) => {
  const isMobile = useMediaQuery(breakpoints.sm);
  const { showToast } = useToast();

  // State (from useWatchlistState)
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [successMovieId, setSuccessMovieId] = useState<string | null>(null);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<string | null>(null);
  const [contentTab, setContentTab] = useState<ContentTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [movieToFix, setMovieToFix] = useState<Movie | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeMemoryFilter, setActiveMemoryFilter] = useState(ALL_MOVIES_FILTER);
  const [showMemoriesOnly, setShowMemoriesOnly] = useState(false);
  const [isMemoryWallCollapsed, setIsMemoryWallCollapsed] = useState(isMobile);
  const [highlightMovieId, setHighlightMovieId] = useState<string | null>(null);

  // Refs
  const previousMoviesRef = useRef<Movie[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const memorySectionRef = useRef<HTMLDivElement | null>(null);
  const movieResultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMemoryWallCollapsed(isMobile);
  }, [isMobile]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlFilter = searchParams.get('memoryFilter');
    const savedFilter = localStorage.getItem(MEMORY_FILTER_STORAGE_KEY);
    const initialFilter = urlFilter || savedFilter || MEMORY_FILTER_DEFAULT;
    setActiveMemoryFilter(initialFilter);
  }, []);

  useEffect(() => {
    localStorage.setItem(MEMORY_FILTER_STORAGE_KEY, activeMemoryFilter);
    const url = new URL(window.location.href);
    if (activeMemoryFilter === ALL_MOVIES_FILTER) {
      url.searchParams.delete('memoryFilter');
    } else {
      url.searchParams.set('memoryFilter', activeMemoryFilter);
    }
    window.history.replaceState({}, '', url.toString());
  }, [activeMemoryFilter]);

  useEffect(() => {
    if (activeMemoryFilter !== MEMORY_FILTER_DEFAULT) {
      setIsMemoryWallCollapsed(false);
    }
  }, [activeMemoryFilter]);

  const setToast = useCallback(
    (toast: WatchlistToast | null) => {
      if (!toast) return;
      showToast({
        message: toast.message,
        type: toast.type,
        onUndo: toast.onUndo,
        duration: toast.onUndo ? 6000 : 3500,
      });
    },
    [showToast]
  );

  // Data (from useWatchlistData)
  const {
    movies,
    isLoading,
    isSubmitting,
    error: moviesError,
    refresh: refreshMovies,
    addMovie,
    toggleWatched,
    deleteMovie,
    restoreMovie,
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
    data: polledMemories,
    isLoading: isMemoriesLoading,
    error: memoriesError,
    refresh: refreshMemories,
  } = usePolling<SharedMemory[]>(getMemories, POLLING_INTERVAL, memoriesEqual, {
    key: 'memories',
    isPaused,
  });
  const memories = useMemo(() => {
    return [...(polledMemories || [])].sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [polledMemories]);
  const addMemory = useCallback(
    async (movieId: string | undefined, movieTitle: string, author: string, note: string) => {
      const result = await addMemoryService(movieId, movieTitle, author, note);
      refreshMemories();
      return result;
    },
    [refreshMemories]
  );
  const updateMemory = useCallback(
    async (memoryId: string, updates: { note?: string; movieId?: string; movieTitle?: string }) => {
      const result = await updateMemoryService(memoryId, updates);
      refreshMemories();
      return result;
    },
    [refreshMemories]
  );
  const deleteMemoryRecord = useCallback(
    async (memoryId: string) => {
      await deleteMemoryService(memoryId);
      refreshMemories();
    },
    [refreshMemories]
  );
  const toggleMemoryPin = useCallback(
    async (memoryId: string) => {
      const result = await toggleMemoryPinService(memoryId);
      refreshMemories();
      return result;
    },
    [refreshMemories]
  );

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

  let memoryErrorMessage: string | null = null;
  if (memoriesError instanceof Error) {
    memoryErrorMessage = memoriesError.message;
  } else if (memoriesError) {
    memoryErrorMessage = String(memoriesError);
  }

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
    // State returns
    isMobile,
    newMovieTitle,
    setNewMovieTitle,
    isAdding,
    setIsAdding,
    movieToDelete,
    setMovieToDelete,
    setToast,
    successMovieId,
    setSuccessMovieId,
    processingSuggestionId,
    setProcessingSuggestionId,
    contentTab,
    setContentTab,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    movieToFix,
    setMovieToFix,
    showConfetti,
    setShowConfetti,
    activeMemoryFilter,
    setActiveMemoryFilter,
    showMemoriesOnly,
    setShowMemoriesOnly,
    isMemoryWallCollapsed,
    setIsMemoryWallCollapsed,
    highlightMovieId,
    setHighlightMovieId,
    previousMoviesRef,
    inputRef,
    memorySectionRef,
    movieResultsRef,

    // Data returns
    movies,
    isLoading,
    isSubmitting,
    moviesError,
    addMovie,
    toggleWatched,
    deleteMovie,
    restoreMovie,
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
