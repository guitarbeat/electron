import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Movie, User } from '@/shared/types';
import { usePolling } from '@/services/polling';
import { fetchMovieMetadata, MetadataResult } from '@/services/metadataService';
import { mutateScope, readScope, retryScopeSync } from '@/services/stateClient';
import {
  areDeeplyEqual,
  concurrentMap,
  isValidUrl,
  MAX_MOVIE_TITLE_LENGTH,
  sanitizeInput,
} from '@/utils';

const POLLING_INTERVAL = 15000;

const extractSafeMetadata = (metadata: MetadataResult): Partial<Movie> => {
  const { posterUrl, year, plot, imdbRating, runtime, genre, director } = metadata;
  const result: Partial<Movie> = {};
  if (posterUrl && isValidUrl(posterUrl)) result.posterUrl = posterUrl;
  if (year) result.year = year;
  if (plot) result.plot = sanitizeInput(plot);
  if (imdbRating) result.imdbRating = imdbRating;
  if (runtime) result.runtime = runtime;
  if (genre) result.genre = sanitizeInput(genre);
  if (director) result.director = sanitizeInput(director);
  return result;
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

export const useMovies = (currentUser: User | null, isPaused: boolean = false) => {
  const readMovies = useCallback(() => readScope('movies'), []);
  const {
    data: snapshot,
    error,
    isLoading,
    refresh,
  } = usePolling(readMovies, POLLING_INTERVAL, areDeeplyEqual, {
    key: 'movies',
    isPaused,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAutoSyncedRef = useRef(false);

  const movies = useMemo(() => snapshot?.data ?? [], [snapshot]);

  const performMutation = useCallback(
    async (
      op: string,
      payload: unknown,
      optimisticMovies: Movie[]
    ) => {
      if (!currentUser) {
        throw new Error('Profile required');
      }

      setIsSubmitting(true);
      try {
        await mutateScope('movies', {
          op,
          payload,
          optimisticData: optimisticMovies,
        });
        refresh();
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, refresh]
  );

  const updateMovieMetadata = useCallback(
    async (movie: Movie, searchTerm?: string) => {
      const metadata = await fetchMovieMetadata(searchTerm || movie.title);
      const safeMetadata = extractSafeMetadata(metadata);
      if (Object.keys(safeMetadata).length === 0) {
        return false;
      }

      await performMutation(
        'update_metadata',
        {
          movieId: movie.id,
          metadata: safeMetadata,
        },
        movies.map((entry) =>
          entry.id === movie.id ? { ...entry, ...safeMetadata } : entry
        )
      );
      return true;
    },
    [movies, performMutation]
  );

  const addMovie = useCallback(
    async (title: string) => {
      if (!currentUser) {
        throw new Error('Profile required');
      }

      const cleanTitle = sanitizeInput(title);
      if (!cleanTitle) {
        throw new Error('Movie title cannot be empty');
      }

      if (cleanTitle.length > MAX_MOVIE_TITLE_LENGTH) {
        throw new Error(
          `Movie title exceeds maximum length of ${MAX_MOVIE_TITLE_LENGTH} characters`
        );
      }

      const newMovie: Movie = {
        id: crypto.randomUUID(),
        title: cleanTitle,
        addedBy: currentUser,
        watchedBy: [],
        createdAt: new Date().toISOString(),
      };

      await performMutation(
        'add_movie',
        {
          id: newMovie.id,
          title: newMovie.title,
        },
        [...movies, newMovie]
      );

      void (async () => {
        try {
          const metadata = await fetchMovieMetadata(cleanTitle);
          const safeMetadata = extractSafeMetadata(metadata);
          if (Object.keys(safeMetadata).length === 0) {
            return;
          }

          await performMutation(
            'update_metadata',
            {
              movieId: newMovie.id,
              metadata: safeMetadata,
            },
            [...movies, { ...newMovie, ...safeMetadata }]
          );
        } catch (metadataError) {
          console.warn('Metadata enrichment failed:', metadataError);
        }
      })();

      return newMovie;
    },
    [currentUser, movies, performMutation]
  );

  const toggleWatched = useCallback(
    async (movieId: string) => {
      if (!currentUser) {
        throw new Error('Profile required');
      }

      await performMutation(
        'toggle_watched',
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
        })
      );
    },
    [currentUser, movies, performMutation]
  );

  const deleteMovie = useCallback(
    async (movieId: string) => {
      await performMutation(
        'delete_movie',
        { movieId },
        movies.filter((movie) => movie.id !== movieId)
      );
    },
    [movies, performMutation]
  );

  const restoreMovie = useCallback(
    async (movie: Movie) => {
      await performMutation(
        'restore_movie',
        { movie },
        [...movies, movie]
      );
    },
    [movies, performMutation]
  );

  const manualMetadataUpdate = useCallback(
    async (movieId: string, searchTerm?: string) => {
      const movie = movies.find((entry) => entry.id === movieId);
      if (!movie) {
        return false;
      }

      return updateMovieMetadata(movie, searchTerm);
    },
    [movies, updateMovieMetadata]
  );

  const refreshAllMetadata = useCallback(async () => {
    if (isSubmitting) return false;

    setIsSubmitting(true);
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

      let optimisticMovies = latestMovies;
      for (const update of refreshed) {
        if (Object.keys(update.metadata).length === 0) {
          continue;
        }

        optimisticMovies = optimisticMovies.map((movie) =>
          movie.id === update.movieId ? { ...movie, ...update.metadata } : movie
        );

        await mutateScope('movies', {
          op: 'update_metadata',
          payload: {
            movieId: update.movieId,
            metadata: update.metadata,
          },
          optimisticData: optimisticMovies,
        });
      }

      refresh();
      return true;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, movies, refresh]);

  const autoSyncMetadata = useCallback(async () => {
    if (hasAutoSyncedRef.current || movies.length === 0 || isSubmitting) {
      return;
    }

    const moviesMissingMetadata = movies.filter((m) => !m.posterUrl || !m.plot || !m.year);
    if (moviesMissingMetadata.length === 0) {
      hasAutoSyncedRef.current = true;
      return;
    }

    hasAutoSyncedRef.current = true;

    await new Promise((resolve) => {
      window.setTimeout(resolve, 2000);
    });

    for (const movie of moviesMissingMetadata) {
      try {
        await updateMovieMetadata(movie);
      } catch (error) {
        console.warn(`Auto-sync failed for ${movie.title}:`, error);
      }
    }
  }, [isSubmitting, movies, updateMovieMetadata]);

  useEffect(() => {
    if (!isLoading && movies.length > 0 && !hasAutoSyncedRef.current) {
      void autoSyncMetadata();
    }
  }, [autoSyncMetadata, isLoading, movies]);

  const retrySync = useCallback(async () => {
    await retryScopeSync('movies');
    refresh();
  }, [refresh]);

  const sortedMovies = useMemo(() => sortMovies(movies), [movies]);

  return {
    movies: sortedMovies,
    isLoading,
    error,
    isSubmitting,
    isDegraded: snapshot?.degraded ?? false,
    isSyncBlocked: snapshot?.blocked ?? false,
    syncWarning: snapshot?.warning,
    addMovie,
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
