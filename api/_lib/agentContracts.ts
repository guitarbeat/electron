import { z } from "zod";

export const agentActorSchema = z.enum(["Aaron", "Electra"]);

export const movieSuggestionSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    suggestedBy: z.string().trim().min(1).max(80).default("Guest"),
    reason: z.string().trim().max(500).optional(),
    imdbID: z.string().trim().max(40).optional(),
    type: z.enum(["movie", "series"]).optional(),
  })
  .strict();

export const placeSuggestionSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    suggestedBy: z.string().trim().min(1).max(80).default("Guest"),
    notes: z.string().trim().max(500).optional(),
    category: z.string().trim().max(80).optional(),
    description: z.string().trim().max(1000).optional(),
  })
  .strict();

export const AGENT_ACTIONS = {
  addMovie: {
    scope: "movies",
    op: "add_movie",
    description: "Add one movie or series to the watchlist.",
    inputExample: { id: "movie-123", title: "Arrival", mediaType: "movie" },
  },
  addMovies: {
    scope: "movies",
    op: "add_movies",
    description: "Add a batch of movies or series.",
    inputExample: { items: [{ id: "movie-123", title: "Arrival" }] },
  },
  editMovie: {
    scope: "movies",
    op: "edit_movie",
    description: "Edit an existing watchlist item (title or custom poster).",
    inputExample: {
      movieId: "movie-123",
      title: "Arrival (2016)",
      customPosterUrl: "https://example.com/poster.jpg",
    },
  },
  toggleWatched: {
    scope: "movies",
    op: "toggle_watched",
    description: "Toggle the declared actor in a movie watched list.",
    inputExample: { movieId: "movie-123" },
  },
  deleteMovie: {
    scope: "movies",
    op: "delete_movie",
    requiresConfirmation: true,
    description: "Delete a movie. Requires confirmation.",
    inputExample: { movieId: "movie-123" },
  },
  restoreMovie: {
    scope: "movies",
    op: "restore_movie",
    description: "Restore a complete previously deleted movie record.",
    inputExample: {
      movie: {
        id: "movie-123",
        title: "Arrival",
        addedBy: "Aaron",
        watchedBy: [],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    },
  },
  updateMovieMetadata: {
    scope: "movies",
    op: "update_metadata",
    description: "Update metadata for an existing movie.",
    inputExample: {
      movieId: "movie-123",
      metadata: { year: "2016", genre: "Drama, Sci-Fi" },
    },
  },
  addMessage: {
    scope: "messages",
    op: "add_message",
    description: "Post a household message as the declared actor.",
    inputExample: { content: "Movie at 8?" },
  },
  deleteMessage: {
    scope: "messages",
    op: "delete_message",
    requiresConfirmation: true,
    description:
      "Delete a message owned by the declared actor. Requires confirmation.",
    inputExample: { messageId: "message-123" },
  },
  addPlace: {
    scope: "places",
    op: "add_place",
    description: "Add a date place.",
    inputExample: { id: "place-123", name: "Museum" },
  },
  updatePlace: {
    scope: "places",
    op: "update_place",
    description: "Update a date place.",
    inputExample: { placeId: "place-123", updates: { notes: "Open late." } },
  },
  removePlace: {
    scope: "places",
    op: "remove_place",
    requiresConfirmation: true,
    description: "Remove a date place. Requires confirmation.",
    inputExample: { placeId: "place-123" },
  },
  markPlaceVisited: {
    scope: "places",
    op: "mark_visited",
    description: "Mark a place visited now.",
    inputExample: { placeId: "place-123" },
  },
  markPlaceUnvisited: {
    scope: "places",
    op: "mark_unvisited",
    description: "Clear a place visited date.",
    inputExample: { placeId: "place-123" },
  },
  addMovieSuggestion: {
    scope: "suggestions",
    op: "add_suggestion",
    description: "Create an authenticated movie suggestion.",
    inputExample: { id: "suggestion-123", title: "Moon" },
  },
  acceptMovieSuggestion: {
    scope: "suggestions",
    op: "accept_suggestion",
    description: "Accept a pending movie suggestion.",
    inputExample: { suggestionId: "suggestion-123" },
  },
  rejectMovieSuggestion: {
    scope: "suggestions",
    op: "reject_suggestion",
    description: "Reject a pending movie suggestion.",
    inputExample: { suggestionId: "suggestion-123" },
  },
  addPlaceSuggestion: {
    scope: "placeSuggestions",
    op: "add_place_suggestion",
    description: "Create an authenticated place suggestion.",
    inputExample: { id: "suggestion-123", name: "Museum" },
  },
  acceptPlaceSuggestion: {
    scope: "placeSuggestions",
    op: "accept_place_suggestion",
    description: "Accept a pending place suggestion.",
    inputExample: { suggestionId: "suggestion-123" },
  },
  rejectPlaceSuggestion: {
    scope: "placeSuggestions",
    op: "reject_place_suggestion",
    description: "Reject a pending place suggestion.",
    inputExample: { suggestionId: "suggestion-123" },
  },
  replaceQuiz: {
    scope: "quiz",
    op: "replace_quiz",
    description:
      "Replace the compatibility quiz with a complete valid quiz payload.",
    inputExample: {
      quizData: {
        questions: [],
        characterDescriptions: {},
        neitherDescription: "",
      },
    },
  },
  startMatchmaker: {
    scope: "matchmaker",
    op: "start_game",
    description: "Start a matchmaker game from movie IDs.",
    inputExample: { id: "game-123", movieIds: ["movie-123"] },
  },
  swipeMatchmaker: {
    scope: "matchmaker",
    op: "swipe",
    description: "Record a like or dislike in the active game.",
    inputExample: { movieId: "movie-123", liked: true },
  },
  undoMatchmakerSwipe: {
    scope: "matchmaker",
    op: "undo",
    description: "Undo the declared actor most recent swipe.",
    inputExample: {},
  },
  endMatchmaker: {
    scope: "matchmaker",
    op: "end_game",
    description: "End the active matchmaker game.",
    inputExample: {},
  },
  setPin: {
    scope: "pins",
    op: "set_pin",
    requiresConfirmation: true,
    description:
      "Set the declared actor four-digit PIN. Requires confirmation; never expose the PIN elsewhere.",
    inputExample: { pin: "1234" },
  },
  removePin: {
    scope: "pins",
    op: "remove_pin",
    requiresConfirmation: true,
    description: "Remove the declared actor PIN. Requires confirmation.",
    inputExample: {},
  },
  recordSpinPick: {
    scope: "spinHistory",
    op: "record_pick",
    description: "Append a movie title to spin history.",
    inputExample: { title: "Arrival" },
  },
  recordDailySpin: {
    scope: "dailySpin",
    op: "record_daily",
    description: "Record a daily wheel outcome.",
    inputExample: { movieId: "movie-123", movieTitle: "Arrival" },
  },
} as const;

export type AgentActionName = keyof typeof AGENT_ACTIONS;
export const agentActionNameSchema = z.enum(
  Object.keys(AGENT_ACTIONS) as [AgentActionName, ...AgentActionName[]],
);

export const agentActionRequestSchema = z
  .object({
    actor: agentActorSchema,
    action: agentActionNameSchema,
    input: z.record(z.unknown()).default({}),
    confirmationToken: z.string().min(1).max(4096).optional(),
  })
  .strict();

export const PRIVATE_SCOPES = [
  "movies",
  "messages",
  "places",
  "suggestions",
  "placeSuggestions",
  "quiz",
  "matchmaker",
  "pins",
  "spinHistory",
  "dailySpin",
] as const;

export const isPrivateScope = (
  value: string,
): value is (typeof PRIVATE_SCOPES)[number] =>
  PRIVATE_SCOPES.includes(value as (typeof PRIVATE_SCOPES)[number]);
