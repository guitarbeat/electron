import { useState, useEffect, useCallback, useMemo } from 'react';
import { Movie, User } from '../types';
import { usePolling } from './usePolling';
import { getMovies, saveMovies } from '../services/movieService';

export const useMovies = (currentUser: User) => {
  const { data: movies, error, isLoading, refresh } = usePolling(getMovies, 5000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to seed the initial movies if the Gist is empty
  useEffect(() => {
    const seedMovies = async () => {
        const hasBeenSeeded = localStorage.getItem('movieListSeeded_gist_refactored');
        if (!isLoading && movies && movies.length === 0 && hasBeenSeeded !== 'true') {
            console.log('Gist is empty, seeding initial movies...');
            const defaultMovies: Omit<Movie, 'id' | 'createdAt'>[] = [
                { title: 'The Last Unicorn', addedBy: 'Aaron', watchedBy: [] },
                { title: 'Renfield', addedBy: 'Aaron', watchedBy: [] },
                { title: 'Sinister', addedBy: 'Aaron', watchedBy: [] },
                { title: 'Creep', addedBy: 'Aaron', watchedBy: [] },
                { title: 'Easy A', addedBy: 'Aaron', watchedBy: [] },
                { title: 'The Lego Movie', addedBy: 'Aaron', watchedBy: [] },
                { title: 'Key and Peele', addedBy: 'Aaron', watchedBy: [] },
                { title: 'Beetlejuice', addedBy: 'Aaron', watchedBy: [] },
            ];

            const moviesToSave: Movie[] = defaultMovies.map((movie) => ({
                ...movie,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
            }));
            
            try {
                setIsSubmitting(true);
                await saveMovies(moviesToSave);
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
  }, [movies, isLoading, refresh]);

  const performMutation = useCallback(async (mutationFn: (latestMovies: Movie[]) => Movie[]) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const latestMovies = await getMovies();
      const updatedMovies = mutationFn(latestMovies);
      await saveMovies(updatedMovies);
      refresh();
    } catch (err) {
      console.error("Mutation failed:", err);
      // Re-throw the error so the calling component can handle it
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, refresh]);

  const addMovie = useCallback(async (title: string) => {
    const newMovie: Movie = {
      id: crypto.randomUUID(),
      title: title.trim(),
      addedBy: currentUser,
      watchedBy: [],
      createdAt: new Date().toISOString(),
    };
    await performMutation(latestMovies => [...latestMovies, newMovie]);
  }, [currentUser, performMutation]);

  const toggleWatched = useCallback(async (movieId: string) => {
    await performMutation(latestMovies => 
      latestMovies.map(movie => {
        if (movie.id === movieId) {
          const isWatched = movie.watchedBy.includes(currentUser);
          const newWatchedBy = isWatched
            ? movie.watchedBy.filter(user => user !== currentUser)
            : [...movie.watchedBy, currentUser];
          return { ...movie, watchedBy: newWatchedBy };
        }
        return movie;
      })
    );
  }, [currentUser, performMutation]);

  const deleteMovie = useCallback(async (movieId: string) => {
    await performMutation(latestMovies => latestMovies.filter(movie => movie.id !== movieId));
  }, [performMutation]);
  
  const sortedMovies = useMemo(() => {
    return movies
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
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
      : [];
  }, [movies]);

  return { movies: sortedMovies, isLoading, error, isSubmitting, addMovie, toggleWatched, deleteMovie };
};