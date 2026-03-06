/**
 * Updated useMovies hook using consolidated movieService
 * Maintains existing API while using improved architecture
 */

import { useCallback, useRef, useState } from 'react';
import { getMovies, saveMovies } from '../src/services/movieService.ts';
import { fetchMovieMetadata as fetchExternalMetadata } from '../src/services/metadataService.ts';
import { useGenericMutation } from './useGenericMutation.ts';
import type { Movie, User } from '../types.ts';

// Cache for metadata to avoid repeated fetches
const metadataCache = new Map<string, Partial<Movie>>();

const fetchMovieMetadata = async (movie: Partial<Movie>): Promise<Partial<Movie>> => {
  if (movie.id && metadataCache.has(movie.id)) {
    return metadataCache.get(movie.id)!;
  }

  try {
    const metadata = await fetchExternalMetadata(movie.title || '', 'movie', movie.id);
    if (movie.id) {
      metadataCache.set(movie.id, metadata);
    }
    return metadata;
  } catch (error) {
    console.warn(`Failed to fetch metadata for ${movie.id}:`, error);
    return movie;
  }
};

export const useMovies = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mutation = useGenericMutation<Movie[]>({
    fetchData: getMovies,
    saveData: saveMovies,
    onError: (err) => setError(err.message),
  });

  const loadMovies = useCallback(async () => {
    try {
      setError(null);
      await mutation.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load movies');
    }
  }, [mutation]);

  const addMovie = useCallback(
    async (baseMovie: Partial<Movie>) => {
      const movieWithMetadata = await fetchMovieMetadata(baseMovie);
      
      const newMovie: Movie = {
        id: movieWithMetadata.id || baseMovie.id || crypto.randomUUID(),
        title: movieWithMetadata.title || baseMovie.title || 'Unknown Title',
        addedBy: 'Aaron',
        watchedBy: [],
        createdAt: new Date().toISOString(),
        posterUrl: movieWithMetadata.posterUrl,
        year: movieWithMetadata.year,
        plot: movieWithMetadata.plot,
        imdbRating: movieWithMetadata.imdbRating,
        runtime: movieWithMetadata.runtime,
        genre: movieWithMetadata.genre,
        director: movieWithMetadata.director,
      };

      await mutation.performMutation((latestMovies) => {
        const updatedMovies = [...latestMovies, newMovie];
        return updatedMovies;
      });
    },
    []
  );

  const removeMovie = useCallback(
    async (id: string) => {
      await mutation.performMutation((latestMovies) => 
        latestMovies.filter((movie) => movie.id !== id)
      );
    },
    [mutation]
  );

  const updateMovie = useCallback(
    async (id: string, updates: Partial<Movie>) => {
      await mutation.performMutation((latestMovies) =>
        latestMovies.map((movie) =>
          movie.id === id ? { ...movie, ...updates } : movie
        )
      );
    },
    [mutation]
  );

  const clearMovies = useCallback(async () => {
    await mutation.performMutation(() => []);
  }, [mutation]);

  const refreshMovies = useCallback(() => {
    // Clear cache by forcing a fresh fetch
    return loadMovies();
  }, [loadMovies]);

  return {
    movies: mutation.data || [],
    isLoading: mutation.isLoading,
    error,
    isSubmitting: mutation.isSubmitting,
    addMovie,
    removeMovie,
    updateMovie,
    clearMovies,
    refreshMovies: mutation.refresh,
    loadMovies,
  };
};
