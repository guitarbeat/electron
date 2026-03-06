import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Movie, User } from '../../../types';
import { usePolling } from '../../../hooks/usePolling';
import { getMovies, saveMovies } from '../../../services/movieService';
import { fetchMovieMetadata, MetadataResult } from '../../../services/metadataService';
import { sanitizeInput, MAX_MOVIE_TITLE_LENGTH, isValidUrl } from '../../../config/security';
import { concurrentMap } from '../../../utils/concurrency';

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
          { title: 'Kung Fu Panda', addedBy: 'Aaron', watchedBy: [], category: 'Movies' },
          { title: 'Free Guy', addedBy: 'Aaron', watchedBy: [], category: 'Movies' },
          { title: 'The Super Mario Bros. Movie', addedBy: 'Aaron', watchedBy: [], category: 'Movies' },
        ];

        try {
          await saveMovies(defaultMovies as Movie[]);
          localStorage.setItem('movieListSeeded_gist_refactored', 'true');
          await refresh();
        } catch (error) {
          console.error('Failed to seed initial movies:', error);
        }
      }
    };

    seedMovies();
  }, [isLoading, movies, refresh]);

  const performMutation = useCallback(
    async (mutationFn: () => Promise<Movie[]>) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
        // Ensure only one mutation runs at a time
        if (mutationLockRef.current) {
          await mutationLockRef.current;
        }

        const mutationPromise = mutationFn();
        mutationLockRef.current = mutationPromise;

        const result = await mutationPromise;
        return result;
      } catch (error) {
        console.error('Mutation failed:', error);
        throw error;
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        mutationLockRef.current = null;
      }
    },
    []
  );

  const addMovie = useCallback(
    async (title: string, user: User | null) => {
      if (!title.trim()) {
        throw new Error('Movie title cannot be empty');
      }

      if (title.length > MAX_MOVIE_TITLE_LENGTH) {
        throw new Error(`Movie title cannot exceed ${MAX_MOVIE_TITLE_LENGTH} characters`);
      }

      const sanitizedTitle = sanitizeInput(title.trim());
      const addedBy = user?.name || 'Anonymous';

      return performMutation(async () => {
        // Create base movie object
        const baseMovie: Omit<Movie, 'posterUrl' | 'year' | 'plot' | 'imdbRating' | 'runtime' | 'genre' | 'director'> = {
          id: crypto.randomUUID(),
          title: sanitizedTitle,
          addedBy,
          watchedBy: [],
          category: 'Movies',
          createdAt: new Date().toISOString(),
        };

        // Fetch metadata
        try {
          const metadata = await fetchMovieMetadata(sanitizedTitle);
          const safeMetadata = extractSafeMetadata(metadata);
          const movie = { ...baseMovie, ...safeMetadata };
          
          const updatedMovies = [...(movies || []), movie];
          await saveMovies(updatedMovies);
          await refresh();
          return updatedMovies;
        } catch (metadataError) {
          console.warn('Failed to fetch metadata, using base movie:', metadataError);
          
          // Still save the movie even if metadata fetch fails
          const movie = baseMovie as Movie;
          const updatedMovies = [...(movies || []), movie];
          await saveMovies(updatedMovies);
          await refresh();
          return updatedMovies;
        }
      });
    },
    [movies, refresh, performMutation]
  );

  const toggleWatched = useCallback(
    async (movieId: string, user: User | null) => {
      const userName = user?.name || 'Anonymous';
      
      return performMutation(async () => {
        const updatedMovies = (movies || []).map((movie) => {
          if (movie.id === movieId) {
            const watchedBy = movie.watchedBy.includes(userName)
              ? movie.watchedBy.filter((name) => name !== userName)
              : [...movie.watchedBy, userName];
            
            return { ...movie, watchedBy };
          }
          return movie;
        });

        await saveMovies(updatedMovies);
        await refresh();
        return updatedMovies;
      });
    },
    [movies, refresh, performMutation]
  );

  const deleteMovie = useCallback(
    async (movieId: string) => {
      return performMutation(async () => {
        const updatedMovies = (movies || []).filter((movie) => movie.id !== movieId);
        await saveMovies(updatedMovies);
        await refresh();
        return updatedMovies;
      });
    },
    [movies, refresh, performMutation]
  );

  const restoreMovie = useCallback(
    async (movie: Movie) => {
      return performMutation(async () => {
        const updatedMovies = [...(movies || []), movie];
        await saveMovies(updatedMovies);
        await refresh();
        return updatedMovies;
      });
    },
    [movies, refresh, performMutation]
  );

  const manualMetadataUpdate = useCallback(
    async (movieId: string, metadata: Partial<Movie>) => {
      return performMutation(async () => {
        const updatedMovies = (movies || []).map((movie) => {
          if (movie.id === movieId) {
            const safeMetadata = extractSafeMetadata(metadata as MetadataResult);
            return { ...movie, ...safeMetadata };
          }
          return movie;
        });

        await saveMovies(updatedMovies);
        await refresh();
        return updatedMovies;
      });
    },
    [movies, refresh, performMutation]
  );

  return {
    movies,
    isLoading,
    isSubmitting,
    error,
    refresh,
    addMovie,
    toggleWatched,
    deleteMovie,
    restoreMovie,
    manualMetadataUpdate,
  };
};
