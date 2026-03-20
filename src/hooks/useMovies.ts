import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Movie, User } from '@/types';
import { usePolling } from '@/services/polling';
import {
  canWriteGist,
  GIST_FILENAME,
  hasLocalOverride,
  patchGistFile,
  readStoredJson,
  readGistJsonFile,
  saveGistJson,
  setLocalOverride,
  writeStoredJson,
} from '@/services/gistClient.ts';
import { fetchMovieMetadata, MetadataResult } from '@/services/metadataService';
import { cloneMovies, isMovieRecord, normalizeMovies } from '@/services/movieRecords.ts';
import {
  areDeeplyEqual,
  concurrentMap,
  isValidUrl,
  MAX_MOVIE_TITLE_LENGTH,
  parseJsonContent,
  sanitizeInput,
} from '@/utils';


const MOVIES_LOCAL_STORAGE_KEY = 'movieList.localMovies';

const readStoredLocalMovies = (): Movie[] | null =>
  readStoredJson({
    storageKey: MOVIES_LOCAL_STORAGE_KEY,
    validate: (value): value is Movie[] => Array.isArray(value) && value.every(isMovieRecord),
    clone: cloneMovies,
    label: 'local movie fallback',
  });

const getFallbackMovies = (): Movie[] => readStoredLocalMovies() ?? [];

const saveLocalMovies = (movies: Movie[]): void => {
  writeStoredJson({
    storageKey: MOVIES_LOCAL_STORAGE_KEY,
    value: movies,
    clone: cloneMovies,
    label: 'local movie fallback',
  });
  setLocalOverride('movies', true);
};

const getMovies = async (): Promise<Movie[]> => {
  try {
    const movies = await readGistJsonFile({
      scope: 'movies',
      filename: GIST_FILENAME,
      fallback: getFallbackMovies,
      onMissingFileWhenWritable: () => [],
      parse: (content) => {
        const parsedMovies = parseJsonContent(content, GIST_FILENAME);
        if (!Array.isArray(parsedMovies)) {
          throw new Error(`${GIST_FILENAME} must be a JSON array of movie objects.`);
        }

        const normalized = normalizeMovies(parsedMovies);
        if (normalized.length !== parsedMovies.length) {
          console.warn(
            `Filtered ${parsedMovies.length - normalized.length} invalid movie record(s) from ${GIST_FILENAME}.`
          );
        }

        if (parsedMovies.length > 0 && normalized.length === 0) {
          console.warn(
            `No valid movie records found in ${GIST_FILENAME}, using local movie fallback.`
          );
          return getFallbackMovies();
        }

        return normalized;
      },
      fetchOptions: {
        cache: 'no-cache',
      },
    });

    // Best-effort ETag tracking for polling efficiency.
    // When the helper falls back, we clear ETag so the next fetch isn't pinned to a stale value.
    return movies;
  } catch (error) {
    console.error('Error fetching movies from Gist:', error);
    return getFallbackMovies();
  }
};

const getRemoteMoviesFromGist = async (): Promise<Movie[] | null> => {
  try {
    return await readGistJsonFile({
      scope: 'movies',
      filename: GIST_FILENAME,
      fallback: () => null,
      onMissingFileWhenWritable: () => [],
      parse: (content) => {
        const parsedMovies = parseJsonContent(content, GIST_FILENAME);
        if (!Array.isArray(parsedMovies)) return null;
        return normalizeMovies(parsedMovies);
      },
      skipLocalOverride: true,
    });
  } catch {
    return null;
  }
};

const saveMovies = (movies: Movie[]): Promise<void> =>
  saveGistJson(GIST_FILENAME, 'movies', movies, saveLocalMovies);

// Helper to extract only safe metadata fields to prevent overwriting critical fields like id
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

export const useMovies = (currentUser: User | null, isPaused: boolean = false) => {
  const {
    data: movies,
    error,
    isLoading,
    refresh,
  } = usePolling(getMovies, 10000, areDeeplyEqual, {
    key: 'movies',
    isPaused,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const mutationLockRef = useRef<Promise<void> | null>(null);
  const hasAutoSyncedRef = useRef(false);
  const movieRecoverySyncInFlightRef = useRef(false);
  const [movieRecoveryRetryToken, setMovieRecoveryRetryToken] = useState(0);

  useEffect(() => {
    if (!canWriteGist || isSubmitting || !hasLocalOverride('movies')) {
      return;
    }

    if (movieRecoverySyncInFlightRef.current) {
      return;
    }

    let cancelled = false;
    let retryTimeoutId: number | null = null;

    const clearRetryTimeout = () => {
      if (retryTimeoutId !== null) {
        window.clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
      }
    };

    const scheduleRetry = () => {
      if (cancelled || retryTimeoutId !== null) {
        return;
      }

      retryTimeoutId = window.setTimeout(() => {
        retryTimeoutId = null;
        setMovieRecoveryRetryToken((value) => value + 1);
      }, 15000);
    };

    const maybeSyncLocalOverride = async () => {
      movieRecoverySyncInFlightRef.current = true;

      try {
        const localMovies = readStoredLocalMovies();
        if (localMovies === null) {
          scheduleRetry();
          return;
        }

        const gistMovies = await getRemoteMoviesFromGist();
        if (cancelled) return;
        if (gistMovies === null) {
          scheduleRetry();
          return;
        }

        if (areDeeplyEqual(gistMovies, localMovies)) {
          setLocalOverride('movies', false);
          clearRetryTimeout();
          refresh();
          return;
        }

        const response = await patchGistFile(GIST_FILENAME, JSON.stringify(localMovies, null, 2));
        if (cancelled) return;
        if (!response.ok) {
          scheduleRetry();
          return;
        }

        setLocalOverride('movies', false);
        clearRetryTimeout();
        refresh();
      } catch (error) {
        if (!cancelled) {
          scheduleRetry();
        }
        console.warn('Failed to sync local movies back to Gist:', error);
      } finally {
        movieRecoverySyncInFlightRef.current = false;
      }
    };

    void maybeSyncLocalOverride();

    return () => {
      cancelled = true;
      clearRetryTimeout();
    };
  }, [isSubmitting, movieRecoveryRetryToken, refresh]);

  // Effect to seed the initial movies if the Gist is empty
  useEffect(() => {
    const seedMovies = async () => {
      const hasBeenSeeded = localStorage.getItem('movieListSeeded_gist_refactored');
      if (!isLoading && movies && movies.length === 0 && hasBeenSeeded !== 'true') {
        // Gist is not empty, skip seeding
        localStorage.setItem('movieListSeeded_gist_refactored', 'true');
      }
    };
    seedMovies();
  }, [movies, isLoading, refresh]);

  const performMutation = useCallback(
    async (mutationFn: (latestMovies: Movie[]) => Movie[]) => {
      if (!currentUser) {
        console.warn('Mutation attempted without user');
        return undefined;
      }
      // Chain mutations to prevent race conditions
      const mutation = (async () => {
        try {
          await mutationLockRef.current;
        } catch {
          // Ignore previous mutation errors so the next mutation can proceed.
        }

        setIsSubmitting(true);
        isSubmittingRef.current = true;
        try {
          const latestMovies = await getMovies();
          const updatedMovies = mutationFn(latestMovies);
          await saveMovies(updatedMovies);
          refresh();
        } catch (err) {
          console.error('Mutation failed:', err);
          throw err;
        } finally {
          setIsSubmitting(false);
          isSubmittingRef.current = false;
        }
      })();

      mutationLockRef.current = mutation;
      return mutation;
    },
    [currentUser, refresh]
  );

  const addMovie = useCallback(
    async (title: string) => {
      const cleanTitle = sanitizeInput(title);

      if (!cleanTitle) {
        throw new Error('Movie title cannot be empty');
      }

      if (cleanTitle.length > MAX_MOVIE_TITLE_LENGTH) {
        throw new Error(
          `Movie title exceeds maximum length of ${MAX_MOVIE_TITLE_LENGTH} characters`
        );
      }

      // 1. Create the basic movie object
      const baseMovie: Movie = {
        id: crypto.randomUUID(),
        title: cleanTitle,
        addedBy: currentUser!,
        watchedBy: [],
        createdAt: new Date().toISOString(),
      };

      // 2. Fetch metadata (this might take a second, so we do it before locking the mutation if possible,
      //    but here we do it inside performMutation logic effectively by prepping it first)
      //    However, to keep UI responsive, we'll do it here.
      let metadata: MetadataResult = {};
      try {
        metadata = await fetchMovieMetadata(title.trim());
      } catch (err) {
        console.error('Failed to fetch metadata, continuing without it:', err);
      }

      const newMovie = { ...baseMovie, ...extractSafeMetadata(metadata) };

      await performMutation((latestMovies) => [...latestMovies, newMovie]);
    },
    [currentUser, performMutation]
  );

  const toggleWatched = useCallback(
    async (movieId: string) => {
      await performMutation((latestMovies) =>
        latestMovies.map((movie) => {
          if (movie.id === movieId) {
            const isWatched = movie.watchedBy.includes(currentUser!);
            const newWatchedBy = isWatched
              ? movie.watchedBy.filter((user) => user !== currentUser)
              : [...movie.watchedBy, currentUser!];
            return { ...movie, watchedBy: newWatchedBy };
          }
          return movie;
        })
      );
    },
    [currentUser, performMutation]
  );

  const deleteMovie = useCallback(
    async (movieId: string) => {
      await performMutation((latestMovies) => latestMovies.filter((movie) => movie.id !== movieId));
    },
    [performMutation]
  );

  const restoreMovie = useCallback(
    async (movie: Movie) => {
      await performMutation((latestMovies) => [...latestMovies, movie]);
    },
    [performMutation]
  );

  const updateMovieMetadata = useCallback(
    async (movie: Movie, searchTerm?: string) => {
      try {
        const metadata = await fetchMovieMetadata(searchTerm || movie.title);
        const safeMetadata = extractSafeMetadata(metadata);
        if (Object.keys(safeMetadata).length > 0) {
          await performMutation((latestMovies) =>
            latestMovies.map((m) => (m.id === movie.id ? { ...m, ...safeMetadata } : m))
          );
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to manual update metadata:', err);
        return false;
      }
    },
    [performMutation]
  );

  const manualMetadataUpdate = useCallback(
    async (movieId: string, searchTerm?: string) => {
      try {
        const latestMovies = await getMovies();
        const movie = latestMovies.find((entry) => entry.id === movieId);
        if (!movie) {
          return false;
        }

        const metadata = await fetchMovieMetadata(searchTerm || movie.title);
        const safeMetadata = extractSafeMetadata(metadata);
        if (Object.keys(safeMetadata).length === 0) {
          return false;
        }
        await performMutation((latestMovies) =>
          latestMovies.map((m) => (m.id === movie.id ? { ...m, ...safeMetadata } : m))
        );
        return true;
      } catch (err) {
        console.error('Failed to manual metadata update:', err);
        return false;
      }
    },
    [performMutation]
  );

  const refreshAllMetadata = useCallback(async () => {
    if (isSubmittingRef.current) return false;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const latestMovies = await getMovies();
      // Fetch metadata for all movies in parallel (with some concurrency limit)

      const updatedMovies = await concurrentMap(latestMovies, 20, async (movie) => {
        try {
          // Each record is refreshed independently so duplicate titles do not share lookup results.
          const metadata = await fetchMovieMetadata(movie.title);
          const safeMetadata = extractSafeMetadata(metadata);
          if (Object.keys(safeMetadata).length > 0) {
            return { ...movie, ...safeMetadata };
          }
          return movie;
        } catch (e) {
          console.error(`Failed to refresh metadata for ${movie.title}`, e);
          return movie;
        }
      });

      await saveMovies(updatedMovies);
      refresh();
      return true;
    } catch (err) {
      console.error('Failed to refresh all metadata:', err);
      throw err;
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [refresh]);

  const autoSyncMetadata = useCallback(async () => {
    if (hasAutoSyncedRef.current || !movies || movies.length === 0 || isSubmittingRef.current)
      return;

    const moviesMissingMetadata = movies.filter((m) => !m.posterUrl || !m.plot || !m.year);
    if (moviesMissingMetadata.length === 0) {
      hasAutoSyncedRef.current = true;
      return;
    }

    hasAutoSyncedRef.current = true;

    try {
      // Small delay before starting to not interfere with initial load
      await new Promise((r) => {
        setTimeout(r, 2000);
      });

      let syncOccurred = false;
      const updatedMovies = await concurrentMap(movies, 3, async (movie) => {
        const needsSync = !movie.posterUrl || !movie.plot || !movie.year;
        if (needsSync) {
          try {
            // No random delay needed with concurrency limit
            const metadata = await fetchMovieMetadata(movie.title);
            const safeMetadata = extractSafeMetadata(metadata);
            if (Object.keys(safeMetadata).length > 0) {
              syncOccurred = true;
              return { ...movie, ...safeMetadata };
            }
          } catch (e) {
            console.warn(`Auto-sync failed for ${movie.title}:`, e);
          }
        }
        return movie;
      });

      if (syncOccurred) {
        await saveMovies(updatedMovies);
        refresh();
      }
    } catch (err) {
      console.error('Auto-sync: Failed background metadata update:', err);
    }
  }, [movies, refresh]);

  // Trigger auto-sync once movies are loaded
  useEffect(() => {
    if (!isLoading && movies && movies.length > 0 && !hasAutoSyncedRef.current) {
      autoSyncMetadata();
    }
  }, [isLoading, movies, autoSyncMetadata]);

  // Memoize sortedMovies to prevent unnecessary re-renders in consumers (like Watchlist)
  // when other states in Watchlist change (e.g. input field typing)
  const sortedMovies = useMemo(
    () =>
      movies
        ? [...movies].sort((a, b) => {
            const aWatchedByBoth = a.watchedBy.length === 2;
            const bWatchedByBoth = b.watchedBy.length === 2;

            if (aWatchedByBoth && !bWatchedByBoth) {
              return 1; // a (watched) comes after b (unwatched)
            }
            if (!aWatchedByBoth && bWatchedByBoth) {
              return -1; // a (unwatched) comes before b (watched)
            }

            // For movies in the same group (both watched or both unwatched), sort by creation date
            if (b.createdAt > a.createdAt) return 1;
            if (b.createdAt < a.createdAt) return -1;
            return 0;
          })
        : [],
    [movies]
  );

  return {
    movies: sortedMovies,
    isLoading,
    error,
    isSubmitting,
    addMovie,
    toggleWatched,
    deleteMovie,
    restoreMovie,
    refresh,
    updateMovieMetadata,
    manualMetadataUpdate,
    refreshAllMetadata,
  };
};
