import type { Movie, SharedMemory } from '@/shared/types';
import { normalizeMovieTitle } from '@/utils/shared';

export const INITIAL_VISIBLE_COUNT = 6;
export const ALL_MOVIES_FILTER = 'all';

export type MemorySortMode = 'newest' | 'oldest';
export const MEMORY_MENTION_REGEX = /(@Aaron|@Electra)\b/gi;

interface StickyNoteTheme {
  background: string;
  border: string;
  heading: string;
  text: string;
  meta: string;
  signature: string;
  pin: string;
}

interface MovieMemorySummary {
  count: number;
  latest?: SharedMemory;
}

const STICKY_NOTE_THEMES: StickyNoteTheme[] = [
  {
    background: 'linear-gradient(165deg, #fff4a6 0%, #f9e07a 72%, #efd46a 100%)',
    border: '#d0b45b',
    heading: '#4b3810',
    text: '#44330f',
    meta: '#6a5523',
    signature: '#7a3f00',
    pin: '#e45858',
  },
  {
    background: 'linear-gradient(165deg, #b7f5ff 0%, #98e4f5 70%, #7ed2e8 100%)',
    border: '#72bccf',
    heading: '#12394a',
    text: '#113341',
    meta: '#2c5160',
    signature: '#115073',
    pin: '#f56f42',
  },
  {
    background: 'linear-gradient(165deg, #ffd3b2 0%, #ffbf96 74%, #f8ad84 100%)',
    border: '#dd9367',
    heading: '#5e2c10',
    text: '#4e2a12',
    meta: '#754220',
    signature: '#8a3412',
    pin: '#47906f',
  },
  {
    background: 'linear-gradient(165deg, #dcf8c5 0%, #c8ebaa 73%, #b2d78f 100%)',
    border: '#95b572',
    heading: '#2e4b1e',
    text: '#2d461d',
    meta: '#496838',
    signature: '#3f6a1f',
    pin: '#4168d6',
  },
];

const STICKY_NOTE_ROTATIONS = [-2.3, 1.8, -1.2, 2.4, -0.7, 1.1, -1.8, 2.7];

const getFallbackMovieKey = (movieTitle: string): string =>
  `title:${normalizeMovieTitle(movieTitle)}`;

const getMemoryMovieKey = (memory: SharedMemory): string =>
  memory.movieId || getFallbackMovieKey(memory.movieTitle);

const getMemorySeed = (memory: SharedMemory): number => {
  const source = `${memory.id}|${memory.movieTitle}|${memory.author}|${memory.createdAt}`;
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

export const getStickyNoteTheme = (memory: SharedMemory): StickyNoteTheme => {
  const seed = getMemorySeed(memory);
  return STICKY_NOTE_THEMES[seed % STICKY_NOTE_THEMES.length];
};

export const getStickyNoteRotation = (memory: SharedMemory): number => {
  const seed = getMemorySeed(memory);
  return STICKY_NOTE_ROTATIONS[seed % STICKY_NOTE_ROTATIONS.length];
};

export const buildMovieMemorySummaries = (
  movies: Movie[],
  memories: SharedMemory[]
): Map<string, MovieMemorySummary> => {
  const groupedByKey = new Map<string, SharedMemory[]>();

  memories.forEach((memory) => {
    const key = getMemoryMovieKey(memory);
    const list = groupedByKey.get(key) || [];
    list.push(memory);
    groupedByKey.set(key, list);
  });

  const summaries = new Map<string, MovieMemorySummary>();

  movies.forEach((movie) => {
    const movieKeys = [movie.id, getFallbackMovieKey(movie.title)];
    const merged = new Map<string, SharedMemory>();

    movieKeys.forEach((key) => {
      const memoriesForKey = groupedByKey.get(key) || [];
      memoriesForKey.forEach((memory) => {
        merged.set(memory.id, memory);
      });
    });

    const allMemories = sortMemories(Array.from(merged.values()), 'newest');

    if (allMemories.length > 0) {
      summaries.set(movie.id, {
        count: allMemories.length,
        latest: allMemories[0],
      });
    }
  });

  return summaries;
};

export const sortMemories = (
  memories: SharedMemory[],
  sortMode: MemorySortMode
): SharedMemory[] => {
  return [...memories].sort((a, b) => {
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
      return a.isPinned ? -1 : 1;
    }

    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();

    if (sortMode === 'oldest') {
      return aTime - bTime;
    } else {
      return bTime - aTime;
    }
  });
};

export const canCreateMemory = (currentUser: string | null): boolean => Boolean(currentUser);
