import { useCallback, useMemo } from 'react';
import { usePolling } from './usePolling';
import {
  getSuggestions,
  saveSuggestions,
  addSuggestion as addSuggestionService,
} from '../services/suggestionService';
import { MovieSuggestion, User } from '../types';

const POLLING_INTERVAL = 30000; // 30 seconds

const suggestionsEqual = (prev: MovieSuggestion[] | undefined, next: MovieSuggestion[]) => {
  if (!prev) return false;
  if (prev.length !== next.length) return false;
  return JSON.stringify(prev) === JSON.stringify(next);
};

export const useSuggestions = (isPaused: boolean = false) => {
  const {
    data: suggestions,
    isLoading,
    error,
    refresh,
  } = usePolling<MovieSuggestion[]>(getSuggestions, POLLING_INTERVAL, suggestionsEqual, {
    key: 'suggestions',
    isPaused,
  });

  const pendingSuggestions = useMemo(
    () => suggestions?.filter((s) => s.status === 'pending') || [],
    [suggestions]
  );

  const acceptedSuggestions = useMemo(
    () => suggestions?.filter((s) => s.status === 'accepted') || [],
    [suggestions]
  );

  const rejectedSuggestions = useMemo(
    () => suggestions?.filter((s) => s.status === 'rejected') || [],
    [suggestions]
  );

  const addSuggestion = useCallback(
    async (title: string, suggestedBy: string, reason?: string): Promise<MovieSuggestion> => {
      const newSuggestion = await addSuggestionService(title, suggestedBy, reason);
      refresh();
      return newSuggestion;
    },
    [refresh]
  );

  const acceptSuggestion = useCallback(
    async (suggestionId: string, respondedBy: User): Promise<void> => {
      const currentSuggestions = await getSuggestions();
      const suggestion = currentSuggestions.find((s) => s.id === suggestionId);

      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      // Update suggestion status only — movie is already added by the caller
      const updatedSuggestions = currentSuggestions.map((s) =>
        s.id === suggestionId
          ? {
              ...s,
              status: 'accepted' as const,
              respondedAt: new Date().toISOString(),
              respondedBy,
            }
          : s
      );
      await saveSuggestions(updatedSuggestions);

      refresh();
    },
    [refresh]
  );

  const rejectSuggestion = useCallback(
    async (suggestionId: string, respondedBy: User): Promise<void> => {
      const currentSuggestions = await getSuggestions();

      const updatedSuggestions = currentSuggestions.map((s) =>
        s.id === suggestionId
          ? {
              ...s,
              status: 'rejected' as const,
              respondedAt: new Date().toISOString(),
              respondedBy,
            }
          : s
      );

      await saveSuggestions(updatedSuggestions);
      refresh();
    },
    [refresh]
  );

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
