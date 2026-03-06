import { GIST_SUGGESTIONS_FILENAME, GIST_TOKEN } from '../config/gistConfig.ts';
import { sanitizeInput } from '../config/security.ts';
import type { MovieSuggestion } from '../types.ts';
import { fetchGist, getGistFileContent, patchGistFile } from './gistClient.ts';

export const getSuggestions = async (): Promise<MovieSuggestion[]> => {
  try {
    const response = await fetchGist({ token: GIST_TOKEN, cache: 'no-cache' });

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
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

export const saveSuggestions = async (suggestions: MovieSuggestion[]): Promise<void> => {
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

export const addSuggestion = async (
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
