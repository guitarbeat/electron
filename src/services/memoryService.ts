import { parseJsonContent, sanitizeInput } from '@/utils';
import type { SharedMemory } from '@/types.ts';
import {
  canReadGist,
  canWriteGist,
  fetchGist,
  GIST_MEMORIES_FILENAME,
  getGistFileContent,
  patchGistFile,
  readLocalOverride,
  readStoredJson,
  setLocalOverride,
  writeStoredJson,
} from './gistClient.ts';

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

const readStoredLocalMemories = (): SharedMemory[] | null =>
  readStoredJson({
    storageKey: MEMORIES_LOCAL_STORAGE_KEY,
    validate: (value): value is SharedMemory[] =>
      Array.isArray(value) && value.every(isSharedMemoryRecord),
    clone: cloneMemories,
    label: 'local memories fallback',
  });

const getFallbackMemories = (): SharedMemory[] => readStoredLocalMemories() ?? [];

const saveLocalMemories = (memories: SharedMemory[]): void => {
  writeStoredJson({
    storageKey: MEMORIES_LOCAL_STORAGE_KEY,
    value: memories,
    clone: cloneMemories,
    label: 'local memories fallback',
  });
  setLocalOverride('memories', true);
};

export const getMemories = async (): Promise<SharedMemory[]> => {
  if (!canReadGist) {
    return getFallbackMemories();
  }

  const localOverride = readLocalOverride('memories', readStoredLocalMemories);
  if (localOverride.enabled && localOverride.value) {
    return localOverride.value;
  }

  try {
    const response = await fetchGist({ cache: 'no-cache' });

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

    return parseJsonContent(content, 'memories') as SharedMemory[];
  } catch (error) {
    console.error('Error fetching memories from Gist:', error);
    return getFallbackMemories();
  }
};

const saveMemories = async (memories: SharedMemory[]): Promise<void> => {
  if (!canWriteGist) {
    saveLocalMemories(memories);
    return;
  }

  try {
    const response = await patchGistFile(GIST_MEMORIES_FILENAME, JSON.stringify(memories, null, 2));

    if (!response.ok) {
      console.warn(`Failed to save memories to Gist (${response.status}), using local fallback.`);
      saveLocalMemories(memories);
      return;
    }
    setLocalOverride('memories', false);
  } catch (error) {
    console.warn('Error saving memories to Gist, using local fallback:', error);
    saveLocalMemories(memories);
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
    id: `memory-${crypto.randomUUID()}`,
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
