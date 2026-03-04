import { useState, useCallback } from 'react';

const SNAKE_LEADERBOARD_KEY = 'snakeLeaderboard';
const GUEST_NAME_STORAGE_KEY = 'movieWatchlistGuestName';
const MAX_LEADERBOARD_ENTRIES = 8;

export interface SnakeLeaderboardEntry {
  id: string;
  name: string;
  score: number;
  createdAt: string;
}

const loadLeaderboard = (): SnakeLeaderboardEntry[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(SNAKE_LEADERBOARD_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SnakeLeaderboardEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (entry) =>
          typeof entry?.id === 'string' &&
          typeof entry?.name === 'string' &&
          typeof entry?.score === 'number' &&
          Number.isFinite(entry.score) &&
          typeof entry?.createdAt === 'string'
      )
      .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt))
      .slice(0, MAX_LEADERBOARD_ENTRIES);
  } catch (error) {
    console.error('Failed to parse snake leaderboard:', error);
    return [];
  }
};

const saveLeaderboardLocal = (entries: SnakeLeaderboardEntry[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(SNAKE_LEADERBOARD_KEY, JSON.stringify(entries));
};

const getStoredGuestName = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  return localStorage.getItem(GUEST_NAME_STORAGE_KEY)?.trim() || '';
};

export const useSnakeLeaderboard = (currentUser: string | null) => {
  const [leaderboard, setLeaderboard] = useState<SnakeLeaderboardEntry[]>(() => loadLeaderboard());

  const recordScore = useCallback(
    (score: number) => {
      if (score <= 0) return;

      const playerName = currentUser || getStoredGuestName() || 'Guest';
      const newEntry: SnakeLeaderboardEntry = {
        id: `snake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: playerName,
        score,
        createdAt: new Date().toISOString(),
      };

      setLeaderboard((prev) => {
        const updated = [...prev, newEntry]
          .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt))
          .slice(0, MAX_LEADERBOARD_ENTRIES);
        saveLeaderboardLocal(updated);
        return updated;
      });
    },
    [currentUser]
  );

  const clearLeaderboard = useCallback(() => {
    localStorage.removeItem(SNAKE_LEADERBOARD_KEY);
    setLeaderboard([]);
  }, []);

  const bestScore = leaderboard.length > 0 ? leaderboard[0].score : 0;

  return {
    leaderboard,
    recordScore,
    clearLeaderboard,
    bestScore,
  };
};
