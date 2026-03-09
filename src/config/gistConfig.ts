// How to get a token:
// 1. Go to https://github.com/settings/tokens/new
// 2. Select "Tokens (classic)".
// 3. Give it a name (e.g., "Movie List App").
// 4. Set an expiration date.
// 5. Check the "gist" scope.
// 6. Click "Generate token" and paste the token string below.
// 7. Add it to your .env file as VITE_GIST_TOKEN
const env = (import.meta.env || {}) as any;
// Trim and strip optional surrounding quotes (some .env parsers include them)
const clean = (s: string) => (s || '').trim().replace(/^["']|["']$/g, '');
// Security: Never hardcode tokens here. They must be injected via environment variables.
const GIST_TOKEN = clean(env.VITE_GIST_TOKEN || ''); // Must be set in .env

// The ID of the Gist where the movie list is stored.
// It's the unique part of the Gist's URL.
const GIST_ID = clean(env.VITE_GIST_ID || '');

// The API URL for Gist operations
const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;

// The filename inside your Gist that contains the movie data.
const GIST_FILENAME = 'movielist.json';

// The filename for the quiz data.
const GIST_QUIZ_FILENAME = 'quiz.json';

// The filename for movie suggestions data.
const GIST_SUGGESTIONS_FILENAME = 'suggestions.json';

// The filename for shared memory wall data.
const GIST_MEMORIES_FILENAME = 'memories.json';

// The filename for the matchmaker game data.
const GIST_MATCHMAKER_FILENAME = 'matchmaker.json';

// The filename for places we want to go.
const GIST_PLACES_FILENAME = 'places.json';

export {
  GIST_TOKEN,
  GIST_ID,
  GIST_API_URL,
  GIST_FILENAME,
  GIST_QUIZ_FILENAME,
  GIST_SUGGESTIONS_FILENAME,
  GIST_MEMORIES_FILENAME,
  GIST_MATCHMAKER_FILENAME,
  GIST_PLACES_FILENAME,
};
