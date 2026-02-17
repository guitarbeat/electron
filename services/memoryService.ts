import { GIST_ID, GIST_MEMORIES_FILENAME, GIST_TOKEN } from '../gistConfig';
import { SharedMemory } from '../types';

const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;

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
    movieTitle: movieTitle.trim(),
    author: author.trim(),
    note: note.trim(),
    createdAt: new Date().toISOString(),
  };

  memories.unshift(newMemory);
  await saveMemories(memories);

  return newMemory;
};
