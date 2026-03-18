import { useCallback, useMemo } from 'react';
import { usePolling } from '@/services/polling';
import { areDeeplyEqual, parseJsonContent, sanitizeInput } from '@/utils';
import {
  canWriteGist,
  GIST_SUGGESTIONS_FILENAME,
  patchGistFile,
  readGistJsonFile,
  readStoredJson,
  setLocalOverride,
  writeStoredJson,
} from '@/services/gistClient.ts';
import { MovieSuggestion, User } from '@/types';

const POLLING_INTERVAL = 300000; // 5 minutes
const SUGGESTIONS_LOCAL_STORAGE_KEY = 'movieList.localSuggestions';

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

const readStoredLocalSuggestions = (): MovieSuggestion[] | null =>
  readStoredJson({
    storageKey: SUGGESTIONS_LOCAL_STORAGE_KEY,
    validate: (value): value is MovieSuggestion[] =>
      Array.isArray(value) && value.every(isSuggestionRecord),
    clone: cloneSuggestions,
    label: 'local suggestions fallback',
  });

const getFallbackSuggestions = (): MovieSuggestion[] => readStoredLocalSuggestions() ?? [];

const saveLocalSuggestions = (suggestions: MovieSuggestion[]): void => {
  writeStoredJson({
    storageKey: SUGGESTIONS_LOCAL_STORAGE_KEY,
    value: suggestions,
    clone: cloneSuggestions,
    label: 'local suggestions fallback',
  });
  setLocalOverride('suggestions', true);
};

const getSuggestions = async (): Promise<MovieSuggestion[]> => {
  try {
    return await readGistJsonFile({
      scope: 'suggestions',
      filename: GIST_SUGGESTIONS_FILENAME,
      fallback: getFallbackSuggestions,
      onMissingFileWhenWritable: () => [],
      parse: (content) => parseJsonContent(content, 'suggestions') as MovieSuggestion[],
    });
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
  } = usePolling<MovieSuggestion[]>(getSuggestions, POLLING_INTERVAL, areDeeplyEqual, {
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
