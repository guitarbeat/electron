import { GIST_FILENAME, GIST_TOKEN } from '../config/gistConfig.ts';
import type { Movie } from '../../types';
import {
  buildGithubApiErrorMessage,
  fetchGist,
  getGistFileContent,
  patchGistFile,
} from './gistClient.ts';

// Cache variables to store the last known state
let cachedMovies: Movie[] = [];
let lastETag: string | null = null;

// Fetches the raw content of the Gist file.
export const getMovies = async (): Promise<Movie[]> => {
  try {
    const response = await fetchGist({
      token: GIST_TOKEN,
      eTag: lastETag,
      cache: 'no-cache',
    });

    // If the content hasn't changed, return the cached version
    if (response.status === 304) {
      // Only return cached data if we have previously cached content
      if (cachedMovies.length > 0) {
        return cachedMovies;
      }
      // If cache is empty, fall through to fetch fresh data
    }

    if (!response.ok) {
      const { status } = response;
      let msg = await buildGithubApiErrorMessage(response);
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
    const content = getGistFileContent(gist, GIST_FILENAME);
    if (content === null) {
      console.warn(`Gist is missing "${GIST_FILENAME}". Returning an empty movie list.`);
      return [];
    }

    let movies: Movie[];
    try {
      movies = JSON.parse(content);
    } catch (parseErr) {
      throw new Error(
        `${GIST_FILENAME} contains invalid JSON. It must be a JSON array of movie objects.`
      );
    }
    if (!Array.isArray(movies)) {
      throw new Error(`${GIST_FILENAME} must be a JSON array of movie objects.`);
    }

    // Update cache and ETag atomically only after successful parsing
    const etag = response.headers.get('etag') || response.headers.get('ETag');
    if (etag) {
      cachedMovies = movies;
      lastETag = etag;
    } else {
      // If no ETag, update cache but clear ETag to force refresh next time
      cachedMovies = movies;
      lastETag = null;
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
    const response = await patchGistFile(
      GIST_FILENAME,
      JSON.stringify(movies, null, 2),
      GIST_TOKEN
    );

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
        console.error('GitHub API error details:', errorBody);
      } catch {
        console.error('GitHub API error: Unable to parse error body');
      }
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    // Update local cache after successful save
    cachedMovies = movies;
    lastETag = null; // Clear ETag to force fresh data on next fetch
  } catch (error) {
    console.error('Error saving movies to Gist:', error);
    throw error;
  }
};
