import { AGENT_ACTIONS } from './agentContracts.js';

const actionInputs: Record<keyof typeof AGENT_ACTIONS, { description: string; inputExample: Record<string, unknown> }> = {
  addMovie: { description: 'Add one movie or series to the watchlist.', inputExample: { id: 'movie-123', title: 'Arrival', mediaType: 'movie' } },
  addMovies: { description: 'Add a batch of movies or series.', inputExample: { items: [{ id: 'movie-123', title: 'Arrival' }] } },
  renameMovie: { description: 'Rename an existing watchlist item.', inputExample: { movieId: 'movie-123', title: 'Arrival (2016)' } },
  toggleWatched: { description: 'Toggle the declared actor in a movie watched list.', inputExample: { movieId: 'movie-123' } },
  deleteMovie: { description: 'Delete a movie. Requires confirmation.', inputExample: { movieId: 'movie-123' } },
  restoreMovie: { description: 'Restore a complete previously deleted movie record.', inputExample: { movie: { id: 'movie-123', title: 'Arrival', addedBy: 'Aaron', watchedBy: [], createdAt: '2026-01-01T00:00:00.000Z' } } },
  updateMovieMetadata: { description: 'Update metadata for an existing movie.', inputExample: { movieId: 'movie-123', metadata: { year: '2016', genre: 'Drama, Sci-Fi' } } },
  addMessage: { description: 'Post a household message as the declared actor.', inputExample: { content: 'Movie at 8?' } },
  deleteMessage: { description: 'Delete a message owned by the declared actor. Requires confirmation.', inputExample: { messageId: 'message-123' } },
  addMemory: { description: 'Add a shared movie memory.', inputExample: { movieTitle: 'Arrival', note: 'Our first watch.' } },
  updateMemory: { description: 'Update a memory owned by the declared actor.', inputExample: { memoryId: 'memory-123', updates: { note: 'Updated note.' } } },
  updateMemoriesBatch: { description: 'Update multiple memories owned by the declared actor.', inputExample: { updates: [{ memoryId: 'memory-123', updates: { note: 'Updated note.' } }] } },
  deleteMemory: { description: 'Delete a memory owned by the declared actor. Requires confirmation.', inputExample: { memoryId: 'memory-123' } },
  toggleMemoryPin: { description: 'Toggle whether a memory is pinned.', inputExample: { memoryId: 'memory-123' } },
  addPlace: { description: 'Add a date place.', inputExample: { id: 'place-123', name: 'Museum' } },
  updatePlace: { description: 'Update a date place.', inputExample: { placeId: 'place-123', updates: { notes: 'Open late.' } } },
  removePlace: { description: 'Remove a date place. Requires confirmation.', inputExample: { placeId: 'place-123' } },
  markPlaceVisited: { description: 'Mark a place visited now.', inputExample: { placeId: 'place-123' } },
  markPlaceUnvisited: { description: 'Clear a place visited date.', inputExample: { placeId: 'place-123' } },
  addMovieSuggestion: { description: 'Create an authenticated movie suggestion.', inputExample: { id: 'suggestion-123', title: 'Moon' } },
  acceptMovieSuggestion: { description: 'Accept a pending movie suggestion.', inputExample: { suggestionId: 'suggestion-123' } },
  rejectMovieSuggestion: { description: 'Reject a pending movie suggestion.', inputExample: { suggestionId: 'suggestion-123' } },
  addPlaceSuggestion: { description: 'Create an authenticated place suggestion.', inputExample: { id: 'suggestion-123', name: 'Museum' } },
  acceptPlaceSuggestion: { description: 'Accept a pending place suggestion.', inputExample: { suggestionId: 'suggestion-123' } },
  rejectPlaceSuggestion: { description: 'Reject a pending place suggestion.', inputExample: { suggestionId: 'suggestion-123' } },
  replaceQuiz: { description: 'Replace the compatibility quiz with a complete valid quiz payload.', inputExample: { quizData: { questions: [], characterDescriptions: {}, neitherDescription: '' } } },
  startMatchmaker: { description: 'Start a matchmaker game from movie IDs.', inputExample: { id: 'game-123', movieIds: ['movie-123'] } },
  swipeMatchmaker: { description: 'Record a like or dislike in the active game.', inputExample: { movieId: 'movie-123', liked: true } },
  undoMatchmakerSwipe: { description: 'Undo the declared actor most recent swipe.', inputExample: {} },
  endMatchmaker: { description: 'End the active matchmaker game.', inputExample: {} },
  setPin: { description: 'Set the declared actor four-digit PIN. Requires confirmation; never expose the PIN elsewhere.', inputExample: { pin: '1234' } },
  removePin: { description: 'Remove the declared actor PIN. Requires confirmation.', inputExample: {} },
  recordSpinPick: { description: 'Append a movie title to spin history.', inputExample: { title: 'Arrival' } },
  recordDailySpin: { description: 'Record a daily wheel outcome.', inputExample: { movieId: 'movie-123', movieTitle: 'Arrival' } },
};

const errorResponse = {
  description: 'Structured error',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
};

export const buildAgentOpenApiDocument = (origin: string): Record<string, unknown> => ({
  openapi: '3.1.0',
  info: {
    title: 'Electron Agent API',
    version: '1.0.0',
    description: 'Read curated movie-night data, submit suggestions, and—when authorized—operate the shared Electron household app. Destructive and PIN actions require a preview-and-confirm round trip.',
  },
  servers: [{ url: `${origin}/api/agent/v1` }],
  'x-electron-actions': actionInputs,
  paths: {
    '/catalog/{resource}': {
      get: {
        operationId: 'listPublicCatalog',
        description: 'List sanitized public movies, places, or suggestions. Use this for discovery and recommendations; it never returns messages, memories, profile activity, or PIN data.',
        parameters: [
          { name: 'resource', in: 'path', required: true, schema: { type: 'string', enum: ['movies', 'places', 'suggestions'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: { '200': { description: 'Paginated public catalog' }, '422': errorResponse },
      },
    },
    '/suggestions/{kind}': {
      post: {
        operationId: 'submitPublicSuggestion',
        description: 'Submit a pending movie or place suggestion without authentication. Do not use this to modify existing records. Requests are validated, deduplicated, and rate limited.',
        parameters: [{ name: 'kind', in: 'path', required: true, schema: { type: 'string', enum: ['movies', 'places'] } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Suggestion created' }, '409': errorResponse, '422': errorResponse, '429': errorResponse },
      },
    },
    '/private/{scope}': {
      get: {
        operationId: 'readPrivateState',
        security: [{ bearerAuth: [] }],
        description: 'Read an authenticated state scope. Set X-Electron-Actor to Aaron or Electra. PIN values and hashes are never returned.',
        parameters: [
          { name: 'scope', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'X-Electron-Actor', in: 'header', required: true, schema: { $ref: '#/components/schemas/Actor' } },
        ],
        responses: { '200': { description: 'Private state data' }, '401': errorResponse, '422': errorResponse },
      },
    },
    '/actions': {
      post: {
        operationId: 'performHouseholdAction',
        security: [{ bearerAuth: [] }],
        description: 'Perform a typed household action as Aaron or Electra. For delete and PIN actions, first omit confirmationToken, show the returned summary to the user, then repeat the identical actor/action/input with the short-lived token.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ActionRequest' } } },
        },
        responses: { '200': { description: 'Action applied' }, '202': { description: 'Confirmation required' }, '401': errorResponse, '409': errorResponse, '422': errorResponse },
      },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } },
    schemas: {
      Actor: { type: 'string', enum: ['Aaron', 'Electra'], description: 'Caller-declared actor; the shared household token authorizes either value.' },
      ActionRequest: {
        type: 'object', required: ['actor', 'action', 'input'], additionalProperties: false,
        properties: {
          actor: { $ref: '#/components/schemas/Actor' },
          action: { type: 'string', enum: Object.keys(AGENT_ACTIONS) },
          input: { type: 'object', additionalProperties: true },
          confirmationToken: { type: 'string', description: 'Only send after presenting a confirmation_required summary to the user.' },
        },
        examples: [{ actor: 'Aaron', action: 'addMovie', input: { id: 'movie-example', title: 'Arrival' } }],
      },
      Error: {
        type: 'object', required: ['error'],
        properties: { error: { type: 'object', required: ['code', 'message', 'requestId'], properties: {
          code: { type: 'string' }, message: { type: 'string' }, details: {}, requestId: { type: 'string' },
        } } },
      },
    },
  },
});
