import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Movie, User } from '../types';
import { usePolling } from './usePolling';
import { movieService } from '../services/api/gistService';
import { fetchMovieMetadata, MetadataResult } from '../services/external/metadataService';
import { sanitizeInput, MAX_MOVIE_TITLE_LENGTH, isValidUrl } from '../config/security';
import { concurrentMap } from '../utils/concurrency';
import { MutationHelper } from '../services/shared/mutationHelpers';

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
  } = usePolling(movieService.getMovies, 10000, (prev, next) => JSON.stringify(prev) === JSON.stringify(next), {
    key: 'movies',
    isPaused,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAutoSyncedRef = useRef(false);

  const mutationHelper = new MutationHelper({
    fetchFn: movieService.getMovies,
    saveFn: movieService.saveMovies,
    refreshFn: refresh,
  });

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
        ];

        try {
          setIsSubmitting(true);
          await movieService.saveMovies(defaultMovies.map((m, i) => ({
            ...m,
            id: `seed-${i + 1}`,
            createdAt: new Date().toISOString(),
          })));
          localStorage.setItem('movieListSeeded_gist_refactored', 'true');
          refresh();
        } catch (err) {
          console.error('Failed to seed movies:', err);
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    seedMovies();
  }, [isLoading, movies, refresh, mutationHelper]);

  const addMovie = useCallback(
    async (title: string) => {
      if (!currentUser || !title.trim()) return;

      const trimmedTitle = sanitizeInput(title.trim());
      if (trimmedTitle.length > MAX_MOVIE_TITLE_LENGTH) {
        throw new Error(`Movie title must be ${MAX_MOVIE_TITLE_LENGTH} characters or less`);
      }

      setIsSubmitting(true);
      try {
        // Fetch metadata first
        const metadata = await fetchMovieMetadata(trimmedTitle);
        
        await mutationHelper.performMutation(currentUser, (latestMovies) => {
          // Check for duplicates
          const existingMovie = latestMovies.find(m => 
            m.title.toLowerCase() === trimmedTitle.toLowerCase()
          );
          
          if (existingMovie) {
            throw new Error('This movie is already in your list');
          }

          const baseMovie: Movie = {
            id: `movie-${Date.now()}`,
            title: trimmedTitle,
            addedBy: currentUser,
            watchedBy: [],
            category: 'Movies',
            createdAt: new Date().toISOString(),
          };

          // Combine base movie with metadata
          const movieWithMetadata = {
            ...baseMovie,
            ...extractSafeMetadata(metadata),
          };

          return [...latestMovies, movieWithMetadata];
        });
      } catch (err) {
        console.error('Failed to add movie:', err);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, mutationHelper]
  );

  const updateMovie = useCallback(
    async (movieId: string, updates: Partial<Movie>) => {
      if (!currentUser) return;

      setIsSubmitting(true);
      try {
        await mutationHelper.performMutation(currentUser, (latestMovies) => {
          return latestMovies.map(movie =>
            movie.id === movieId ? { ...movie, ...updates } : movie
          );
        });
      } catch (err) {
        console.error('Failed to update movie:', err);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, mutationHelper]
  );

  const deleteMovie = useCallback(
    async (movieId: string) => {
      if (!currentUser) return;

      setIsSubmitting(true);
      try {
        await mutationHelper.performMutation(currentUser, (latestMovies) => {
          return latestMovies.filter(movie => movie.id !== movieId);
        });
      } catch (err) {
        console.error('Failed to delete movie:', err);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, mutationHelper]
  );

  const toggleWatched = useCallback(
    async (movieId: string) => {
      if (!currentUser) return;

      await updateMovie(movieId, {
        watchedBy: movies?.find(m => m.id === movieId)?.watchedBy?.includes(currentUser)
          ? movies?.find(m => m.id === movieId)?.watchedBy?.filter(u => u !== currentUser) || []
          : [...(movies?.find(m => m.id === movieId)?.watchedBy || []), currentUser]
      });
    },
    [currentUser, updateMovie, movies]
  );

  return {
    movies,
    isLoading,
    isSubmitting,
    error,
    addMovie,
    updateMovie,
    deleteMovie,
    toggleWatched,
    refresh,
  };
};
