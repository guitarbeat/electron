import { useCallback, useMemo } from 'react';
import { sanitizeInput } from '@/utils';
import { MovieSuggestion, User } from '@/shared/types';
import { useUser } from '@/app/useProviders';
import { mutateScope } from '@/services/state';
import type { MovieAutocompleteResult } from '@/services/metadata/types';
import { useCollection } from '../useCollection';

export interface BaseSuggestion {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  respondedAt?: string;
  respondedBy?: User;
}

export const useSuggestions = (isPaused: boolean = false) => {
  const { currentUser } = useUser();
  const {
    data: suggestions,
    isLoading,
    isSubmitting,
    error,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    performMutation,
  } = useCollection<MovieSuggestion>('suggestions', currentUser, { pollingInterval: 60000, isPaused });

  const pendingSuggestions = useMemo(
    () => suggestions.filter((s) => s.status === 'pending'),
    [suggestions]
  );

  const respondToSuggestion = useCallback(
    async (suggestionId: string, status: 'accepted' | 'rejected', respondedBy: User, op: string) => {
      const suggestion = suggestions.find((entry) => entry.id === suggestionId);
      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      await performMutation(
        op,
        { suggestionId },
        suggestions.map((entry) =>
          entry.id === suggestionId
            ? {
                ...entry,
                status,
                respondedAt: new Date().toISOString(),
                respondedBy,
              }
            : entry
        )
      );
    },
    [performMutation, suggestions]
  );

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
          [...suggestions, nextSuggestion]
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

      return nextSuggestion;
    },
    [currentUser, performMutation, suggestions]
  );

  const acceptSuggestion = useCallback(
    async (suggestionId: string, respondedBy: User): Promise<void> => {
      await respondToSuggestion(suggestionId, 'accepted', respondedBy, 'accept_suggestion');
    },
    [respondToSuggestion]
  );

  const rejectSuggestion = useCallback(
    async (suggestionId: string, respondedBy: User): Promise<void> => {
      await respondToSuggestion(suggestionId, 'rejected', respondedBy, 'reject_suggestion');
    },
    [respondToSuggestion]
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
