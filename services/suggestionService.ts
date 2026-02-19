import { GIST_ID, GIST_SUGGESTIONS_FILENAME, GIST_TOKEN } from '../gistConfig';
import { MovieSuggestion } from '../types';

const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;

export const getSuggestions = async (): Promise<MovieSuggestion[]> => {
  try {
    const response = await fetch(GIST_API_URL, {
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const gist = await response.json();
    const file = gist.files[GIST_SUGGESTIONS_FILENAME];

    if (!file || !file.content) {
      return [];
    }

    return JSON.parse(file.content);
  } catch (error) {
    console.error('Error fetching suggestions from Gist:', error);
    throw error;
  }
};

export const saveSuggestions = async (suggestions: MovieSuggestion[]): Promise<void> => {
  try {
    const response = await fetch(GIST_API_URL, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: {
          [GIST_SUGGESTIONS_FILENAME]: {
            content: JSON.stringify(suggestions, null, 2),
          },
        },
      }),
    });

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
    title: title.trim(),
    suggestedBy: suggestedBy.trim(),
    reason: reason?.trim() || undefined,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  suggestions.push(newSuggestion);
  await saveSuggestions(suggestions);

  return newSuggestion;
};
