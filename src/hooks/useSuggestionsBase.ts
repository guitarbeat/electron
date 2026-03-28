import { useCallback, useMemo } from 'react';
import { User } from '@/shared/types';
import { useCollection } from './useCollection';

export interface BaseSuggestion {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  respondedAt?: string;
  respondedBy?: User;
}

export const useSuggestionsBase = <T extends BaseSuggestion>(
  scope: string,
  currentUser: User | null | undefined,
  isPaused: boolean = false
) => {
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
  } = useCollection<T>(scope, currentUser, { pollingInterval: 60000, isPaused });

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
    respondToSuggestion,
    performMutation,
  };
};
