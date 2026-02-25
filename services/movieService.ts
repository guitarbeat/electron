import { GIST_FILENAME, GIST_TOKEN, GIST_API_URL } from '../gistConfig.ts';
import type { Movie } from '../types.ts';

// Cache variables to store the last known state
let cachedMovies: Movie[] = [];
let lastETag: string | null = null;

// Fetches the raw content of the Gist file.
export const getMovies = async (): Promise<Movie[]> => {
  try {
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
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    // Update ETag from the response
    const etag = response.headers.get('ETag');
    if (etag) {
      lastETag = etag;
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

    const movies = JSON.parse(file.content);

    // Update cache
    cachedMovies = movies;

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
