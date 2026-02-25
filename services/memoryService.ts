import { GIST_MEMORIES_FILENAME, GIST_TOKEN, GIST_API_URL } from '../gistConfig';
import { sanitizeInput } from '../config/security';
import { SharedMemory } from '../types';

export const getMemories = async (): Promise<SharedMemory[]> => {
  try {
    const response = await fetch(GIST_API_URL, {
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const gist = await response.json();
    const file = gist.files[GIST_MEMORIES_FILENAME];

    if (!file || !file.content) {
      return [];
    }

    return JSON.parse(file.content);
  } catch (error) {
    console.error('Error fetching memories from Gist:', error);
    throw error;
  }
};

export const saveMemories = async (memories: SharedMemory[]): Promise<void> => {
  try {
    const response = await fetch(GIST_API_URL, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: {
          [GIST_MEMORIES_FILENAME]: {
            content: JSON.stringify(memories, null, 2),
          },
        },
      }),
    });

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
  note: string
): Promise<SharedMemory> => {
  const memories = await getMemories();

  const newMemory: SharedMemory = {
    id: `memory-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    movieId,
    movieTitle: sanitizeInput(movieTitle),
    author: sanitizeInput(author),
    note: sanitizeInput(note),
    createdAt: new Date().toISOString(),
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
