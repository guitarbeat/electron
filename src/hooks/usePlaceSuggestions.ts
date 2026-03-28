import { useCallback } from 'react';
import { sanitizeInput } from '../utils/index.ts';
import type { PlaceSuggestion, User } from '../shared/types.ts';
import { useUser } from '../app/providers/UserProvider.tsx';
import { useSuggestionsBase } from './useSuggestionsBase';

export const usePlaceSuggestions = (isPaused: boolean = false) => {
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
  } = useSuggestionsBase<PlaceSuggestion>('placeSuggestions', currentUser, isPaused);

  const addPlaceSuggestion = useCallback(
    async (name: string, notes?: string, metadata?: Partial<PlaceSuggestion>): Promise<PlaceSuggestion> => {
      if (!currentUser) {
        throw new Error('Profile required');
      }

      const nextSuggestion: PlaceSuggestion = {
        id: crypto.randomUUID(),
        name: sanitizeInput(name),
        suggestedBy: currentUser,
        notes: notes ? sanitizeInput(notes) : undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...metadata,
      };

      await performMutation(
        'add_place_suggestion',
        {
          id: nextSuggestion.id,
          name: nextSuggestion.name,
          notes: nextSuggestion.notes,
          category: nextSuggestion.category,
          rating: nextSuggestion.rating,
          description: nextSuggestion.description,
          imageUrl: nextSuggestion.imageUrl,
        },
        [...suggestions, nextSuggestion],
      );
      refresh();
      return nextSuggestion;
    },
    [currentUser, refresh, suggestions, performMutation]
  );

  const acceptPlaceSuggestion = useCallback(
    async (suggestionId: string, respondedBy: User): Promise<void> => {
      await respondToSuggestion(suggestionId, 'accepted', respondedBy, 'accept_place_suggestion');
      refresh();
    },
    [refresh, respondToSuggestion]
  );

  const rejectPlaceSuggestion = useCallback(
    async (suggestionId: string, respondedBy: User): Promise<void> => {
      await respondToSuggestion(suggestionId, 'rejected', respondedBy, 'reject_place_suggestion');
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
    addPlaceSuggestion,
    acceptPlaceSuggestion,
    rejectPlaceSuggestion,
  };
};
