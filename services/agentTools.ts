import {
  stripControlCharacters,
  MAX_AUTHOR_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_MOVIE_TITLE_LENGTH,
} from '../config/security';
import type { DailySpin, Movie, User } from '../types';
import { deleteDailySpin, getTodaySpin, saveDailySpin } from './dailySpinService';
import {
  addMemory,
  deleteMemory,
  getMemories,
  toggleMemoryPin,
  updateMemory,
} from './memoryService';
import { getMessages, saveMessages } from './messageService';
import { getMovies, saveMovies } from './movieService';
import { getSuggestions, saveSuggestions } from './suggestionService';
import {
  deleteSpinEntry,
  getSpinHistory,
  updateSpinEntry,
  upsertTodaySpinEntry,
} from './spinHistoryService';

export type AgentToolName =
  | 'movies.list'
  | 'movies.add'
  | 'movies.toggleWatched'
  | 'movies.delete'
  | 'memories.list'
  | 'memories.add'
  | 'memories.update'
  | 'memories.delete'
  | 'memories.togglePin'
  | 'messages.add'
  | 'suggestions.add'
  | 'suggestions.accept'
  | 'suggestions.reject'
  | 'spin.getToday'
  | 'spin.setToday'
  | 'spin.clearToday'
  | 'spinHistory.list'
  | 'spinHistory.update'
  | 'spinHistory.delete';

export interface AgentToolCall {
  id: string;
  name: AgentToolName;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any;
}

export interface AgentToolResult {
  id: string;
  name: AgentToolName;
  ok: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
  error?: string;
}

const requireUser = (currentUser: User | null): User => {
  if (!currentUser) {
    throw new Error('No current user selected');
  }
  return currentUser;
};

const asString = (value: unknown): string => {
  if (typeof value !== 'string') {
    throw new Error('Expected string');
  }
  return value;
};

const asOptionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  return asString(value);
};

const asOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error('Expected number');
  }
  return value;
};

export const runAgentToolCall = async (
  call: AgentToolCall,
  currentUser: User | null
): Promise<AgentToolResult> => {
  try {
    switch (call.name) {
      case 'movies.list': {
        const movies = await getMovies();
        return { id: call.id, name: call.name, ok: true, result: movies };
      }
      case 'movies.add': {
        const user = requireUser(currentUser);
        const title = stripControlCharacters(asString(call.args?.title));
        if (!title) throw new Error('Movie title cannot be empty');
        if (title.length > MAX_MOVIE_TITLE_LENGTH) {
          throw new Error(`Movie title exceeds max length (${MAX_MOVIE_TITLE_LENGTH})`);
        }
        const latest = await getMovies();
        const nextMovie: Movie = {
          id: crypto.randomUUID(),
          title,
          addedBy: user,
          watchedBy: [],
          createdAt: new Date().toISOString(),
        };
        await saveMovies([...latest, nextMovie]);
        return { id: call.id, name: call.name, ok: true, result: nextMovie };
      }
      case 'movies.toggleWatched': {
        const user = requireUser(currentUser);
        const movieId = asString(call.args?.movieId);
        const latest = await getMovies();
        const next = latest.map((movie) => {
          if (movie.id !== movieId) return movie;
          const isWatched = movie.watchedBy.includes(user);
          const watchedBy = isWatched
            ? movie.watchedBy.filter((u) => u !== user)
            : [...movie.watchedBy, user];
          return { ...movie, watchedBy };
        });
        await saveMovies(next);
        return { id: call.id, name: call.name, ok: true, result: { movieId } };
      }
      case 'movies.delete': {
        const movieId = asString(call.args?.movieId);
        const latest = await getMovies();
        await saveMovies(latest.filter((movie) => movie.id !== movieId));
        return { id: call.id, name: call.name, ok: true, result: { movieId } };
      }
      case 'memories.list': {
        const memories = await getMemories();
        return { id: call.id, name: call.name, ok: true, result: memories };
      }
      case 'memories.add': {
        const movieId = asOptionalString(call.args?.movieId);
        const movieTitle = stripControlCharacters(asString(call.args?.movieTitle));
        const author = stripControlCharacters(asString(call.args?.author));
        const note = stripControlCharacters(asString(call.args?.note));
        const created = await addMemory(movieId, movieTitle, author, note);
        return { id: call.id, name: call.name, ok: true, result: created };
      }
      case 'memories.update': {
        const memoryId = asString(call.args?.memoryId);
        const note =
          call.args?.note !== undefined ? stripControlCharacters(asString(call.args?.note)) : undefined;
        const movieId = asOptionalString(call.args?.movieId);
        const movieTitle =
          call.args?.movieTitle !== undefined
            ? stripControlCharacters(asString(call.args?.movieTitle))
            : undefined;
        const updated = await updateMemory(memoryId, { note, movieId, movieTitle });
        return { id: call.id, name: call.name, ok: true, result: updated };
      }
      case 'memories.delete': {
        const memoryId = asString(call.args?.memoryId);
        await deleteMemory(memoryId);
        return { id: call.id, name: call.name, ok: true, result: { memoryId } };
      }
      case 'memories.togglePin': {
        const memoryId = asString(call.args?.memoryId);
        const updated = await toggleMemoryPin(memoryId);
        return { id: call.id, name: call.name, ok: true, result: updated };
      }
      case 'messages.add': {
        const author = stripControlCharacters(asString(call.args?.author));
        const content = stripControlCharacters(asString(call.args?.content));
        if (!content) throw new Error('Message cannot be empty');
        if (content.length > MAX_MESSAGE_LENGTH) {
          throw new Error(`Message exceeds max length (${MAX_MESSAGE_LENGTH})`);
        }
        if (author.length > MAX_AUTHOR_LENGTH) {
          throw new Error(`Author exceeds max length (${MAX_AUTHOR_LENGTH})`);
        }
        const latest = await getMessages();
        const newMessage = {
          id: crypto.randomUUID(),
          author: author || 'Anonymous',
          content,
          createdAt: new Date().toISOString(),
        };
        await saveMessages([newMessage, ...latest]);
        return { id: call.id, name: call.name, ok: true, result: newMessage };
      }
      case 'suggestions.add': {
        const title = stripControlCharacters(asString(call.args?.title));
        const suggestedBy = stripControlCharacters(asString(call.args?.suggestedBy));
        const reasonRaw = call.args?.reason;
        const reason = reasonRaw ? stripControlCharacters(asString(reasonRaw)) : undefined;

        if (!title) throw new Error('Suggestion title cannot be empty');
        if (!suggestedBy) throw new Error('suggestedBy cannot be empty');

        const latest = await getSuggestions();
        const newSuggestion = {
          id: crypto.randomUUID(),
          title,
          suggestedBy,
          reason,
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
        };
        await saveSuggestions([...latest, newSuggestion]);
        return { id: call.id, name: call.name, ok: true, result: newSuggestion };
      }
      case 'suggestions.accept': {
        const user = requireUser(currentUser);
        const suggestionId = asString(call.args?.suggestionId);
        const suggestions = await getSuggestions();
        const suggestion = suggestions.find((s) => s.id === suggestionId);
        if (!suggestion) throw new Error('Suggestion not found');

        const updatedSuggestions = suggestions.map((s) =>
          s.id === suggestionId
            ? {
                ...s,
                status: 'accepted' as const,
                respondedAt: new Date().toISOString(),
                respondedBy: user,
              }
            : s
        );
        await saveSuggestions(updatedSuggestions);

        const movies = await getMovies();
        const newMovie: Movie = {
          id: crypto.randomUUID(),
          title: suggestion.title,
          addedBy: user,
          watchedBy: [],
          createdAt: new Date().toISOString(),
        };
        await saveMovies([newMovie, ...movies]);

        return {
          id: call.id,
          name: call.name,
          ok: true,
          result: { suggestionId, movieId: newMovie.id },
        };
      }
      case 'suggestions.reject': {
        const user = requireUser(currentUser);
        const suggestionId = asString(call.args?.suggestionId);
        const suggestions = await getSuggestions();
        const updatedSuggestions = suggestions.map((s) =>
          s.id === suggestionId
            ? {
                ...s,
                status: 'rejected' as const,
                respondedAt: new Date().toISOString(),
                respondedBy: user,
              }
            : s
        );
        await saveSuggestions(updatedSuggestions);
        return { id: call.id, name: call.name, ok: true, result: { suggestionId } };
      }
      case 'spin.getToday': {
        const todaySpin = await getTodaySpin();
        return { id: call.id, name: call.name, ok: true, result: todaySpin };
      }
      case 'spin.setToday': {
        const user = requireUser(currentUser);
        const movieId = asString(call.args?.movieId);
        const movieTitle = stripControlCharacters(asString(call.args?.movieTitle));
        const today = new Date().toISOString().split('T')[0];
        const dailySpin: DailySpin = {
          date: today,
          movieId,
          movieTitle,
          spunBy: user,
          createdAt: new Date().toISOString(),
        };
        await saveDailySpin(dailySpin);
        await upsertTodaySpinEntry(today, user, movieId, movieTitle);
        return { id: call.id, name: call.name, ok: true, result: dailySpin };
      }
      case 'spin.clearToday': {
        await deleteDailySpin();
        return { id: call.id, name: call.name, ok: true, result: { cleared: true } };
      }
      case 'spinHistory.list': {
        const limit = asOptionalNumber(call.args?.limit);
        const history = await getSpinHistory();
        return {
          id: call.id,
          name: call.name,
          ok: true,
          result: typeof limit === 'number' ? history.slice(0, Math.max(0, limit)) : history,
        };
      }
      case 'spinHistory.update': {
        const entryId = asString(call.args?.entryId);
        const movieId = asOptionalString(call.args?.movieId);
        const movieTitle =
          call.args?.movieTitle !== undefined
            ? stripControlCharacters(asString(call.args?.movieTitle))
            : undefined;
        const spunBy = call.args?.spunBy as User | undefined;
        const date = asOptionalString(call.args?.date);
        const updated = await updateSpinEntry(entryId, { movieId, movieTitle, spunBy, date });
        return { id: call.id, name: call.name, ok: true, result: updated };
      }
      case 'spinHistory.delete': {
        const entryId = asString(call.args?.entryId);
        await deleteSpinEntry(entryId);
        return { id: call.id, name: call.name, ok: true, result: { entryId } };
      }
      default: {
        const neverTool: never = call.name;
        throw new Error(`Unknown tool: ${neverTool}`);
      }
    }
  } catch (error) {
    return {
      id: call.id,
      name: call.name,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const runAgentToolCalls = async (
  calls: AgentToolCall[],
  currentUser: User | null
): Promise<AgentToolResult[]> => {
  const results: AgentToolResult[] = [];
  for (const call of calls) {
    // eslint-disable-next-line no-await-in-loop
    const result = await runAgentToolCall(call, currentUser);
    results.push(result);
  }
  return results;
};
