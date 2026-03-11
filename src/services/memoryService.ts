import { sanitizeInput } from '@/config/security.ts';
import type { SharedMemory } from '@/types.ts';
import {
  canReadGist,
  canWriteGist,
  fetchGist,
  GIST_MEMORIES_FILENAME,
  getGistFileContent,
  GIST_TOKEN,
  patchGistFile,
} from './gistClient.ts';
import { MOCK_MEMORIES } from './mockData';

const MEMORIES_LOCAL_STORAGE_KEY = 'movieList.localMemories';

const cloneMemories = (memories: SharedMemory[]): SharedMemory[] =>
  memories.map((memory) => ({
    ...memory,
  }));

const isSharedMemoryRecord = (value: unknown): value is SharedMemory => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const memory = value as Partial<SharedMemory>;

  return (
    typeof memory.id === 'string' &&
    typeof memory.movieTitle === 'string' &&
    typeof memory.author === 'string' &&
    typeof memory.note === 'string' &&
    typeof memory.createdAt === 'string' &&
    (memory.movieId === undefined || typeof memory.movieId === 'string') &&
    (memory.updatedAt === undefined || typeof memory.updatedAt === 'string') &&
    (memory.isPinned === undefined || typeof memory.isPinned === 'boolean')
  );
};

const readStoredLocalMemories = (): SharedMemory[] | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(MEMORIES_LOCAL_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isSharedMemoryRecord)) {
      return cloneMemories(parsed);
    }
  } catch (error) {
    console.warn('Failed to read local memories fallback, resetting to defaults.', error);
  }

  return null;
};

const getFallbackMemories = (): SharedMemory[] =>
  readStoredLocalMemories() ?? cloneMemories(MOCK_MEMORIES);

const saveLocalMemories = (memories: SharedMemory[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      MEMORIES_LOCAL_STORAGE_KEY,
      JSON.stringify(cloneMemories(memories))
    );
  } catch (error) {
    console.warn('Failed to persist local memories fallback.', error);
  }
};

export const getMemories = async (): Promise<SharedMemory[]> => {
  if (!canReadGist) {
    return getFallbackMemories();
  }

  if (!canWriteGist && readStoredLocalMemories()) {
    return getFallbackMemories();
  }

  try {
    const response = await fetchGist({ token: GIST_TOKEN || undefined, cache: 'no-cache' });

    if (!response.ok) {
      console.warn(`Failed to fetch memories (${response.status}), using local fallback.`);
      return getFallbackMemories();
    }

    const gist = await response.json();
    const content = getGistFileContent(gist, GIST_MEMORIES_FILENAME);
    if (content === null) {
      if (!canWriteGist) {
        return getFallbackMemories();
      }
      return [];
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error fetching memories from Gist:', error);
    throw error;
  }
};

const saveMemories = async (memories: SharedMemory[]): Promise<void> => {
  if (!canWriteGist) {
    saveLocalMemories(memories);
    return;
  }

  try {
    const response = await patchGistFile(
      GIST_MEMORIES_FILENAME,
      JSON.stringify(memories, null, 2),
      GIST_TOKEN
    );

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('GitHub API error details:', errorBody);
      throw new Error(`GitHub API responded with ${response.status}`);
    }
  } catch (error) {
    console.error('Error saving memories to Gist:', error);
    throw error;
  }
};

export const addMemory = async (
  movieId: string | undefined,
  movieTitle: string,
  author: string,
  note: string,
  createdAt?: string
): Promise<SharedMemory> => {
  const memories = await getMemories();

  const newMemory: SharedMemory = {
    id: `memory-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    movieId,
    movieTitle: sanitizeInput(movieTitle),
    author: sanitizeInput(author),
    note: sanitizeInput(note),
    createdAt: createdAt || new Date().toISOString(),
  };

  memories.unshift(newMemory);
  await saveMemories(memories);

  return newMemory;
};

const findMemoryIndex = (memories: SharedMemory[], memoryId: string): number =>
  memories.findIndex((memory) => memory.id === memoryId);

export const updateMemory = async (
  memoryId: string,
  updates: {
    note?: string;
    movieId?: string;
    movieTitle?: string;
  }
): Promise<SharedMemory> => {
  const memories = await getMemories();
  const memoryIndex = findMemoryIndex(memories, memoryId);

  if (memoryIndex < 0) {
    throw new Error('Memory not found');
  }

  const nextMemory: SharedMemory = {
    ...memories[memoryIndex],
    ...updates,
    note: updates.note ? sanitizeInput(updates.note) : memories[memoryIndex].note,
    movieTitle: updates.movieTitle
      ? sanitizeInput(updates.movieTitle)
      : memories[memoryIndex].movieTitle,
    updatedAt: new Date().toISOString(),
  };

  memories[memoryIndex] = nextMemory;
  await saveMemories(memories);

  return nextMemory;
};

export const deleteMemory = async (memoryId: string): Promise<void> => {
  const memories = await getMemories();
  const nextMemories = memories.filter((memory) => memory.id !== memoryId);

  if (nextMemories.length === memories.length) {
    throw new Error('Memory not found');
  }

  await saveMemories(nextMemories);
};

export const toggleMemoryPin = async (memoryId: string): Promise<SharedMemory> => {
  const memories = await getMemories();
  const memoryIndex = findMemoryIndex(memories, memoryId);

  if (memoryIndex < 0) {
    throw new Error('Memory not found');
  }

  const target = memories[memoryIndex];
  const nextMemory: SharedMemory = {
    ...target,
    isPinned: !target.isPinned,
    updatedAt: new Date().toISOString(),
  };

  memories[memoryIndex] = nextMemory;
  await saveMemories(memories);
  return nextMemory;
};
