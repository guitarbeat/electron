import { GIST_ID, GIST_FILENAME, GIST_TOKEN } from '../gistConfig';
import { Movie } from '../types';

const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;

// Log configuration on module load for debugging
const logGistConfig = () => {
  console.log('[movieService] Gist Configuration:', {
    hasGistId: !!GIST_ID,
    hasGistToken: !!GIST_TOKEN,
    gistFilename: GIST_FILENAME,
    gistIdLength: GIST_ID?.length || 0,
    gistTokenLength: GIST_TOKEN?.length || 0,
  });

  if (!GIST_ID) {
    console.error('[movieService] ERROR: GIST_ID is not configured. Please set VITE_GIST_ID in your .env file.');
  }
  if (!GIST_TOKEN) {
    console.error('[movieService] ERROR: GIST_TOKEN is not configured. Please set VITE_GIST_TOKEN in your .env file.');
  }
};

logGistConfig();

// Default movies to seed when Gist file is missing or empty
const DEFAULT_MOVIES: Omit<Movie, 'id' | 'createdAt'>[] = [
  { title: 'The Last Unicorn', addedBy: 'Aaron', watchedBy: [] },
  { title: 'Renfield', addedBy: 'Aaron', watchedBy: [] },
  { title: 'Sinister', addedBy: 'Aaron', watchedBy: [] },
  { title: 'Creep', addedBy: 'Aaron', watchedBy: [] },
  { title: 'Easy A', addedBy: 'Aaron', watchedBy: [] },
  { title: 'The Lego Movie', addedBy: 'Aaron', watchedBy: [] },
  { title: 'Key and Peele', addedBy: 'Aaron', watchedBy: [] },
  { title: 'Beetlejuice', addedBy: 'Aaron', watchedBy: [] },
];

// Creates the Gist file with default movies if it doesn't exist
const createGistFileWithDefaults = async (): Promise<Movie[]> => {
  console.log('[movieService] Creating Gist file with default movies...');
  
  const moviesToSave: Movie[] = DEFAULT_MOVIES.map((movie) => ({
    ...movie,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }));

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
            content: JSON.stringify(moviesToSave, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('[movieService] Failed to create Gist file. API error:', errorBody);
      throw new Error(`Failed to create Gist file: ${response.status} - ${JSON.stringify(errorBody)}`);
    }

    console.log('[movieService] Successfully created Gist file with default movies');
    return moviesToSave;
  } catch (error) {
    console.error('[movieService] Error creating Gist file:', error);
    throw error;
  }
};

// Fetches the raw content of the Gist file.
export const getMovies = async (): Promise<Movie[]> => {
  console.log('[movieService] Fetching movies from Gist...');
  
  // Validate configuration before making API calls
  if (!GIST_ID || !GIST_TOKEN) {
    const error = new Error(
      `Missing Gist configuration: ${!GIST_ID ? 'GIST_ID' : ''} ${!GIST_TOKEN ? 'GIST_TOKEN' : ''}`
    );
    console.error('[movieService]', error.message);
    throw error;
  }

  try {
    const response = await fetch(GIST_API_URL, {
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-cache', // Ensure we always get the latest version
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[movieService] GitHub API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`GitHub API responded with ${response.status}: ${response.statusText}`);
    }

    const gist = await response.json();
    const file = gist.files[GIST_FILENAME];

    if (!file) {
      console.warn(`[movieService] File "${GIST_FILENAME}" not found in Gist. Creating it with default movies...`);
      return await createGistFileWithDefaults();
    }

    if (!file.content) {
      console.warn('[movieService] Gist file exists but is empty. Creating default movies...');
      return await createGistFileWithDefaults();
    }

    const movies = JSON.parse(file.content);
    console.log(`[movieService] Successfully fetched ${movies.length} movies from Gist`);
    return movies;
  } catch (error) {
    console.error('[movieService] Error fetching movies from Gist:', error);
    if (error instanceof Error) {
      console.error('[movieService] Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
};

// Saves the entire movie list back to the Gist, overwriting the previous content.
export const saveMovies = async (movies: Movie[]): Promise<void> => {
  console.log(`[movieService] Saving ${movies.length} movies to Gist...`);
  
  // Validate configuration before making API calls
  if (!GIST_ID || !GIST_TOKEN) {
    const error = new Error(
      `Missing Gist configuration: ${!GIST_ID ? 'GIST_ID' : ''} ${!GIST_TOKEN ? 'GIST_TOKEN' : ''}`
    );
    console.error('[movieService]', error.message);
    throw error;
  }

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
      console.error('[movieService] GitHub API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
      });
      throw new Error(`GitHub API responded with ${response.status}: ${JSON.stringify(errorBody)}`);
    }

    console.log('[movieService] Successfully saved movies to Gist');
  } catch (error) {
    console.error('[movieService] Error saving movies to Gist:', error);
    if (error instanceof Error) {
      console.error('[movieService] Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
};
