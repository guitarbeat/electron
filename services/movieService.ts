import { GIST_FILENAME, GIST_TOKEN, GIST_ID, GIST_API_URL } from '../config/gistConfig';
import type { Movie } from '../types';

// Cache variables to store the last known state
let cachedMovies: Movie[] = [];
let lastETag: string | null = null;

// Fetches the raw content of the Gist file.
export const getMovies = async (): Promise<Movie[]> => {
  try {
    if (!GIST_TOKEN?.trim()) {
      throw new Error(
        'VITE_GIST_TOKEN is missing or empty. Add it to your .env (GitHub token with "gist" scope), then restart the dev server.'
      );
    }
    if (!GIST_ID?.trim()) {
      throw new Error(
        'VITE_GIST_ID is missing or empty. Add your Gist ID to .env (from the Gist URL), then restart the dev server.'
      );
    }

    const headers: Record<string, string> = {
      Authorization: `token ${GIST_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    };

    // Use ETag for conditional request if available
    if (lastETag) {
      headers['If-None-Match'] = lastETag;
    }

    const response = await fetch(GIST_API_URL, {
      headers,
      cache: 'no-cache', // Ensure we always check with the server
    });

    // If the content hasn't changed, return the cached version
    if (response.status === 304) {
      return cachedMovies;
    }

    if (!response.ok) {
      const status = response.status;
      let msg = `GitHub API responded with ${status}.`;
      try {
        const errBody = await response.clone().json();
        if (errBody?.message) msg += ` GitHub says: "${errBody.message}".`;
      } catch {
        /* ignore parse error */
      }
      if (status === 401 || status === 404) {
        msg +=
          ' Check that VITE_GIST_TOKEN is valid, has the "gist" scope, and VITE_GIST_ID matches your Gist. Restart the dev server after changing .env.';
      } else if (status === 403) {
        msg +=
          ' Token may lack "gist" scope or the Gist may be inaccessible. Restart dev server after .env changes.';
      }
      throw new Error(msg);
    }

    const gist = await response.json();
    const file = gist.files[GIST_FILENAME];

    if (!file) {
      const hint = `Your Gist must contain a file named "${GIST_FILENAME}" with a JSON array of movie objects. Create that file in the Gist (e.g. paste [] and save) then refresh.`;
      console.error(hint);
      throw new Error(`Gist is missing "${GIST_FILENAME}". ${hint}`);
    }

    if (!file.content) {
      return [];
    }

    let movies: Movie[];
    try {
      movies = JSON.parse(file.content);
    } catch (parseErr) {
      throw new Error(
        `${GIST_FILENAME} contains invalid JSON. It must be a JSON array of movie objects.`
      );
    }
    if (!Array.isArray(movies)) {
      throw new Error(`${GIST_FILENAME} must be a JSON array of movie objects.`);
    }

    // Update cache and ETag only after successful parsing
    cachedMovies = movies;

    const etag = response.headers.get('ETag');
    if (etag) {
      lastETag = etag;
    }

    return movies;
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
