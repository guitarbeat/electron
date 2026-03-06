import type {
  DailySpin,
  Message,
  Movie,
  MovieSuggestion,
  SharedMemory,
  SpinEntry,
  User,
} from '../types';
import { getTodaySpin } from './dailySpinService';
import { getMemories } from './memoryService';
import { getMessages } from './messageService';
import { getMovies } from './movieService';
import { getSuggestions } from './suggestionService';
import { getSpinHistory } from './spinHistoryService';

export interface AgentCapabilities {
  name: string;
  description: string;
  argsSchema: Record<string, string>;
}

export interface AgentContextSnapshot {
  currentUser: User | null;
  nowIso: string;
  today: string;
  counts: {
    movies: number;
    unwatchedMovies: number;
    pendingSuggestions: number;
    memories: number;
    pinnedMemories: number;
    messages: number;
    spinHistory: number;
  };
  todaySpin: DailySpin | null;
  recent: {
    movies: Pick<Movie, 'id' | 'title' | 'watchedBy' | 'addedBy' | 'category' | 'year'>[];
    pendingSuggestions: Pick<
      MovieSuggestion,
      'id' | 'title' | 'suggestedBy' | 'reason' | 'createdAt'
    >[];
    pinnedMemories: Pick<
      SharedMemory,
      'id' | 'movieId' | 'movieTitle' | 'author' | 'note' | 'createdAt'
    >[];
    messages: Pick<Message, 'id' | 'author' | 'content' | 'createdAt'>[];
    spinHistory: Pick<
      SpinEntry,
      'id' | 'date' | 'movieId' | 'movieTitle' | 'spunBy' | 'createdAt'
    >[];
  };
}

const truncate = (value: string, max: number) => {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
};

export const getAgentCapabilities = (): AgentCapabilities[] => {
  return [
    {
      name: 'movies.list',
      description: 'List watchlist movies.',
      argsSchema: {},
    },
    {
      name: 'movies.add',
      description: 'Add a movie to the watchlist.',
      argsSchema: { title: 'string' },
    },
    {
      name: 'movies.toggleWatched',
      description: 'Toggle watched status for the current user.',
      argsSchema: { movieId: 'string' },
    },
    {
      name: 'movies.delete',
      description: 'Delete a movie from the watchlist.',
      argsSchema: { movieId: 'string' },
    },
    {
      name: 'memories.list',
      description: 'List shared memories.',
      argsSchema: {},
    },
    {
      name: 'memories.add',
      description: 'Add a shared memory note.',
      argsSchema: {
        movieId: 'string | undefined',
        movieTitle: 'string',
        author: 'string',
        note: 'string',
      },
    },
    {
      name: 'memories.update',
      description: 'Update a memory note and/or associated movie.',
      argsSchema: {
        memoryId: 'string',
        note: 'string | undefined',
        movieId: 'string | undefined',
        movieTitle: 'string | undefined',
      },
    },
    {
      name: 'memories.delete',
      description: 'Delete a memory.',
      argsSchema: { memoryId: 'string' },
    },
    {
      name: 'memories.togglePin',
      description: 'Pin or unpin a memory.',
      argsSchema: { memoryId: 'string' },
    },
    {
      name: 'messages.add',
      description: 'Post a message to the message board.',
      argsSchema: { author: 'string', content: 'string' },
    },
    {
      name: 'suggestions.add',
      description: 'Add a movie suggestion.',
      argsSchema: { title: 'string', suggestedBy: 'string', reason: 'string | undefined' },
    },
    {
      name: 'suggestions.accept',
      description: 'Accept a suggestion and add it to the watchlist.',
      argsSchema: { suggestionId: 'string' },
    },
    {
      name: 'suggestions.reject',
      description: 'Reject a suggestion.',
      argsSchema: { suggestionId: 'string' },
    },
    {
      name: 'spin.getToday',
      description: "Get today's spin (if any).",
      argsSchema: {},
    },
    {
      name: 'spin.setToday',
      description: 'Set today’s spin (writes dailyspin + history).',
      argsSchema: { movieId: 'string', movieTitle: 'string' },
    },
    {
      name: 'spin.clearToday',
      description: 'Clear today’s spin lock (dailyspin.json).',
      argsSchema: {},
    },
    {
      name: 'spinHistory.list',
      description: 'List spin history entries.',
      argsSchema: { limit: 'number | undefined' },
    },
    {
      name: 'spinHistory.update',
      description: 'Update a spin history entry.',
      argsSchema: {
        entryId: 'string',
        movieId: 'string | undefined',
        movieTitle: 'string | undefined',
        spunBy: 'User | undefined',
        date: 'string | undefined',
      },
    },
    {
      name: 'spinHistory.delete',
      description: 'Delete a spin history entry.',
      argsSchema: { entryId: 'string' },
    },
  ];
};

export const buildAgentContextSnapshot = async (
  currentUser: User | null
): Promise<AgentContextSnapshot> => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const [movies, suggestions, memories, messages, todaySpin, spinHistory] = await Promise.all([
    getMovies().catch(() => []),
    getSuggestions().catch(() => []),
    getMemories().catch(() => []),
    getMessages().catch(() => []),
    getTodaySpin().catch(() => null),
    getSpinHistory().catch(() => []),
  ]);

  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');
  const pinnedMemories = memories.filter((m) => Boolean(m.isPinned));

  return {
    currentUser,
    nowIso: now.toISOString(),
    today,
    counts: {
      movies: movies.length,
      unwatchedMovies: movies.filter((m) => m.watchedBy.length < 2).length,
      pendingSuggestions: pendingSuggestions.length,
      memories: memories.length,
      pinnedMemories: pinnedMemories.length,
      messages: messages.length,
      spinHistory: spinHistory.length,
    },
    todaySpin,
    recent: {
      movies: movies
        .slice()
        .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
        .slice(0, 20)
        .map((m) => ({
          id: m.id,
          title: truncate(m.title, 120),
          watchedBy: m.watchedBy,
          addedBy: m.addedBy,
          category: m.category,
          year: m.year,
        })),
      pendingSuggestions: pendingSuggestions
        .slice()
        .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
        .slice(0, 20)
        .map((s) => ({
          id: s.id,
          title: truncate(s.title, 120),
          suggestedBy: truncate(s.suggestedBy, 40),
          reason: s.reason ? truncate(s.reason, 160) : undefined,
          createdAt: s.createdAt,
        })),
      pinnedMemories: pinnedMemories
        .slice()
        .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
        .slice(0, 10)
        .map((m) => ({
          id: m.id,
          movieId: m.movieId,
          movieTitle: truncate(m.movieTitle, 120),
          author: truncate(m.author, 40),
          note: truncate(m.note, 240),
          createdAt: m.createdAt,
        })),
      messages: messages
        .slice()
        .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
        .slice(0, 20)
        .map((msg) => ({
          id: msg.id,
          author: truncate(msg.author, 40),
          content: truncate(msg.content, 240),
          createdAt: msg.createdAt,
        })),
      spinHistory: spinHistory
        .slice()
        .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
        .slice(0, 20)
        .map((entry) => ({
          id: entry.id,
          date: entry.date,
          movieId: entry.movieId,
          movieTitle: truncate(entry.movieTitle, 120),
          spunBy: entry.spunBy,
          createdAt: entry.createdAt,
        })),
    },
  };
};
