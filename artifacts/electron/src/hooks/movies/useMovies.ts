import { useEffect, useCallback, useMemo, useRef } from "react";
import type { Movie, User } from "@/shared/types";
import {
  fetchOmdbMetadata as fetchMovieMetadata,
  MovieMetadata,
  type MovieAutocompleteResult,
} from "@/services/metadata";
import {
  concurrentMap,
  isValidUrl,
  MAX_MOVIE_TITLE_LENGTH,
  sanitizeInput,
} from "@/utils";
import { useCollection } from "../useCollection";

const POLLING_INTERVAL = 15000;

const extractSafeMetadata = (metadata: MovieMetadata): Partial<Movie> => {
  const { poster, year, plot, imdbRating, runtime, genre, director } = metadata;
  const result: Partial<Movie> = {};
  if (poster && isValidUrl(poster)) result.posterUrl = poster;
  if (year) result.year = year;
  if (plot) result.plot = sanitizeInput(plot);
  if (imdbRating) result.imdbRating = imdbRating;
  if (runtime) result.runtime = runtime;
  if (genre && Array.isArray(genre))
    result.genre = sanitizeInput(genre.join(", "));
  if (director) result.director = sanitizeInput(director);
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

  const performMutationIfMoviePresent = useCallback(
    async (
      movieId: string,
      op: string,
      payload: unknown,
      buildOptimistic: (current: Movie[]) => Movie[],
    ): Promise<boolean> => {
      const current = moviesRef.current;
      if (!current.some((m) => m.id === movieId)) {
        return false;
      }
      await performMutation(op, payload, buildOptimistic(current));
      return true;
    },
    [performMutation],
  );

  const updateMovieMetadata = useCallback(
    async (movie: Movie, searchTerm?: string) => {
      const metadata = await fetchMovieMetadata(searchTerm || movie.title);
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

      const newMovie: Movie = {
        id: crypto.randomUUID(),
        title: cleanTitle,
        addedBy: currentUser,
        watchedBy: [],
        createdAt: new Date().toISOString(),
      };

      await performMutation(
        "add_movie",
        {
          id: newMovie.id,
          title: newMovie.title,
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
        } catch (metadataError) {
          console.warn("Metadata enrichment failed:", metadataError);
        }
      })();

      return newMovie;
    },
    [currentUser, movies, performMutation, performMutationIfMoviePresent],
  );

  const renameMovie = useCallback(
    async (movieId: string, title: string) => {
      if (!currentUser) {
        throw new Error("Profile required");
      }

      const currentMovie = movies.find((entry) => entry.id === movieId);
      if (!currentMovie) {
        throw new Error("Movie not found");
      }

      const cleanTitle = validateMovieTitle(title);

      const optimisticMovies = movies.map((movie) =>
        movie.id === movieId ? { ...movie, title: cleanTitle } : movie,
      );

      await performMutation(
        "rename_movie",
        {
          movieId,
          title: cleanTitle,
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
        } catch (metadataError) {
          console.warn("Metadata refresh failed after rename:", metadataError);
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
        movies.map((movie) => {
          if (movie.id !== movieId) {
            return movie;
          }

          return {
            ...movie,
            watchedBy: movie.watchedBy.includes(currentUser)
              ? movie.watchedBy.filter((user) => user !== currentUser)
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
        movies.filter((movie) => movie.id !== movieId),
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
      const movie = movies.find((entry) => entry.id === movieId);
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
          const metadata = await fetchMovieMetadata(movie.title);
          return { movieId: movie.id, metadata: extractSafeMetadata(metadata) };
        } catch {
          return { movieId: movie.id, metadata: {} };
        }
      });

      const validUpdates = refreshed.filter(
        (update) =>
          Object.keys(update.metadata).length > 0 &&
          moviesRef.current.some((m) => m.id === update.movieId),
      );

      const updatesMap = new Map(
        validUpdates.map((u) => [u.movieId, u.metadata]),
      );
      const optimisticMovies = latestMovies.map((movie) => {
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
      (m) => !m.posterUrl || !m.plot || !m.year,
    );
    if (moviesMissingMetadata.length === 0) {
      hasAutoSyncedRef.current = true;
      return;
    }

    hasAutoSyncedRef.current = true;

    await new Promise((resolve) => {
      window.setTimeout(resolve, 2000);
    });

    await concurrentMap(moviesMissingMetadata, 5, async (movie) => {
      if (!currentUser) return;
      try {
        await updateMovieMetadata(movie);
      } catch (error) {
        console.warn(`Auto-sync failed for ${movie.title}:`, error);
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
    renameMovie,
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
