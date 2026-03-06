import { GIST_MATCHMAKER_FILENAME, GIST_TOKEN } from '../../config/gistConfig.ts';
import type { MatchmakerGame } from '../../types.ts';
import { fetchGist, getGistFileContent, patchGistFile } from '../core/gistClient.ts';

/**
 * Fetches the current matchmaker game state from GitHub Gist.
 * Returns null if no game is currently active or if the file doesn't exist.
 */
export const getMatchmakerGame = async (): Promise<MatchmakerGame | null> => {
  try {
    const response = await fetchGist({ token: GIST_TOKEN, cache: 'no-cache' });

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const gist = await response.json();
    const content = getGistFileContent(gist, GIST_MATCHMAKER_FILENAME);
    if (content === null) {
      return null;
    }

    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Error parsing matchmaker JSON:', e);
      return null;
    }
  } catch (error) {
    console.error('Error fetching matchmaker game from Gist:', error);
    return null;
  }
};

/**
 * Saves the matchmaker game state to GitHub Gist.
 * If game is null, effectively clears the matchmaker state (the file will be empty).
 */
export const saveMatchmakerGame = async (game: MatchmakerGame | null): Promise<void> => {
  try {
    const response = await patchGistFile(
      GIST_MATCHMAKER_FILENAME,
      game ? JSON.stringify(game, null, 2) : '',
      GIST_TOKEN
    );

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('GitHub API error details:', errorBody);
      throw new Error(`GitHub API responded with ${response.status}`);
    }
  } catch (error) {
    console.error('Error saving matchmaker game to Gist:', error);
    throw error;
  }
};
