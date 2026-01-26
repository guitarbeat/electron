// DANGER DANGER DANGER DANGER DANGER DANGER DANGER DANGER DANGER
//
// GITHUB PERSONAL ACCESS TOKEN
//
// This token gives write access to your Gists.
// Exposing it in a client-side application is a SIGNIFICANT SECURITY RISK.
// Anyone who inspects your site's source code can find this token and use it.
//
// This is acceptable ONLY for a private, personal project between trusted users.
//
// DO NOT COMMIT THIS FILE TO A PUBLIC REPOSITORY if it contains a real token.
//
// DANGER DANGER DANGER DANGER DANGER DANGER DANGER DANGER DANGER

// How to get a token:
// 1. Go to https://github.com/settings/tokens/new
// 2. Select "Tokens (classic)".
// 3. Give it a name (e.g., "Movie List App").
// 4. Set an expiration date.
// 5. Check the "gist" scope.
// 6. Click "Generate token" and paste the token string below.
const GIST_TOKEN = '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';

// The ID of the Gist where the movie list is stored.
// It's the unique part of the Gist's URL.
const GIST_ID = 'ba250f944e3e9e71c0d669060254eab2';

// The filename inside your Gist that contains the movie data.
const GIST_FILENAME = 'movielist.json';

// The filename for the message board data.
const GIST_MESSAGES_FILENAME = 'messages.json';

// The filename for the quiz data.
const GIST_QUIZ_FILENAME = 'quiz.json';

// The filename for movie suggestions data.
const GIST_SUGGESTIONS_FILENAME = 'suggestions.json';

export {
  GIST_TOKEN,
  GIST_ID,
  GIST_FILENAME,
  GIST_MESSAGES_FILENAME,
  GIST_QUIZ_FILENAME,
  GIST_SUGGESTIONS_FILENAME,
};
