import { useCallback, useMemo } from 'react';
import { usePolling } from '@/hooks/usePolling';
import { sanitizeInput } from '@/config/security.ts';
import {
  canReadGist,
  canWriteGist,
  fetchGist,
  getGistFileContent,
  GIST_SUGGESTIONS_FILENAME,
  hasLocalOverride,
  patchGistFile,
  setLocalOverride,
} from '@/services/gistClient.ts';
import { MovieSuggestion, User } from '@/types';
import { MOCK_SUGGESTIONS } from '@/services/mockData';

const POLLING_INTERVAL = 300000; // 5 minutes
const SUGGESTIONS_LOCAL_STORAGE_KEY = 'movieList.localSuggestions';

const suggestionsEqual = (prev: MovieSuggestion[] | undefined, next: MovieSuggestion[]) => {
  if (!prev) return false;
  if (prev.length !== next.length) return false;
  return JSON.stringify(prev) === JSON.stringify(next);
};

const cloneSuggestions = (suggestions: MovieSuggestion[]): MovieSuggestion[] =>
  suggestions.map((suggestion) => ({ ...suggestion }));

const isSuggestionStatus = (value: unknown): value is MovieSuggestion['status'] =>
  value === 'pending' || value === 'accepted' || value === 'rejected';

const isSuggestionRecord = (value: unknown): value is MovieSuggestion => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const suggestion = value as Partial<MovieSuggestion>;

  return (
    typeof suggestion.id === 'string' &&
    typeof suggestion.title === 'string' &&
    typeof suggestion.suggestedBy === 'string' &&
    typeof suggestion.createdAt === 'string' &&
    isSuggestionStatus(suggestion.status)
  );
};

const readStoredLocalSuggestions = (): MovieSuggestion[] | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SUGGESTIONS_LOCAL_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isSuggestionRecord)) {
      return cloneSuggestions(parsed);
    }
  } catch (error) {
    console.warn('Failed to read local suggestions fallback, resetting to defaults.', error);
  }

  return null;
};

const getFallbackSuggestions = (): MovieSuggestion[] =>
  readStoredLocalSuggestions() ?? cloneSuggestions(MOCK_SUGGESTIONS);

const saveLocalSuggestions = (suggestions: MovieSuggestion[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      SUGGESTIONS_LOCAL_STORAGE_KEY,
      JSON.stringify(cloneSuggestions(suggestions))
    );
  } catch (error) {
    console.warn('Failed to persist local suggestions fallback.', error);
  }

  setLocalOverride('suggestions', true);
};

const getSuggestions = async (): Promise<MovieSuggestion[]> => {
  if (!canReadGist) {
    return getFallbackSuggestions();
  }

  if (hasLocalOverride('suggestions') && readStoredLocalSuggestions()) {
    return getFallbackSuggestions();
  }

  try {
    const response = await fetchGist({ cache: 'no-cache' });

    if (!response.ok) {
      console.warn(`Failed to fetch suggestions (${response.status}), using local fallback.`);
      return getFallbackSuggestions();
    }

    const gist = await response.json();
    const content = getGistFileContent(gist, GIST_SUGGESTIONS_FILENAME);
    if (content === null) {
      if (!canWriteGist) {
        return getFallbackSuggestions();
      }
      return [];
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error fetching suggestions from Gist:', error);
    return getFallbackSuggestions();
  }
};

const saveSuggestions = async (suggestions: MovieSuggestion[]): Promise<void> => {
  if (!canWriteGist) {
    saveLocalSuggestions(suggestions);
    return;
  }

  try {
    const response = await patchGistFile(
      GIST_SUGGESTIONS_FILENAME,
      JSON.stringify(suggestions, null, 2)
    );

    if (!response.ok) {
      console.warn(
        `Failed to save suggestions to Gist (${response.status}), using local fallback.`
      );
      saveLocalSuggestions(suggestions);
      return;
    }
    setLocalOverride('suggestions', false);
  } catch (error) {
    console.warn('Error saving suggestions to Gist, using local fallback:', error);
    saveLocalSuggestions(suggestions);
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
