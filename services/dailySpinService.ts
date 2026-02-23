import { GIST_TOKEN, GIST_API_URL, GIST_DAILY_SPIN_FILENAME } from '../gistConfig.ts';
import type { DailySpinRecord, SpinEntry, DailySpin } from '../types.ts';

/**
 * Gets the current date in YYYY-MM-DD format (local time).
 */
const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Fetches the raw Gist file content and parses it as a DailySpinRecord.
 * Handles the legacy single-spin format (DailySpin) by migrating it transparently.
 * Returns null when no record exists or when the stored record is from a previous day.
 */
export const getTodayRecord = async (): Promise<DailySpinRecord | null> => {
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

    const parsed = JSON.parse(file.content);
    const today = getTodayDateString();

    // If the stored date is not today, the record is stale — treat as empty.
    if (!parsed.date || parsed.date !== today) {
      return null;
    }

    // Handle legacy format: { date, movieId, movieTitle, spunBy, createdAt }
    if (!Array.isArray(parsed.spins)) {
      const legacy = parsed as DailySpin;
      const migrated: DailySpinRecord = {
        date: today,
        spins: [
          {
            movieId: legacy.movieId,
            movieTitle: legacy.movieTitle,
            spunBy: legacy.spunBy,
            createdAt: legacy.createdAt,
          },
        ],
      };
      return migrated;
    }

    return parsed as DailySpinRecord;
  } catch (error) {
    console.error('Error fetching daily spin record from Gist:', error);
    return null;
  }
};

/**
 * Appends a new SpinEntry to today's record and persists it to the Gist.
 * If the stored record is from a previous day it is replaced with a fresh one.
 */
export const addSpinEntry = async (entry: SpinEntry): Promise<DailySpinRecord> => {
  const today = getTodayDateString();

  // Fetch current record (already filtered to today-only by getTodayRecord)
  const existing = await getTodayRecord();

  const updated: DailySpinRecord = {
    date: today,
    spins: [...(existing?.spins ?? []), entry],
  };

  const response = await fetch(GIST_API_URL, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${GIST_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      files: {
        [GIST_DAILY_SPIN_FILENAME]: {
          content: JSON.stringify(updated, null, 2),
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    console.error('GitHub API error details:', errorBody);
    throw new Error(`GitHub API responded with ${response.status}`);
  }

  return updated;
};

// ---------------------------------------------------------------------------
// Legacy compatibility shims (used by existing tests and any other callers)
// ---------------------------------------------------------------------------

/**
 * @deprecated Use getTodayRecord instead.
 * Returns the first spin of today as a DailySpin for backwards compatibility.
 */
export const getDailySpin = async (): Promise<DailySpin | null> => {
  const record = await getTodayRecord();
  if (!record || record.spins.length === 0) return null;
  const first = record.spins[0];
  return {
    date: record.date,
    movieId: first.movieId,
    movieTitle: first.movieTitle,
    spunBy: first.spunBy,
    createdAt: first.createdAt,
  };
};

/**
 * @deprecated Use addSpinEntry instead.
 * Saves a single DailySpin as a new spin entry.
 */
export const saveDailySpin = async (spin: DailySpin): Promise<void> => {
  const entry: SpinEntry = {
    movieId: spin.movieId,
    movieTitle: spin.movieTitle,
    spunBy: spin.spunBy,
    createdAt: spin.createdAt,
  };
  await addSpinEntry(entry);
};

/**
 * @deprecated Use getTodayRecord instead.
 * Returns true if at least one spin has been recorded today.
 */
export const hasSpunToday = async (): Promise<boolean> => {
  const record = await getTodayRecord();
  return record !== null && record.spins.length > 0;
};

/**
 * @deprecated Use getTodayRecord instead.
 * Returns the first spin of today as a DailySpin, or null.
 */
export const getTodaySpin = async (): Promise<DailySpin | null> => {
  return getDailySpin();
};
