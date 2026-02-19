// How to get a token:
// 1. Go to https://github.com/settings/tokens/new
// 2. Select "Tokens (classic)".
// 3. Give it a name (e.g., "Movie List App").
// 4. Set an expiration date.
// 5. Check the "gist" scope.
// 6. Click "Generate token" and paste the token string below.
// 7. Add it to your .env file as VITE_GIST_TOKEN
const env = (import.meta.env || {}) as any;
const GIST_TOKEN = env.VITE_GIST_TOKEN || '';

// The ID of the Gist where the movie list is stored.
// It's the unique part of the Gist's URL.
const GIST_ID = env.VITE_GIST_ID || '';

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

export {
  GIST_TOKEN,
  GIST_ID,
  GIST_FILENAME,
  GIST_MESSAGES_FILENAME,
  GIST_QUIZ_FILENAME,
  GIST_SUGGESTIONS_FILENAME,
  GIST_MEMORIES_FILENAME,
};
