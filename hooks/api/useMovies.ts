import { useCallback, useRef, useState } from 'react';
import type { User } from '../types.ts';
import { getMovies, saveMovies } from '../services/api/movieService.ts';
import { fetchMovieMetadata } from '../services/metadataService.ts';
import { performMutation } from './useGenericMutation.ts';
import type { Movie } from '../types.ts';

export const useMovies = (currentUser: User | null) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutationLockRef = useRef<Promise<any> | null>(null);

  const loadMovies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedMovies = await getMovies();
      setMovies(fetchedMovies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load movies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMovie = useCallback(async (movieId: string) => {
    if (!currentUser) return;

    // Fetch metadata first
    const metadata = await fetchMovieMetadata(movieId);
    
    // Create base movie object
    const baseMovie = {
      id: movieId,
      title: metadata.title,
      year: metadata.year,
      poster: metadata.poster,
      addedBy: currentUser,
      addedAt: new Date().toISOString(),
    };

    // Combine with metadata safely
    const newMovie = {
      ...baseMovie,
      ...metadata,
    };

    await performMutation(
      async () => {
        const latestMovies = await getMovies();
        return [...latestMovies, newMovie];
      },
      async (updatedMovies) => {
        await saveMovies(updatedMovies);
        setMovies(updatedMovies);
      },
      mutationLockRef
    );
  }, [currentUser]);

  const removeMovie = useCallback(async (movieId: string) => {
    if (!currentUser) return;

    await performMutation(
      async () => {
        const latestMovies = await getMovies();
        return latestMovies.filter(movie => movie.id !== movieId);
      },
      async (updatedMovies) => {
        await saveMovies(updatedMovies);
        setMovies(updatedMovies);
      },
      mutationLockRef
    );
  }, [currentUser]);

  const updateMovie = useCallback(async (movieId: string, updates: Partial<Movie>) => {
    if (!currentUser) return;

    await performMutation(
      async () => {
        const latestMovies = await getMovies();
        return latestMovies.map(movie => 
          movie.id === movieId ? { ...movie, ...updates } : movie
        );
      },
      async (updatedMovies) => {
        await saveMovies(updatedMovies);
        setMovies(updatedMovies);
      },
      mutationLockRef
    );
  }, [currentUser]);

  return {
    movies,
    isLoading,
    error,
    loadMovies,
    addMovie,
    removeMovie,
    updateMovie,
  };
};
