import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@/types;

const STORAGE_PREFIX = 'foodDropBestScore';

function buildStorageKey(user: User | null): string {
  return `${STORAGE_PREFIX}:${user ?? 'guest'}`;
}

function readScore(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function useFoodDropBestScore(user: User | null) {
  const storageKey = useMemo(() => buildStorageKey(user), [user]);
  const [bestScore, setBestScore] = useState(() => readScore(storageKey));

  useEffect(() => {
    setBestScore(readScore(storageKey));
  }, [storageKey]);

  const recordBestScore = useCallback(
    (score: number) => {
      if (!Number.isFinite(score) || score <= bestScore) return;
      setBestScore(score);
      try {
        localStorage.setItem(storageKey, String(score));
      } catch {
        // Ignore localStorage write errors.
      }
    },
    [bestScore, storageKey]
  );

  return {
    bestScore,
    recordBestScore,
  };
}
