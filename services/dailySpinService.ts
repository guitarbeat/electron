import { GIST_TOKEN, GIST_API_URL, GIST_DAILY_SPIN_FILENAME } from '../gistConfig.ts';
import type { DailySpin } from '../types.ts';

/**
 * Gets the current date in YYYY-MM-DD format (UTC).
 */
const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Fetches the daily spin data from the Gist.
 */
export const getDailySpin = async (): Promise<DailySpin | null> => {
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
    const file = gist.files[GIST_DAILY_SPIN_FILENAME];

    if (!file || !file.content) {
      return null;
    }

    const spinData: DailySpin = JSON.parse(file.content);
    return spinData;
  } catch (error) {
    console.error('Error fetching daily spin from Gist:', error);
    return null;
  }
};

/**
 * Saves the daily spin data to the Gist.
 */
export const saveDailySpin = async (spin: DailySpin): Promise<void> => {
  try {
    const response = await fetch(GIST_API_URL, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: {
          [GIST_DAILY_SPIN_FILENAME]: {
            content: JSON.stringify(spin, null, 2),
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
    console.error('Error saving daily spin to Gist:', error);
    throw error;
  }
};

/**
 * Checks if a spin has already been done today.
 */
export const hasSpunToday = async (): Promise<boolean> => {
  const today = getTodayDateString();
  const dailySpin = await getDailySpin();
  return dailySpin !== null && dailySpin.date === today;
};

/**
 * Gets today's spin result if it exists.
 */
export const getTodaySpin = async (): Promise<DailySpin | null> => {
  const today = getTodayDateString();
  const dailySpin = await getDailySpin();
  if (dailySpin && dailySpin.date === today) {
    return dailySpin;
  }
  return null;
};
