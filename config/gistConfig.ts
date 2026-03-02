// How to get a token:
// 1. Go to https://github.com/settings/tokens/new
// 2. Select "Tokens (classic)".
// 3. Give it a name (e.g., "Movie List App").
// 4. Set an expiration date.
// 5. Check the "gist" scope.
// 6. Click "Generate token" and paste the token string below.
// 7. Add it to your .env file as VITE_GIST_TOKEN
// Ensure tests have mock tokens
const isTest = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.argv.some(a => a.includes('--test')));

const env = (import.meta.env || (typeof process !== 'undefined' ? process.env : {})) as any;
// Trim and strip optional surrounding quotes (some .env parsers include them)
const clean = (s: string) => (s || '').trim().replace(/^["']|["']$/g, '');
const GIST_TOKEN = clean(env.VITE_GIST_TOKEN || (isTest ? 'test_token' : '')); // Must be set in .env

// The ID of the Gist where the movie list is stored.
// It's the unique part of the Gist's URL.
const GIST_ID = clean(env.VITE_GIST_ID || (isTest ? 'test_id' : ''));

// The API URL for Gist operations
const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;

// The filename inside your Gist that contains the movie data.
const GIST_FILENAME = 'movielist.json';

// The filename for the message board data.
const GIST_MESSAGES_FILENAME = 'messages.json';

// The filename for the quiz data.
const GIST_QUIZ_FILENAME = 'quiz.json';

// The filename for movie suggestions data.
const GIST_SUGGESTIONS_FILENAME = 'suggestions.json';

// The filename for shared memory wall data.
const GIST_MEMORIES_FILENAME = 'memories.json';

// The filename for the daily spin data.
const GIST_DAILY_SPIN_FILENAME = 'dailyspin.json';

// The filename for the spin history data.
const GIST_SPIN_HISTORY_FILENAME = 'spinhistory.json';

// The filename for the matchmaker game data.
const GIST_MATCHMAKER_FILENAME = 'matchmaker.json';

// The filename for places we want to go.
const GIST_PLACES_FILENAME = 'places.json';

export {
  GIST_TOKEN,
  GIST_ID,
  GIST_API_URL,
  GIST_FILENAME,
  GIST_MESSAGES_FILENAME,
  GIST_QUIZ_FILENAME,
  GIST_SUGGESTIONS_FILENAME,
  GIST_MEMORIES_FILENAME,
  GIST_DAILY_SPIN_FILENAME,
  GIST_SPIN_HISTORY_FILENAME,
  GIST_MATCHMAKER_FILENAME,
  GIST_PLACES_FILENAME,
};
