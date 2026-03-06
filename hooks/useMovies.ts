/**
 * Updated useMovies hook using consolidated movieService
 * Maintains existing API while using improved architecture
 */

import { useCallback, useRef, useState } from 'react';
import { getMovies, saveMovies } from '../services/features/movies/movieService.ts';
import { metadataService } from '../services/metadataService.ts';
import { performMutation } from '../utils/concurrency.ts';
import type { Movie } from '../types.ts';

// Cache for metadata to avoid repeated fetches
const metadataCache = new Map<string, Partial<Movie>>();

const fetchMovieMetadata = async (movie: Partial<Movie>): Promise<Partial<Movie>> => {
  if (metadataCache.has(movie.imdbID)) {
    return metadataCache.get(movie.imdbID)!;
  }

  try {
    const metadata = await metadataService.getMetadata(movie.imdbID);
    metadataCache.set(movie.imdbID, metadata);
    return metadata;
  } catch (error) {
    console.warn(`Failed to fetch metadata for ${movie.imdbID}:`, error);
    return movie;
  }
};

export const useMovies = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mutationLockRef = useRef<Promise<void>>(Promise.resolve());

  const loadMovies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedMovies = await getMovies();
      setMovies(fetchedMovies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load movies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMovie = useCallback(
    async (baseMovie: Partial<Movie>) => {
      const movieWithMetadata = await fetchMovieMetadata(baseMovie);
      
      const newMovie: Movie = {
        imdbID: movieWithMetadata.imdbID || baseMovie.imdbID || '',
        title: movieWithMetadata.title || baseMovie.title || 'Unknown Title',
        year: movieWithMetadata.year || baseMovie.year || 'Unknown Year',
        poster: movieWithMetadata.poster || baseMovie.poster || '',
        rated: movieWithMetadata.rated || baseMovie.rated || 'N/A',
        genre: movieWithMetadata.genre || baseMovie.genre || 'Unknown',
        director: movieWithMetadata.director || baseMovie.director || 'Unknown',
        actors: movieWithMetadata.actors || baseMovie.actors || 'Unknown',
        plot: movieWithMetadata.plot || baseMovie.plot || 'No plot available',
        runtime: movieWithMetadata.runtime || baseMovie.runtime || 'N/A',
        addedAt: Date.now(),
      };

      await performMutation(mutationLockRef, async () => {
        const latestMovies = await getMovies();
        const updatedMovies = [...latestMovies, newMovie];
        await saveMovies(updatedMovies);
        setMovies(updatedMovies);
      });
    },
    []
  );

  const removeMovie = useCallback(
    async (imdbID: string) => {
      await performMutation(mutationLockRef, async () => {
        const latestMovies = await getMovies();
        const updatedMovies = latestMovies.filter((movie) => movie.imdbID !== imdbID);
        await saveMovies(updatedMovies);
        setMovies(updatedMovies);
      });
    },
    []
  );

  const updateMovie = useCallback(
    async (imdbID: string, updates: Partial<Movie>) => {
      await performMutation(mutationLockRef, async () => {
        const latestMovies = await getMovies();
        const updatedMovies = latestMovies.map((movie) =>
          movie.imdbID === imdbID ? { ...movie, ...updates } : movie
        );
        await saveMovies(updatedMovies);
        setMovies(updatedMovies);
      });
    },
    []
  );

  const clearMovies = useCallback(async () => {
    await performMutation(mutationLockRef, async () => {
      await saveMovies([]);
      setMovies([]);
    });
  }, []);

  const refreshMovies = useCallback(() => {
    // Clear cache by forcing a fresh fetch
    return loadMovies();
  }, [loadMovies]);

  return {
    movies,
    isLoading,
    error,
    addMovie,
    removeMovie,
    updateMovie,
    clearMovies,
    refreshMovies,
    loadMovies,
  };
};
