import { GIST_FILENAME, GIST_TOKEN, GIST_ID, GIST_API_URL } from '../config/gistConfig';
import type { Movie } from '../types';

// Cache variables to store the last known state
let cachedMovies: Movie[] = [];
let lastETag: string | null = null;

// Mock data fallback for development/testing
const mockMovies: Movie[] = [
  {
    id: '1',
    title: 'The Shawshank Redemption',
    year: '1994',
    posterUrl: 'https://via.placeholder.com/200x300?text=Shawshank',
    genre: 'Drama',
    category: 'Drama',
    runtime: '142',
    watchedBy: [],
    createdAt: new Date().toISOString(),
    addedBy: 'Aaron',
  },
  {
    id: '2',
    title: 'The Godfather',
    year: '1972',
    posterUrl: 'https://via.placeholder.com/200x300?text=Godfather',
    genre: 'Crime, Drama',
    category: 'Drama',
    runtime: '175',
    watchedBy: [],
    createdAt: new Date().toISOString(),
    addedBy: 'Aaron',
  },
  {
    id: '3',
    title: 'Inception',
    year: '2010',
    posterUrl: 'https://via.placeholder.com/200x300?text=Inception',
    genre: 'Sci-Fi, Action',
    category: 'Sci-Fi',
    runtime: '148',
    watchedBy: [],
    createdAt: new Date().toISOString(),
    addedBy: 'Aaron',
  },
  {
    id: '4',
    title: 'Pulp Fiction',
    year: '1994',
    posterUrl: 'https://via.placeholder.com/200x300?text=PulpFiction',
    genre: 'Crime, Drama',
    category: 'Drama',
    runtime: '154',
    watchedBy: [],
    createdAt: new Date().toISOString(),
    addedBy: 'Aaron',
  },
  {
    id: '5',
    title: 'The Dark Knight',
    year: '2008',
    posterUrl: 'https://via.placeholder.com/200x300?text=DarkKnight',
    genre: 'Action, Crime, Drama',
    category: 'Action',
    runtime: '152',
    watchedBy: [],
    createdAt: new Date().toISOString(),
    addedBy: 'Aaron',
  },
];

// Fetches the raw content of the Gist file.
export const getMovies = async (): Promise<Movie[]> => {
  try {
    // If credentials are missing, use mock data instead of erroring
    if (!GIST_TOKEN?.trim() || !GIST_ID?.trim()) {
      console.warn(
        'GitHub credentials not configured. Using mock movie data. Set VITE_GIST_TOKEN and VITE_GIST_ID to use real data.'
      );
      return mockMovies;
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
      const { status } = response;
      // Return mock data for 401/403 auth errors instead of throwing
      if (status === 401 || status === 403) {
        console.warn(`GitHub API returned ${status}. Falling back to mock movies.`);
        return mockMovies;
      }
      let msg = `GitHub API responded with ${status}.`;
      try {
        const errBody = await response.clone().json();
        if (errBody?.message) msg += ` GitHub says: "${errBody.message}".`;
      } catch {
        /* ignore parse error */
      }
      if (status === 404) {
        msg +=
          ' Check that VITE_GIST_ID matches your Gist. Restart the dev server after changing .env.';
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
    // Return mock data as fallback when API fails
    console.warn('Falling back to mock movie data');
    return mockMovies;
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
