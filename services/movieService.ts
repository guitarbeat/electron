import { GIST_FILENAME, GIST_TOKEN, GIST_API_URL } from '../gistConfig';
import { Movie } from '../types';

// Fetches the raw content of the Gist file.
export const getMovies = async (): Promise<Movie[]> => {
  try {
    if (!GIST_API_URL || !GIST_TOKEN) {
      console.warn('Gist configuration missing. Movie list will be empty.');
      return [];
    }
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
    const file = gist.files[GIST_FILENAME];

    if (!file) {
      console.error(`File "${GIST_FILENAME}" not found in Gist.`);
      return [];
    }

    if (!file.content) {
      return [];
    }

    return JSON.parse(file.content);
  } catch (error) {
    console.error('Error fetching movies from Gist:', error);
    throw error;
  }
};

// Saves the entire movie list back to the Gist, overwriting the previous content.
export const saveMovies = async (movies: Movie[]): Promise<void> => {
  try {
    const response = await fetch(GIST_API_URL, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(movies, null, 2), // Pretty-print the JSON
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
    console.error('Error saving movies to Gist:', error);
    throw error;
  }
};
