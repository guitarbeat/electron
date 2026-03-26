import { useCallback, useMemo } from 'react';
import { usePolling } from '@/services/polling';
import { areDeeplyEqual, sanitizeInput } from '@/utils';
import { MovieSuggestion, User } from '@/shared/types';
import { useUser } from '@/app/providers';
import { mutateScope, readScope, retryScopeSync } from '@/services/stateClient';

const POLLING_INTERVAL = 60000;

export const useSuggestions = (isPaused: boolean = false) => {
  const { currentUser } = useUser();
  const readSuggestions = useCallback(() => readScope('suggestions'), []);
  const {
    data: snapshot,
    isLoading,
    error,
    refresh,
  } = usePolling(readSuggestions, POLLING_INTERVAL, areDeeplyEqual, {
    key: 'suggestions',
    isPaused,
  });

  const suggestions = useMemo(() => snapshot?.data ?? [], [snapshot]);

  const pendingSuggestions = useMemo(
    () => suggestions.filter((s) => s.status === 'pending'),
    [suggestions]
  );

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

      await mutateScope('suggestions', {
        op: 'add_suggestion',
        payload: {
          id: nextSuggestion.id,
          title: nextSuggestion.title,
          reason: nextSuggestion.reason,
        },
        optimisticData: [...suggestions, nextSuggestion],
      });
      refresh();
      return nextSuggestion;
    },
    [currentUser, refresh, suggestions]
  );

  const acceptSuggestion = useCallback(
    async (suggestionId: string, respondedBy: User): Promise<void> => {
      if (!currentUser) {
        throw new Error('Profile required');
      }

      const suggestion = suggestions.find((entry) => entry.id === suggestionId);
      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      await mutateScope('suggestions', {
        op: 'accept_suggestion',
        payload: { suggestionId },
        optimisticData: suggestions.map((entry) =>
          entry.id === suggestionId
            ? {
                ...entry,
                status: 'accepted',
                respondedAt: new Date().toISOString(),
                respondedBy,
              }
            : entry
        ),
      });

      refresh();
    },
    [currentUser, refresh, suggestions]
  );

  const rejectSuggestion = useCallback(
    async (suggestionId: string, respondedBy: User): Promise<void> => {
      if (!currentUser) {
        throw new Error('Profile required');
      }

      const suggestion = suggestions.find((entry) => entry.id === suggestionId);
      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      await mutateScope('suggestions', {
        op: 'reject_suggestion',
        payload: { suggestionId },
        optimisticData: suggestions.map((entry) =>
          entry.id === suggestionId
            ? {
                ...entry,
                status: 'rejected',
                respondedAt: new Date().toISOString(),
                respondedBy,
              }
            : entry
        ),
      });
      refresh();
    },
    [currentUser, refresh, suggestions]
  );

  const retrySync = useCallback(async () => {
    await retryScopeSync('suggestions');
    refresh();
  }, [refresh]);

  return {
    suggestions,
    pendingSuggestions,
    isLoading,
    error,
    isDegraded: snapshot?.degraded ?? false,
    isSyncBlocked: snapshot?.blocked ?? false,
    syncWarning: snapshot?.warning,
    refresh,
    retrySync,
    addSuggestion,
    acceptSuggestion,
    rejectSuggestion,
  };
};
