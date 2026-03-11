import { sanitizeInput } from '@/config/security.ts';
import type { SharedMemory } from '@/types.ts';
import {
  fetchGist,
  GIST_MEMORIES_FILENAME,
  getGistFileContent,
  GIST_TOKEN,
  patchGistFile,
} from './gistClient.ts';
import { MOCK_MEMORIES } from './mockData';

export const getMemories = async (): Promise<SharedMemory[]> => {
  if (!GIST_TOKEN) {
    return MOCK_MEMORIES;
  }

  try {
    const response = await fetchGist({ token: GIST_TOKEN, cache: 'no-cache' });

    if (!response.ok) {
      console.warn('Failed to fetch memories, using mock data');
      return MOCK_MEMORIES;
    }

    const gist = await response.json();
    const content = getGistFileContent(gist, GIST_MEMORIES_FILENAME);
    if (content === null) {
      return [];
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error fetching memories from Gist:', error);
    throw error;
  }
};

const saveMemories = async (memories: SharedMemory[]): Promise<void> => {
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
    id: crypto.randomUUID(),
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
