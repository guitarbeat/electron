import { z } from 'zod';

export const agentActorSchema = z.enum(['Aaron', 'Electra']);

export const movieSuggestionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  suggestedBy: z.string().trim().min(1).max(80).default('Guest'),
  reason: z.string().trim().max(500).optional(),
  imdbID: z.string().trim().max(40).optional(),
  type: z.enum(['movie', 'series']).optional(),
}).strict();

export const placeSuggestionSchema = z.object({
  name: z.string().trim().min(1).max(200),
  suggestedBy: z.string().trim().min(1).max(80).default('Guest'),
  notes: z.string().trim().max(500).optional(),
  category: z.string().trim().max(80).optional(),
  description: z.string().trim().max(1000).optional(),
}).strict();

export const AGENT_ACTIONS = {
  addMovie: ['movies', 'add_movie'],
  addMovies: ['movies', 'add_movies'],
  renameMovie: ['movies', 'rename_movie'],
  toggleWatched: ['movies', 'toggle_watched'],
  deleteMovie: ['movies', 'delete_movie'],
  restoreMovie: ['movies', 'restore_movie'],
  updateMovieMetadata: ['movies', 'update_metadata'],
  addMessage: ['messages', 'add_message'],
  deleteMessage: ['messages', 'delete_message'],
  addMemory: ['memories', 'add_memory'],
  updateMemory: ['memories', 'update_memory'],
  updateMemoriesBatch: ['memories', 'update_memories_batch'],
  deleteMemory: ['memories', 'delete_memory'],
  toggleMemoryPin: ['memories', 'toggle_memory_pin'],
  addPlace: ['places', 'add_place'],
  updatePlace: ['places', 'update_place'],
  removePlace: ['places', 'remove_place'],
  markPlaceVisited: ['places', 'mark_visited'],
  markPlaceUnvisited: ['places', 'mark_unvisited'],
  addMovieSuggestion: ['suggestions', 'add_suggestion'],
  acceptMovieSuggestion: ['suggestions', 'accept_suggestion'],
  rejectMovieSuggestion: ['suggestions', 'reject_suggestion'],
  addPlaceSuggestion: ['placeSuggestions', 'add_place_suggestion'],
  acceptPlaceSuggestion: ['placeSuggestions', 'accept_place_suggestion'],
  rejectPlaceSuggestion: ['placeSuggestions', 'reject_place_suggestion'],
  replaceQuiz: ['quiz', 'replace_quiz'],
  startMatchmaker: ['matchmaker', 'start_game'],
  swipeMatchmaker: ['matchmaker', 'swipe'],
  undoMatchmakerSwipe: ['matchmaker', 'undo'],
  endMatchmaker: ['matchmaker', 'end_game'],
  setPin: ['pins', 'set_pin'],
  removePin: ['pins', 'remove_pin'],
  recordSpinPick: ['spinHistory', 'record_pick'],
  recordDailySpin: ['dailySpin', 'record_daily'],
} as const;

export type AgentActionName = keyof typeof AGENT_ACTIONS;
export const agentActionNameSchema = z.enum(Object.keys(AGENT_ACTIONS) as [AgentActionName, ...AgentActionName[]]);

export const agentActionRequestSchema = z.object({
  actor: agentActorSchema,
  action: agentActionNameSchema,
  input: z.record(z.unknown()).default({}),
  confirmationToken: z.string().min(1).max(4096).optional(),
}).strict();

export const CONFIRMATION_ACTIONS = new Set<AgentActionName>([
  'deleteMovie', 'deleteMessage', 'deleteMemory', 'removePlace', 'setPin', 'removePin',
]);

export const PRIVATE_SCOPES = [
  'movies', 'messages', 'memories', 'places', 'suggestions', 'placeSuggestions',
  'quiz', 'matchmaker', 'pins', 'spinHistory', 'dailySpin',
] as const;

export const isPrivateScope = (value: string): value is (typeof PRIVATE_SCOPES)[number] =>
  PRIVATE_SCOPES.includes(value as (typeof PRIVATE_SCOPES)[number]);
