import { useCallback, useMemo } from 'react';
import { usePolling } from '@/hooks/usePolling';
import { GIST_SUGGESTIONS_FILENAME, GIST_TOKEN } from '@/config/gistConfig.ts';
import { sanitizeInput } from '@/config/security.ts';
import { fetchGist, getGistFileContent, patchGistFile } from '@/services/gistClient.ts';
import { MovieSuggestion, User } from '@/types';
import { MOCK_SUGGESTIONS } from '@/services/mockData';

const POLLING_INTERVAL = 300000; // 5 minutes

const suggestionsEqual = (prev: MovieSuggestion[] | undefined, next: MovieSuggestion[]) => {
  if (!prev) return false;
  if (prev.length !== next.length) return false;
  return JSON.stringify(prev) === JSON.stringify(next);
};

const getSuggestions = async (): Promise<MovieSuggestion[]> => {
  if (!GIST_TOKEN) {
    return MOCK_SUGGESTIONS;
  }

  try {
    const response = await fetchGist({ token: GIST_TOKEN, cache: 'no-cache' });

    if (!response.ok) {
      console.warn('Failed to fetch suggestions, using mock data');
      return MOCK_SUGGESTIONS;
    }

    const gist = await response.json();
    const content = getGistFileContent(gist, GIST_SUGGESTIONS_FILENAME);
    if (content === null) {
      return [];
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error fetching suggestions from Gist:', error);
    throw error;
  }
};

const saveSuggestions = async (suggestions: MovieSuggestion[]): Promise<void> => {
  try {
    const response = await patchGistFile(
      GIST_SUGGESTIONS_FILENAME,
      JSON.stringify(suggestions, null, 2),
      GIST_TOKEN
    );

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('GitHub API error details:', errorBody);
      throw new Error(`GitHub API responded with ${response.status}`);
    }
  } catch (error) {
    console.error('Error saving suggestions to Gist:', error);
    throw error;
  }
};

const addSuggestionService = async (
  title: string,
  suggestedBy: string,
  reason?: string
): Promise<MovieSuggestion> => {
  const suggestions = await getSuggestions();

  const newSuggestion: MovieSuggestion = {
    id: crypto.randomUUID(),
    title: sanitizeInput(title),
    suggestedBy: sanitizeInput(suggestedBy),
    reason: reason ? sanitizeInput(reason) : undefined,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  suggestions.push(newSuggestion);
  await saveSuggestions(suggestions);

  return newSuggestion;
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
