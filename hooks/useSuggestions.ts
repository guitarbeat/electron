import { useCallback, useMemo } from 'react';
import { usePolling } from './usePolling';
import { getSuggestions, saveSuggestions, addSuggestion as addSuggestionService } from '../services/suggestionService';
import { MovieSuggestion, User, Movie } from '../types';
import { getMovies, saveMovies } from '../services/movieService';

const POLLING_INTERVAL = 30000; // 30 seconds

const suggestionsEqual = (prev: MovieSuggestion[] | undefined, next: MovieSuggestion[]) => {
  if (!prev) return false;
  if (prev.length !== next.length) return false;
  return JSON.stringify(prev) === JSON.stringify(next);
};

export const useSuggestions = () => {
  const { data: suggestions, isLoading, error, refresh } = usePolling<MovieSuggestion[]>(
    getSuggestions,
    POLLING_INTERVAL,
    suggestionsEqual
  );

  const pendingSuggestions = useMemo(() => 
    suggestions?.filter(s => s.status === 'pending') || [], 
    [suggestions]
  );

  const acceptedSuggestions = useMemo(() => 
    suggestions?.filter(s => s.status === 'accepted') || [], 
    [suggestions]
  );

  const rejectedSuggestions = useMemo(() => 
    suggestions?.filter(s => s.status === 'rejected') || [], 
    [suggestions]
  );

  const addSuggestion = useCallback(async (
    title: string,
    suggestedBy: string,
    reason?: string
  ): Promise<MovieSuggestion> => {
    const newSuggestion = await addSuggestionService(title, suggestedBy, reason);
    refresh();
    return newSuggestion;
  }, [refresh]);

  const acceptSuggestion = useCallback(async (
    suggestionId: string,
    respondedBy: User
  ): Promise<void> => {
    const currentSuggestions = await getSuggestions();
    const suggestion = currentSuggestions.find(s => s.id === suggestionId);
    
    if (!suggestion) {
      throw new Error('Suggestion not found');
    }

    // Update suggestion status
    const updatedSuggestions = currentSuggestions.map(s => 
      s.id === suggestionId 
        ? { ...s, status: 'accepted' as const, respondedAt: new Date().toISOString(), respondedBy }
        : s
    );
    await saveSuggestions(updatedSuggestions);

    // Add movie to watchlist
    const movies = await getMovies();
    const newMovie: Movie = {
      id: `movie-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: suggestion.title,
      addedBy: respondedBy,
      watchedBy: [],
      createdAt: new Date().toISOString(),
    };
    movies.unshift(newMovie);
    await saveMovies(movies);

    refresh();
  }, [refresh]);

  const rejectSuggestion = useCallback(async (
    suggestionId: string,
    respondedBy: User
  ): Promise<void> => {
    const currentSuggestions = await getSuggestions();
    
    const updatedSuggestions = currentSuggestions.map(s => 
      s.id === suggestionId 
        ? { ...s, status: 'rejected' as const, respondedAt: new Date().toISOString(), respondedBy }
        : s
    );
    
    await saveSuggestions(updatedSuggestions);
    refresh();
  }, [refresh]);

  return {
    suggestions: suggestions || [],
    pendingSuggestions,
    acceptedSuggestions,
    rejectedSuggestions,
    isLoading,
    error,
    refresh,
    addSuggestion,
    acceptSuggestion,
    rejectSuggestion,
  };
};
