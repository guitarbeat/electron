import { GIST_FILENAME, GIST_MATCHMAKER_FILENAME, GIST_TOKEN } from '../../config/gistConfig.ts';
import type { Movie, MatchmakerGame } from '../../types.ts';
import {
  buildGithubApiErrorMessage,
  fetchGist,
  getGistFileContent,
  patchGistFile,
} from '../../services/gistClient.ts';

// Generic cache interface for ETag-based caching
interface CacheState<T> {
  data: T[];
  lastETag: string | null;
}

// Movie-specific cache
const movieCache: CacheState<Movie> = {
  data: [],
  lastETag: null,
};

// Generic Gist fetch with ETag caching
const fetchWithCache = async <T>(
  filename: string,
  cache: CacheState<T>,
  defaultValue: T[]
): Promise<T[]> => {
  try {
    const response = await fetchGist({
      token: GIST_TOKEN,
      eTag: cache.lastETag,
      cache: 'no-cache',
    });

    // If the content hasn't changed, return the cached version
    if (response.status === 304) {
      return cache.data;
    }

    if (!response.ok) {
      const status = response.status;
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
    const content = getGistFileContent(gist, filename);
    if (content === null) {
      console.warn(`Gist is missing "${filename}". Returning default value.`);
      return defaultValue;
    }

    let data: T[];
    try {
      data = JSON.parse(content);
    } catch (parseErr) {
      throw new Error(
        `${filename} contains invalid JSON. It must be a valid JSON array.`
      );
    }
    if (!Array.isArray(data)) {
      throw new Error(`${filename} must be a JSON array.`);
    }

    // Update cache and ETag only after successful parsing
    cache.data = data;
    const etag = response.headers.get('ETag');
    if (etag) {
      cache.lastETag = etag;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${filename} from Gist:`, error);
    throw error;
  }
};

// Generic Gist save
const saveToGist = async <T>(
  filename: string,
  data: T[] | null,
  defaultValue: T[]
): Promise<void> => {
  try {
    const response = await patchGistFile(
      filename,
      data ? JSON.stringify(data, null, 2) : JSON.stringify(defaultValue, null, 2),
      GIST_TOKEN
    );

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('GitHub API error details:', errorBody);
      throw new Error(`GitHub API responded with ${response.status}`);
    }
  } catch (error) {
    console.error(`Error saving ${filename} to Gist:`, error);
    throw error;
  }
};

// Movie operations
export const movieService = {
  getMovies: () => fetchWithCache(GIST_FILENAME, movieCache, []),
  saveMovies: (movies: Movie[]) => saveToGist(GIST_FILENAME, movies, []),
};

// Matchmaker operations (no caching for real-time game state)
export const matchmakerService = {
  getMatchmakerGame: async (): Promise<MatchmakerGame | null> => {
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
  },

  saveMatchmakerGame: async (game: MatchmakerGame | null): Promise<void> => {
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
  },
};
