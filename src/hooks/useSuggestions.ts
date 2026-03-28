import { useCallback } from 'react';
import { sanitizeInput } from '@/utils';
import { MovieSuggestion, User } from '@/shared/types';
import { useUser } from '@/app/providers';
import { useSuggestionsBase } from './useSuggestionsBase';

export const useSuggestions = (isPaused: boolean = false) => {
  const { currentUser } = useUser();
  const {
    suggestions,
    pendingSuggestions,
    isLoading,
    isSubmitting,
    error,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    respondToSuggestion,
    performMutation,
  } = useSuggestionsBase<MovieSuggestion>('suggestions', currentUser, isPaused);

  const addSuggestion = useCallback(
    async (title: string, reason?: string): Promise<MovieSuggestion> => {
      if (!currentUser) {
        throw new Error('Profile required');
      }

      const nextSuggestion: MovieSuggestion = {
        id: crypto.randomUUID(),
        title: sanitizeInput(title),
        suggestedBy: currentUser,
        reason: reason ? sanitizeInput(reason) : undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await performMutation(
        'add_suggestion',
        {
          id: nextSuggestion.id,
          title: nextSuggestion.title,
          reason: nextSuggestion.reason,
        },
        [...suggestions, nextSuggestion],
      );
      refresh();
      return nextSuggestion;
    },
    [currentUser, refresh, suggestions, performMutation]
  );

  const acceptSuggestion = useCallback(
    async (suggestionId: string, respondedBy: User): Promise<void> => {
      await respondToSuggestion(suggestionId, 'accepted', respondedBy, 'accept_suggestion');
      refresh();
    },
    [refresh, respondToSuggestion]
  );

  const rejectSuggestion = useCallback(
    async (suggestionId: string, respondedBy: User): Promise<void> => {
      await respondToSuggestion(suggestionId, 'rejected', respondedBy, 'reject_suggestion');
      refresh();
    },
    [refresh, respondToSuggestion]
  );

  return {
    suggestions,
    pendingSuggestions,
    isLoading,
    isSubmitting,
    error,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    addSuggestion,
    acceptSuggestion,
    rejectSuggestion,
  };
};
