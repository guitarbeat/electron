import { useCallback, useState } from 'react';
import type { Movie } from '../types';

export const useMovies = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMovies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // TODO: Implement actual movie loading from service
      const fetchedMovies: Movie[] = [];
      setMovies(fetchedMovies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load movies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMovie = useCallback(
    async (movieData: Omit<Movie, 'id' | 'createdAt'>) => {
      const newMovie: Movie = {
        ...movieData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setMovies(prev => [...prev, newMovie]);
    },
    []
  );

  const removeMovie = useCallback(
    async (id: string) => {
      setMovies(prev => prev.filter(movie => movie.id !== id));
    },
    []
  );

  const updateMovie = useCallback(
    async (id: string, updates: Partial<Movie>) => {
      setMovies(prev => 
        prev.map(movie => 
          movie.id === id ? { ...movie, ...updates } : movie
        )
      );
    },
    []
  );

  const clearMovies = useCallback(async () => {
    setMovies([]);
  }, []);

  return {
    movies,
    isLoading,
    error,
    addMovie,
    removeMovie,
    updateMovie,
    clearMovies,
    loadMovies,
  };
};
