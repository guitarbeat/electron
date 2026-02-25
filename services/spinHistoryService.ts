import { GIST_TOKEN, GIST_API_URL, GIST_SPIN_HISTORY_FILENAME } from '../gistConfig.ts';
import type { SpinEntry, SpinHistory, User } from '../types.ts';

export const getSpinHistory = async (): Promise<SpinHistory> => {
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
    const file = gist.files[GIST_SPIN_HISTORY_FILENAME];

    if (!file || !file.content) {
      return [];
    }

    const parsed = JSON.parse(file.content);
    return Array.isArray(parsed) ? (parsed as SpinHistory) : [];
  } catch (error) {
    console.error('Error fetching spin history from Gist:', error);
    throw error;
  }
};

export const saveSpinHistory = async (history: SpinHistory): Promise<void> => {
  try {
    const response = await fetch(GIST_API_URL, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: {
          [GIST_SPIN_HISTORY_FILENAME]: {
            content: JSON.stringify(history, null, 2),
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
    console.error('Error saving spin history to Gist:', error);
    throw error;
  }
};

export const addSpinEntry = async (
  entry: Omit<SpinEntry, 'id' | 'createdAt'>
): Promise<SpinEntry> => {
  const history = await getSpinHistory();
  const nextEntry: SpinEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  const nextHistory = [nextEntry, ...history];
  await saveSpinHistory(nextHistory);
  return nextEntry;
};

export const updateSpinEntry = async (
  entryId: string,
  updates: Partial<Pick<SpinEntry, 'movieId' | 'movieTitle' | 'spunBy' | 'date'>>
): Promise<SpinEntry> => {
  const history = await getSpinHistory();
  const index = history.findIndex((entry) => entry.id === entryId);

  if (index < 0) {
    throw new Error('Spin entry not found');
  }

  const previous = history[index];
  const next: SpinEntry = {
    ...previous,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const nextHistory = [...history];
  nextHistory[index] = next;
  await saveSpinHistory(nextHistory);
  return next;
};

export const deleteSpinEntry = async (entryId: string): Promise<void> => {
  const history = await getSpinHistory();
  const nextHistory = history.filter((entry) => entry.id !== entryId);

  if (nextHistory.length === history.length) {
    throw new Error('Spin entry not found');
  }

  await saveSpinHistory(nextHistory);
};

export const upsertTodaySpinEntry = async (
  today: string,
  spunBy: User,
  movieId: string,
  movieTitle: string
) => {
  const history = await getSpinHistory();
  const existingIndex = history.findIndex((entry) => entry.date === today);

  if (existingIndex < 0) {
    return addSpinEntry({ date: today, spunBy, movieId, movieTitle });
  }

  return updateSpinEntry(history[existingIndex].id, { spunBy, movieId, movieTitle, date: today });
};
