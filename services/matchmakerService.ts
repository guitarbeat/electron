import { GIST_MATCHMAKER_FILENAME, GIST_TOKEN, GIST_API_URL } from '../gistConfig';
import { MatchmakerGame } from '../types';

/**
 * Fetches the current matchmaker game state from GitHub Gist.
 * Returns null if no game is currently active or if the file doesn't exist.
 */
export const getMatchmakerGame = async (): Promise<MatchmakerGame | null> => {
  try {
    const response = await fetch(GIST_API_URL, {
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-cache', // Ensure we always get the latest version
    });

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const gist = await response.json();
    const file = gist.files[GIST_MATCHMAKER_FILENAME];

    if (!file || !file.content) {
      return null;
    }

    try {
      return JSON.parse(file.content);
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
    const response = await fetch(GIST_API_URL, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: {
          [GIST_MATCHMAKER_FILENAME]: {
            content: game ? JSON.stringify(game, null, 2) : '',
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
    console.error('Error saving matchmaker game to Gist:', error);
    throw error;
  }
};
