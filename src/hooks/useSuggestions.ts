import { useCallback } from 'react';
import { sanitizeInput } from '@/utils';
import { MovieSuggestion, User } from '@/shared/types';
import { useUser } from '@/app/providers';
import { mutateScope } from '@/services/stateClient';
import type { MovieAutocompleteResult } from '@/services/metadataService';
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
    async (
      title: string,
      reason?: string,
      suggestedByOverride?: string,
      selectedResult?: Pick<MovieAutocompleteResult, 'imdbID' | 'type'> | null
    ): Promise<MovieSuggestion> => {
      const cleanSuggestedBy =
        currentUser ?? (sanitizeInput(suggestedByOverride || '') || 'Guest');

      const nextSuggestion: MovieSuggestion = {
        id: crypto.randomUUID(),
        title: sanitizeInput(title),
        suggestedBy: cleanSuggestedBy,
        reason: reason ? sanitizeInput(reason) : undefined,
        imdbID: selectedResult?.imdbID,
        type: selectedResult?.type,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      if (currentUser) {
        await performMutation(
          'add_suggestion',
          {
            id: nextSuggestion.id,
            title: nextSuggestion.title,
            reason: nextSuggestion.reason,
            imdbID: nextSuggestion.imdbID,
            type: nextSuggestion.type,
          },
          [...suggestions, nextSuggestion],
        );
      } else {
        await mutateScope('suggestions', {
          op: 'add_suggestion',
          payload: {
            id: nextSuggestion.id,
            title: nextSuggestion.title,
            reason: nextSuggestion.reason,
            suggestedBy: nextSuggestion.suggestedBy,
            imdbID: nextSuggestion.imdbID,
            type: nextSuggestion.type,
          },
          optimisticData: [...suggestions, nextSuggestion],
        });
      }

      refresh();
      return nextSuggestion;
    },
    [currentUser, performMutation, refresh, suggestions]
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
