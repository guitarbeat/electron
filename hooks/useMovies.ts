import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Movie, User } from '../types';
import { usePolling } from './usePolling';
import { getMovies, saveMovies } from '../services/movieService';
import { fetchMovieMetadata, MetadataResult } from '../services/metadataService';
import { sanitizeInput, MAX_MOVIE_TITLE_LENGTH, isValidUrl } from '../config/security';

// Helper to control concurrency when processing array items
const concurrentMap = async <T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> => {
  const results = new Array(items.length);
  const iterator = items.entries();
  const worker = async () => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [index, item] of iterator) {
      // eslint-disable-next-line no-await-in-loop
      results[index] = await fn(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(items.length, concurrency) }, worker));
  return results;
};

// Helper to extract only safe metadata fields to prevent overwriting critical fields like id
export const extractSafeMetadata = (metadata: MetadataResult): Partial<Movie> => {
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

const getSortKey = (movie: Movie) =>
  `${movie.watchedBy.length === 2 ? '1' : '0'}:${movie.createdAt}`;

const sortMovies = (a: Movie, b: Movie) => {
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
        console.log('Gist is empty, seeding initial movies...');
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
      if (!window.confirm('Are you sure you want to delete this movie?')) return;
      await performMutation((latestMovies) => latestMovies.filter((movie) => movie.id !== movieId));
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
    async (movie: Movie, metadata: MetadataResult) => {
      try {
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
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const latestMovies = await getMovies();
      // Fetch metadata for all movies in parallel (with some concurrency limit)
      console.log('Refreshing all metadata...');

      const updatedMovies = await concurrentMap(latestMovies, 5, async (movie) => {
        try {
          // No artificial delay needed with concurrency limit
          const metadata = await fetchMovieMetadata(movie.title);
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

    console.log(
      `Auto-sync: Found ${moviesMissingMetadata.length} movies missing metadata. Starting background sync...`
    );
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
        console.log('Auto-sync: Successfully updated missing metadata.');
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

  // Refs for smart memoization
  const prevSortKeysRef = useRef<Map<string, string>>(new Map());
  const prevSortedIdsRef = useRef<string[]>([]);

  // Memoize sortedMovies to prevent unnecessary re-renders in consumers (like Watchlist)
  // when other states in Watchlist change (e.g. input field typing).
  // Optimization: Only re-sort if sort-relevant fields (watchedBy, createdAt) change.
  const sortedMovies = useMemo(() => {
    if (!movies) return [];

    let canReuseOrder = false;
    const currentMap = new Map<string, Movie>();

    // Check if we can reuse the previous sort order
    if (movies.length === prevSortedIdsRef.current.length) {
      canReuseOrder = true;
      // eslint-disable-next-line no-restricted-syntax
      for (const m of movies) {
        const key = getSortKey(m);
        // If key mismatch or ID mismatch (new ID not in prev keys), fallback to sort
        if (prevSortKeysRef.current.get(m.id) !== key) {
          canReuseOrder = false;
          break;
        }
        currentMap.set(m.id, m);
      }
    }

    if (canReuseOrder) {
      // Reconstruct list using previous order
      // Using map.get(id)! is safe because we verified length and key presence
      // (Wait, key presence check ensures ID exists in prevSortKeys, but prevSortedIds might differ?)
      // prevSortedIds contains ALL IDs from prevSortKeys.
      // So if currentMap contains ALL IDs (which it should if length matches and keys match), we are good.
      // However, duplicate IDs or missing IDs would break this.
      // Given we iterate all movies and check keys, if length matches, sets must be identical.

      const reused = new Array(prevSortedIdsRef.current.length);
      let isValid = true;
      for (let i = 0; i < prevSortedIdsRef.current.length; i++) {
        const movie = currentMap.get(prevSortedIdsRef.current[i]);
        if (!movie) {
          isValid = false;
          break;
        }
        reused[i] = movie;
      }

      if (isValid) {
        return reused;
      }
    }

    // Fallback to full sort
    const sorted = [...movies].sort(sortMovies);

    // Update refs
    const newKeys = new Map<string, string>();
    const newIds = new Array(sorted.length);
    for (let i = 0; i < sorted.length; i++) {
      const m = sorted[i];
      newKeys.set(m.id, getSortKey(m));
      newIds[i] = m.id;
    }
    prevSortKeysRef.current = newKeys;
    prevSortedIdsRef.current = newIds;

    return sorted;
  }, [movies]);

  return {
    movies: sortedMovies,
    isLoading,
    error,
    isSubmitting,
    addMovie,
    toggleWatched,
    deleteMovie,
    refresh,
    updateMovieMetadata,
    manualMetadataUpdate,
    refreshAllMetadata,
  };
};
