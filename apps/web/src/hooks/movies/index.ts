import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trackMetric } from "../../services/analytics/index.ts";
import type { Movie, MovieSuggestion, User } from "@/shared/types";
import {
  fetchOmdbMetadata as fetchMovieMetadata,
  MovieMetadata,
  type MovieAutocompleteResult,
} from "@/services/metadata";
import {
  addMemory as addMemoryService,
  deleteMemory as deleteMemoryService,
  getMemories,
  toggleMemoryPin as toggleMemoryPinService,
  updateMemory as updateMemoryService,
} from "@/services/content";
import {
  buildCollectionSections,
  concurrentMap,
  findMovieByNormalizedTitle,
  getWorkspaceCollectionState,
  isValidUrl,
  MAX_MOVIE_TITLE_LENGTH,
  sanitizeInput,
} from "@/utils";
import { useCollection } from "../index.ts";
import { useSuggestions } from "../suggestions";
import { useToast } from "@/app/providerContexts";
import { isMockMode } from "../../services/state";
import { warmServiceWorkerMedia } from "../../services/swMediaCache";

const POLLING_INTERVAL = 15000;

const extractSafeMetadata = (metadata: MovieMetadata): Partial<Movie> => {
  const { poster, year, plot, imdbRating, runtime, genre, director, type } =
    metadata;
  const result: Partial<Movie> = {};
  if (poster && isValidUrl(poster)) result.posterUrl = poster;
  if (year) result.year = year;
  if (plot) result.plot = sanitizeInput(plot);
  if (imdbRating) result.imdbRating = imdbRating;
  if (runtime) result.runtime = runtime;
  if (genre && Array.isArray(genre))
    result.genre = sanitizeInput(genre.join(", "));
  if (director) result.director = sanitizeInput(director);
  if (type === "series" || type === "movie" || type === "youtube") result.mediaType = type;
  if (type === "series") result.category = "TV Series";
  return result;
};

const validateMovieTitle = (title: string): string => {
  const cleanTitle = sanitizeInput(title);
  if (!cleanTitle) {
    throw new Error("Movie title cannot be empty");
  }
  if (cleanTitle.length > MAX_MOVIE_TITLE_LENGTH) {
    throw new Error(
      `Movie title exceeds maximum length of ${MAX_MOVIE_TITLE_LENGTH} characters`,
    );
  }
  return cleanTitle;
};

const sortMovies = (movies: Movie[]): Movie[] =>
  [...movies].sort((a, b) => {
    const aWatchedByBoth = a.watchedBy.length === 2;
    const bWatchedByBoth = b.watchedBy.length === 2;

    if (aWatchedByBoth && !bWatchedByBoth) {
      return 1;
    }
    if (!aWatchedByBoth && bWatchedByBoth) {
      return -1;
    }

    if (b.createdAt > a.createdAt) return 1;
    if (b.createdAt < a.createdAt) return -1;
    return 0;
  });

export const useMovies = (
  currentUser: User | null,
  isPaused: boolean = false,
) => {
  const {
    data: movies,
    isLoading,
    isSubmitting,
    error,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    performMutation,
  } = useCollection<Movie>("movies", currentUser, {
    pollingInterval: POLLING_INTERVAL,
    isPaused,
  });

  const hasAutoSyncedRef = useRef(false);
  const isRefreshingMetadataRef = useRef(false);
  const moviesRef = useRef(movies);
  moviesRef.current = movies;

  useEffect(() => {
    if (movies && movies.length > 0) {
      const posterUrls = movies
        .map((m) => m.posterUrl)
        .filter((url): url is string => Boolean(url));
      warmServiceWorkerMedia(posterUrls);
    }
  }, [movies]);

  const performMutationIfMoviePresent = useCallback(
    async (
      movieId: string,
      op: string,
      payload: unknown,
      buildOptimistic: (current: Movie[]) => Movie[],
    ): Promise<boolean> => {
      const current = moviesRef.current;
      if (!current.some((m: Movie) => m.id === movieId)) {
        return false;
      }
      await performMutation(op, payload, buildOptimistic(current));
      return true;
    },
    [performMutation],
  );

  const updateMovieMetadata = useCallback(
    async (movie: Movie, searchTerm?: string) => {
      const metadata = await fetchMovieMetadata(searchTerm || movie.title, movie.mediaType);
      const safeMetadata = extractSafeMetadata(metadata);
      if (Object.keys(safeMetadata).length === 0) {
        return false;
      }

      return performMutationIfMoviePresent(
        movie.id,
        "update_metadata",
        {
          movieId: movie.id,
          metadata: safeMetadata,
        },
        (current) =>
          current.map((entry) =>
            entry.id === movie.id ? { ...entry, ...safeMetadata } : entry,
          ),
      );
    },
    [performMutationIfMoviePresent],
  );

  const addMovie = useCallback(
    async (
      title: string,
      selectedResult?: Pick<MovieAutocompleteResult, "imdbID" | "type">,
    ) => {
      if (!currentUser) {
        throw new Error("Profile required");
      }

      const cleanTitle = validateMovieTitle(title);

      if (findMovieByNormalizedTitle(movies, cleanTitle)) {
        throw new Error(`"${cleanTitle}" is already in your movie list.`);
      }

      const newMovie: Movie = {
        id: crypto.randomUUID(),
        title: cleanTitle,
        addedBy: currentUser,
        watchedBy: [],
        createdAt: new Date().toISOString(),
        mediaType: selectedResult?.type,
        category: selectedResult?.type === "series" ? "TV Series" : undefined,
      };

      await performMutation(
        "add_movie",
        {
          id: newMovie.id,
          title: newMovie.title,
          metadata: {
            mediaType: newMovie.mediaType,
            category: newMovie.category,
          },
        },
        [...movies, newMovie],
      );

      void (async () => {
        try {
          const metadata = await fetchMovieMetadata(
            cleanTitle,
            selectedResult?.type,
            selectedResult?.imdbID,
          );
          const safeMetadata = extractSafeMetadata(metadata);
          if (Object.keys(safeMetadata).length === 0) {
            return;
          }

          await performMutationIfMoviePresent(
            newMovie.id,
            "update_metadata",
            {
              movieId: newMovie.id,
              metadata: safeMetadata,
            },
            (current) =>
              current.map((entry) =>
                entry.id === newMovie.id
                  ? { ...entry, ...safeMetadata }
                  : entry,
              ),
          );
        } catch {
          // Ignore non-critical metadata fetch errors
        }
      })();

      return newMovie;
    },
    [currentUser, movies, performMutation, performMutationIfMoviePresent],
  );

  const editMovie = useCallback(
    async (
      movieId: string,
      updates: { title: string; customPosterUrl?: string },
    ) => {
      if (!currentUser) {
        throw new Error("Profile required");
      }

      const currentMovie = movies.find((entry: Movie) => entry.id === movieId);
      if (!currentMovie) {
        throw new Error("Movie not found");
      }

      const cleanTitle = validateMovieTitle(updates.title);

      const optimisticMovies = movies.map((movie: Movie) =>
        movie.id === movieId
          ? {
              ...movie,
              title: cleanTitle,
              ...(updates.customPosterUrl !== undefined
                ? { customPosterUrl: updates.customPosterUrl || undefined }
                : {}),
            }
          : movie,
      );

      await performMutation(
        "edit_movie",
        {
          movieId,
          title: cleanTitle,
          customPosterUrl: updates.customPosterUrl,
        },
        optimisticMovies,
      );

      void (async () => {
        try {
          const metadata = await fetchMovieMetadata(cleanTitle);
          const safeMetadata = extractSafeMetadata(metadata);
          if (Object.keys(safeMetadata).length === 0) {
            return;
          }

          await performMutationIfMoviePresent(
            movieId,
            "update_metadata",
            {
              movieId,
              metadata: safeMetadata,
            },
            (current) =>
              current.map((movie) =>
                movie.id === movieId
                  ? {
                      ...movie,
                      ...safeMetadata,
                    }
                  : movie,
              ),
          );
        } catch {
          // Ignore non-critical metadata fetch errors
        }
      })();
    },
    [currentUser, movies, performMutation, performMutationIfMoviePresent],
  );

  const toggleWatched = useCallback(
    async (movieId: string) => {
      if (!currentUser) {
        throw new Error("Profile required");
      }

      await performMutation(
        "toggle_watched",
        { movieId },
        movies.map((movie: Movie) => {
          if (movie.id !== movieId) {
            return movie;
          }

          return {
            ...movie,
            watchedBy: movie.watchedBy.includes(currentUser)
              ? movie.watchedBy.filter((user: User) => user !== currentUser)
              : [...movie.watchedBy, currentUser],
          };
        }),
      );
    },
    [currentUser, movies, performMutation],
  );

  const deleteMovie = useCallback(
    async (movieId: string) => {
      await performMutation(
        "delete_movie",
        { movieId },
        movies.filter((movie: Movie) => movie.id !== movieId),
      );
    },
    [movies, performMutation],
  );

  const restoreMovie = useCallback(
    async (movie: Movie) => {
      await performMutation("restore_movie", { movie }, [...movies, movie]);
    },
    [movies, performMutation],
  );

  const manualMetadataUpdate = useCallback(
    async (movieId: string, searchTerm?: string) => {
      const movie = movies.find((entry: Movie) => entry.id === movieId);
      if (!movie) {
        return false;
      }

      return updateMovieMetadata(movie, searchTerm);
    },
    [movies, updateMovieMetadata],
  );

  const refreshAllMetadata = useCallback(async () => {
    if (!currentUser || isSubmitting || isRefreshingMetadataRef.current) {
      return false;
    }

    isRefreshingMetadataRef.current = true;
    try {
      const latestMovies = [...movies];
      const refreshed = await concurrentMap(latestMovies, 5, async (movie) => {
        try {
          const metadata = await fetchMovieMetadata(movie.title, movie.mediaType);
          return { movieId: movie.id, metadata: extractSafeMetadata(metadata) };
        } catch {
          return { movieId: movie.id, metadata: {} };
        }
      });

      const validUpdates = refreshed.filter(
        (update) =>
          Object.keys(update.metadata).length > 0 &&
          moviesRef.current.some((m: Movie) => m.id === update.movieId),
      );

      const updatesMap = new Map<string, Partial<Movie>>(
        validUpdates.map((update) => [update.movieId, update.metadata]),
      );
      const optimisticMovies = latestMovies.map((movie: Movie) => {
        const metadataUpdate = updatesMap.get(movie.id);
        return metadataUpdate ? { ...movie, ...metadataUpdate } : movie;
      });

      await Promise.all(
        validUpdates.map((update) =>
          performMutationIfMoviePresent(
            update.movieId,
            "update_metadata",
            { movieId: update.movieId, metadata: update.metadata },
            () => optimisticMovies,
          ),
        ),
      );

      refresh();
      return true;
    } finally {
      isRefreshingMetadataRef.current = false;
    }
  }, [
    currentUser,
    isSubmitting,
    movies,
    performMutationIfMoviePresent,
    refresh,
  ]);

  const autoSyncMetadata = useCallback(async () => {
    if (
      !currentUser ||
      hasAutoSyncedRef.current ||
      movies.length === 0 ||
      isSubmitting
    ) {
      return;
    }

    const moviesMissingMetadata = movies.filter(
      (m: Movie) => !m.posterUrl || !m.plot || !m.year,
    );
    if (moviesMissingMetadata.length === 0) {
      hasAutoSyncedRef.current = true;
      return;
    }

    hasAutoSyncedRef.current = true;

    await new Promise((resolve) => {
      window.setTimeout(resolve, 2000);
    });

    await concurrentMap(moviesMissingMetadata, 5, async (movie: Movie) => {
      if (!currentUser) return;
      try {
        await updateMovieMetadata(movie);
      } catch {
        // Ignore non-critical metadata fetch errors
      }
    });
  }, [currentUser, isSubmitting, movies, updateMovieMetadata]);

  useEffect(() => {
    if (
      currentUser &&
      !isLoading &&
      movies.length > 0 &&
      !hasAutoSyncedRef.current
    ) {
      void autoSyncMetadata();
    }
  }, [autoSyncMetadata, currentUser, isLoading, movies]);

  const sortedMovies = useMemo(() => sortMovies(movies), [movies]);

  return {
    movies: sortedMovies,
    isLoading,
    error,
    isSubmitting,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    addMovie,
    editMovie,
    toggleWatched,
    deleteMovie,
    restoreMovie,
    refresh,
    retrySync,
    updateMovieMetadata,
    manualMetadataUpdate,
    refreshAllMetadata,
  };
};

export interface UseMoviesWorkspaceOptions {
  currentUser?: User | null;
  isPaused?: boolean;
  focusSearchInput?: () => void;
}

export const useMoviesWorkspace = (
  optionsOrUser?: User | null | UseMoviesWorkspaceOptions,
  legacyOptions?: { isPaused?: boolean },
) => {
  let currentUser: User | null = null;
  let isPaused = false;

  if (
    optionsOrUser &&
    typeof optionsOrUser === "object" &&
    !("id" in optionsOrUser && "name" in optionsOrUser)
  ) {
    const opts = optionsOrUser as UseMoviesWorkspaceOptions;
    currentUser = opts.currentUser ?? null;
    isPaused = opts.isPaused ?? false;
  } else {
    currentUser = (optionsOrUser as User | null) ?? null;
    isPaused = legacyOptions?.isPaused ?? false;
  }

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const moviesState = useMovies(currentUser, isPaused);
  const suggestionsState = useSuggestions(isPaused);

  // Search & top controls state
  const [searchQuery, setSearchQuery] = useState("");
  const [guestName, setGuestName] = useState("");
  const [selectedAutocompleteResult, setSelectedAutocompleteResult] =
    useState<MovieAutocompleteResult | null>(null);
  const [recommendationReason, setRecommendationReason] = useState("");
  const [isRecommendationComposerOpen, setIsRecommendationComposerOpen] =
    useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmittingRecommendation, setIsSubmittingRecommendation] =
    useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  // UI modal / deletion state
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [successMovieId, setSuccessMovieId] = useState<string | null>(null);
  const [selectedMovieForNotes, setSelectedMovieForNotes] =
    useState<Movie | null>(null);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<
    string | null
  >(null);
  const previousMoviesRef = useRef<Movie[] | null>(null);

  // Queries for memories
  const memoriesQuery = useQuery({
    queryKey: ["memories"],
    queryFn: getMemories,
    staleTime: 30000,
  });
  const memories = useMemo(
    () => memoriesQuery.data ?? [],
    [memoriesQuery.data],
  );

  const resetRecommendationComposer = useCallback(() => {
    setIsRecommendationComposerOpen(false);
    setRecommendationReason("");
    setSuggestionError(null);
  }, []);

  const openRecommendationComposer = useCallback(() => {
    setIsRecommendationComposerOpen(true);
    setSuggestionError(null);
  }, []);

  const handleRecommendationReasonChange = useCallback((val: string) => {
    setRecommendationReason(val);
    if (val.trim().length > 0) {
      setSuggestionError(null);
    }
  }, []);

  const handleAddAction = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsAdding(true);
    try {
      await moviesState.addMovie(
        searchQuery,
        selectedAutocompleteResult
          ? {
              imdbID: selectedAutocompleteResult.imdbID,
              type: selectedAutocompleteResult.type,
            }
          : undefined,
      );
      setSearchQuery("");
      setSelectedAutocompleteResult(null);
      showToast({ message: `Added "${searchQuery}"`, type: "info" });
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Failed to add movie",
        type: "error",
      });
    } finally {
      setIsAdding(false);
    }
  }, [searchQuery, selectedAutocompleteResult, moviesState, showToast]);

  const handleSubmitRecommendation = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSubmittingRecommendation(true);
    setSuggestionError(null);
    try {
      await suggestionsState.addSuggestion(
        searchQuery,
        recommendationReason,
        guestName,
        selectedAutocompleteResult
          ? {
              imdbID: selectedAutocompleteResult.imdbID,
              type: selectedAutocompleteResult.type,
            }
          : undefined,
      );
      showToast({
        message: `Suggested "${searchQuery}"`,
        type: "success",
      });
      setSearchQuery("");
      setSelectedAutocompleteResult(null);
      resetRecommendationComposer();
    } catch (err) {
      setSuggestionError(
        err instanceof Error ? err.message : "Failed to submit recommendation",
      );
    } finally {
      setIsSubmittingRecommendation(false);
    }
  }, [
    searchQuery,
    recommendationReason,
    guestName,
    selectedAutocompleteResult,
    suggestionsState,
    showToast,
    resetRecommendationComposer,
  ]);

  const handleAcceptSuggestion = useCallback(
    async (suggestionOrId: MovieSuggestion | string) => {
      if (!currentUser) {
        showToast({
          message: "Please select a profile to accept suggestions",
          type: "error",
        });
        return;
      }

      const suggestion =
        typeof suggestionOrId === "string"
          ? suggestionsState.suggestions.find(
              (s: MovieSuggestion) => s.id === suggestionOrId,
            )
          : suggestionOrId;

      if (!suggestion) return;
      setProcessingSuggestionId(suggestion.id);
      try {
        // Add a deliberate delay in mock mode so the user sees the spinner and transition
        if (isMockMode()) {
          await new Promise((resolve) => window.setTimeout(resolve, 800));
        }

        await suggestionsState.acceptSuggestion(suggestion.id, currentUser);

        await moviesState.addMovie(
          suggestion.title,
          suggestion.imdbID
            ? { imdbID: suggestion.imdbID, type: suggestion.type ?? "movie" }
            : undefined,
        );

        showToast({
          message: `Accepted "${suggestion.title}" suggestion`,
          type: "info",
        });
      } catch (err) {
        showToast({
          message:
            err instanceof Error ? err.message : "Failed to accept suggestion",
          type: "error",
        });
      } finally {
        setProcessingSuggestionId(null);
      }
    },
    [currentUser, moviesState, showToast, suggestionsState],
  );

  const handleRejectSuggestion = useCallback(
    async (suggestionOrId: MovieSuggestion | string) => {
      if (!currentUser) {
        showToast({
          message: "Please select a profile to reject suggestions",
          type: "error",
        });
        return;
      }

      const id =
        typeof suggestionOrId === "string" ? suggestionOrId : suggestionOrId.id;
      const target = suggestionsState.suggestions.find(
        (s: MovieSuggestion) => s.id === id,
      );
      if (!target) return;

      setProcessingSuggestionId(id);
      try {
        // Add a deliberate delay in mock mode
        if (isMockMode()) {
          await new Promise((resolve) => window.setTimeout(resolve, 800));
        }

        await suggestionsState.rejectSuggestion(id, currentUser);

        showToast({
          message: `Rejected "${target.title}" suggestion`,
          type: "info",
        });
      } catch (err) {
        showToast({
          message:
            err instanceof Error ? err.message : "Failed to reject suggestion",
          type: "error",
        });
      } finally {
        setProcessingSuggestionId(null);
      }
    },
    [currentUser, showToast, suggestionsState],
  );

  const confirmDelete = useCallback(async () => {
    if (!movieToDelete) return;
    const target = movieToDelete;
    setMovieToDelete(null);
    await moviesState.deleteMovie(target.id);
    showToast({
      message: `Removed "${target.title}"`,
      type: "info",
      actionLabel: "Undo",
      onAction: async () => {
        await moviesState.restoreMovie(target);
      },
    });
  }, [movieToDelete, moviesState, showToast]);

  const handleAddMemory = useCallback(
    async (
      movieId: string | undefined,
      movieTitle: string,
      author: string,
      note: string,
    ) => {
      await addMemoryService(movieId, movieTitle, author, note);
      await queryClient.invalidateQueries({ queryKey: ["memories"] });
      showToast({
        message: `Added memory for "${movieTitle}"`,
        type: "info",
      });
    },
    [queryClient, showToast],
  );

  const handleUpdateMemory = useCallback(
    async (
      memoryId: string,
      updates: { note?: string; movieId?: string; movieTitle?: string },
    ) => {
      await updateMemoryService(memoryId, updates);
      await queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
    [queryClient],
  );

  const handleDeleteMemoryRecord = useCallback(
    async (memoryId: string) => {
      await deleteMemoryService(memoryId);
      await queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
    [queryClient],
  );

  const handleToggleMemoryPin = useCallback(
    async (memoryId: string) => {
      await toggleMemoryPinService(memoryId);
      await queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
    [queryClient],
  );

  const setToast = useCallback(
    (opts: { message: string; type?: "info" | "success" | "error" }) => {
      showToast({ message: opts.message, type: opts.type ?? "info" });
    },
    [showToast],
  );

  const { queue: watchQueue, completed: watchedMovies } = useMemo(
    () =>
      buildCollectionSections(
        moviesState.movies,
        [],
        (movie) => movie.watchedBy.length === 2,
      ),
    [moviesState.movies],
  );

  const collectionState = useMemo(
    () =>
      getWorkspaceCollectionState({
        itemCount: moviesState.movies.length,
        suggestionCount: suggestionsState.pendingSuggestions.length,
        isLoadingItems: moviesState.isLoading,
        isLoadingSuggestions: suggestionsState.isLoading,
      }),
    [
      moviesState.isLoading,
      moviesState.movies.length,
      suggestionsState.isLoading,
      suggestionsState.pendingSuggestions.length,
    ],
  );

  return {
    ...moviesState,
    searchQuery,
    setSearchQuery,
    isAdding,
    movieToDelete,
    setMovieToDelete,
    setToast,
    successMovieId,
    setSuccessMovieId,
    suggestionError,
    isRecommendationComposerOpen,
    recommendationReason,
    guestName,
    setGuestName,
    selectedAutocompleteResult,
    setSelectedAutocompleteResult,
    resetRecommendationComposer,
    handleRecommendationReasonChange,
    openRecommendationComposer,
    handleAddAction,
    handleSubmitRecommendation,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    confirmDelete,
    processingSuggestionId,
    isSubmittingRecommendation,
    previousMoviesRef,
    watchQueue,
    watchedMovies,
    collectionState,
    pendingCount: suggestionsState.pendingSuggestions.length,
    suggestions: suggestionsState.suggestions,
    pendingSuggestions: suggestionsState.pendingSuggestions,
    isSuggestionsLoading: suggestionsState.isLoading,
    memories,
    isMoviesWorkspaceDegraded: moviesState.isDegraded,
    isMoviesWorkspaceSyncBlocked: moviesState.isSyncBlocked,
    moviesWorkspaceSyncWarning: moviesState.syncWarning,
    retryMoviesWorkspaceSync: moviesState.retrySync,
    selectedMovieForNotes,
    setSelectedMovieForNotes,
    handleAddMovie: handleAddAction,
    handleToggleWatched: moviesState.toggleWatched,
    handleDeleteMovie: moviesState.deleteMovie,
    addMemory: handleAddMemory,
    updateMemory: handleUpdateMemory,
    deleteMemoryRecord: handleDeleteMemoryRecord,
    toggleMemoryPin: handleToggleMemoryPin,
  };
};

export { trackMetric };
export { useMoviesScope } from "../index.ts";
