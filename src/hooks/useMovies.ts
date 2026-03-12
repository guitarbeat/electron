import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Movie, User } from '@/types';
import { usePolling } from '@/hooks/usePolling';
import {
  canReadGist,
  canWriteGist,
  fetchGist,
  GIST_FILENAME,
  getGistFileContent,
  patchGistFile,
  readLocalOverride,
  readStoredJson,
  setLocalOverride,
  writeStoredJson,
} from '@/services/gistClient.ts';
import { fetchMovieMetadata, MetadataResult } from '@/services/metadataService';
import { cloneMovies, isMovieRecord, normalizeMovies } from '@/services/movieRecords.ts';
import { sanitizeInput, MAX_MOVIE_TITLE_LENGTH, isValidUrl, concurrentMap } from '@/utils';
import { MOCK_MOVIES } from '@/services/mockData';

let cachedMovies: Movie[] = [];
let lastETag: string | null = null;
const MOVIES_LOCAL_STORAGE_KEY = 'movieList.localMovies';

const readStoredLocalMovies = (): Movie[] | null =>
  readStoredJson({
    storageKey: MOVIES_LOCAL_STORAGE_KEY,
    validate: (value): value is Movie[] => Array.isArray(value) && value.every(isMovieRecord),
    clone: cloneMovies,
    label: 'local movie fallback',
  });

const getFallbackMovies = (): Movie[] => readStoredLocalMovies() ?? cloneMovies(MOCK_MOVIES);

const saveLocalMovies = (movies: Movie[]): void => {
  const nextMovies = writeStoredJson({
    storageKey: MOVIES_LOCAL_STORAGE_KEY,
    value: movies,
    clone: cloneMovies,
    label: 'local movie fallback',
  });
  cachedMovies = nextMovies;
  lastETag = null;
  setLocalOverride('movies', true);
};

const getMovies = async (): Promise<Movie[]> => {
  if (!canReadGist) {
    return getFallbackMovies();
  }

  const localOverride = readLocalOverride('movies', readStoredLocalMovies);
  if (localOverride.enabled && localOverride.value) {
    return localOverride.value;
  }

  try {
    const response = await fetchGist({
      eTag: lastETag,
      cache: 'no-cache',
    });

    if (response.status === 304) {
      if (cachedMovies.length > 0) {
        return cachedMovies;
      }
    }

    if (!response.ok) {
      console.warn(`Failed to fetch from Gist (${response.status}), using local movie fallback.`);
      return getFallbackMovies();
    }

    const gist = await response.json();
    const content = getGistFileContent(gist, GIST_FILENAME);
    if (content === null) {
      if (!canWriteGist) {
        console.warn(`Gist is missing "${GIST_FILENAME}". Using local movie fallback instead.`);
        return getFallbackMovies();
      }
      console.warn(`Gist is missing "${GIST_FILENAME}". Returning an empty movie list.`);
      return [];
    }

    let parsedMovies: unknown;
    try {
      parsedMovies = JSON.parse(content);
    } catch {
      throw new Error(`${GIST_FILENAME} contains invalid JSON.`);
    }
    if (!Array.isArray(parsedMovies)) {
      throw new Error(`${GIST_FILENAME} must be a JSON array of movie objects.`);
    }

    const movies = normalizeMovies(parsedMovies);
    if (movies.length !== parsedMovies.length) {
      console.warn(
        `Filtered ${parsedMovies.length - movies.length} invalid movie record(s) from ${GIST_FILENAME}.`
      );
    }

    if (parsedMovies.length > 0 && movies.length === 0) {
      console.warn(`No valid movie records found in ${GIST_FILENAME}, using local movie fallback.`);
      return getFallbackMovies();
    }

    const etag = response.headers.get('etag') || response.headers.get('ETag');
    if (etag) {
      cachedMovies = movies;
      lastETag = etag;
    } else {
      cachedMovies = movies;
      lastETag = null;
    }

    return movies;
  } catch (error) {
    console.error('Error fetching movies from Gist:', error);
    return getFallbackMovies();
  }
};

const saveMovies = async (movies: Movie[]): Promise<void> => {
  if (!canWriteGist) {
    saveLocalMovies(movies);
    return;
  }

  try {
    const response = await patchGistFile(GIST_FILENAME, JSON.stringify(movies, null, 2));

    if (!response.ok) {
      console.warn(`Failed to save movies to Gist (${response.status}), using local fallback.`);
      saveLocalMovies(movies);
      return;
    }

    cachedMovies = movies;
    lastETag = null;
    setLocalOverride('movies', false);
  } catch (error) {
    console.warn('Error saving movies to Gist, using local fallback:', error);
    saveLocalMovies(movies);
  }
};

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
  } = usePolling(getMovies, 10000, (prev, next) => JSON.stringify(prev) === JSON.stringify(next), {
    key: 'movies',
    isPaused,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const mutationLockRef = useRef<Promise<void> | null>(null);
  const hasAutoSyncedRef = useRef(false);

  // Effect to seed the initial movies if the Gist is empty
  useEffect(() => {
    const seedMovies = async () => {
      const hasBeenSeeded = localStorage.getItem('movieListSeeded_gist_refactored');
      if (!isLoading && movies && movies.length === 0 && hasBeenSeeded !== 'true') {
        const defaultMovies: Omit<Movie, 'id' | 'createdAt'>[] = [
          { title: 'The Last Unicorn', addedBy: 'Aaron', watchedBy: [], category: 'Movies' },
          { title: 'Renfield', addedBy: 'Aaron', watchedBy: [], category: 'Movies' },
          { title: 'Sinister', addedBy: 'Aaron', watchedBy: [], category: 'Movies' },
          { title: 'Creep', addedBy: 'Aaron', watchedBy: [], category: 'Movies' },
          { title: 'Easy A', addedBy: 'Aaron', watchedBy: [], category: 'Movies' },
          { title: 'The Lego Movie', addedBy: 'Aaron', watchedBy: [], category: 'Movies' },
          { title: 'Key and Peele', addedBy: 'Aaron', watchedBy: [], category: 'Humor' },
          { title: 'Beetlejuice', addedBy: 'Aaron', watchedBy: [], category: 'Movies' },
        ];

        const moviesToSave: Movie[] = defaultMovies.map((movie) => ({
          ...movie,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }));

        try {
          isSubmittingRef.current = true;
          setIsSubmitting(true);
          await saveMovies(moviesToSave);
          localStorage.setItem('movieListSeeded_gist_refactored', 'true');
          refresh();
        } catch (err) {
          console.error('Failed to seed movies:', err);
        } finally {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }
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
        } catch (e) {
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
        // Only update if we actually found something useful
        if (metadata.posterUrl || metadata.plot || metadata.year) {
          await performMutation((latestMovies) =>
            latestMovies.map((m) =>
              m.id === movie.id ? { ...m, ...extractSafeMetadata(metadata) } : m
            )
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
        await performMutation((latestMovies) =>
          latestMovies.map((m) =>
            m.id === movie.id ? { ...m, ...extractSafeMetadata(metadata) } : m
          )
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

      // Deduplicate concurrent requests
      const titlePromises = new Map<string, Promise<MetadataResult>>();
      const getMetadata = (t: string) => {
        if (!titlePromises.has(t)) titlePromises.set(t, fetchMovieMetadata(t));
        return titlePromises.get(t)!;
      };

      const updatedMovies = await concurrentMap(latestMovies, 20, async (movie) => {
        try {
          // No artificial delay needed with concurrency limit
          const metadata = await getMetadata(movie.title);
          // Merge mostly to keep existing IDs/User data, but overwrite metadata
          // Only overwrite if we got data back
          if (metadata.posterUrl) {
            return { ...movie, ...extractSafeMetadata(metadata) };
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
            if (metadata.posterUrl || metadata.plot || metadata.year) {
              syncOccurred = true;
              return { ...movie, ...extractSafeMetadata(metadata) };
            }
          } catch (e) {
            console.warn(`Auto-sync failed for ${movie.title}:`, e);
          }
        }
        return movie;
      });

      if (syncOccurred) {
        await performMutation(() => updatedMovies);
      }
    } catch (err) {
      console.error('Auto-sync: Failed background metadata update:', err);
    }
  }, [movies, performMutation]);

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
