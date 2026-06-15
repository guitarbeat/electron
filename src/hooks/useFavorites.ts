import { useCallback, useEffect, useState } from 'react';
import type { User } from '@/shared/types';

export type FavoriteKind = 'movie' | 'place';

const STORAGE_PREFIX = 'favorites.v1';

const buildStorageKey = (user: User | null, kind: FavoriteKind): string =>
  `${STORAGE_PREFIX}.${user ?? '__guest__'}.${kind}`;

const readSet = (key: string): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
};

const writeSet = (key: string, set: Set<string>): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    // ignore quota / privacy-mode failures
  }
};

/**
 * Per-user favorites stored client-side in localStorage.
 * Two independent sets per user: 'movie' and 'place'. Identified by item id.
 */
export const useFavorites = (currentUser: User | null) => {
  const [movieFavorites, setMovieFavorites] = useState<Set<string>>(() =>
    readSet(buildStorageKey(currentUser, 'movie'))
  );
  const [placeFavorites, setPlaceFavorites] = useState<Set<string>>(() =>
    readSet(buildStorageKey(currentUser, 'place'))
  );

  // Re-hydrate when the active user changes.
  useEffect(() => {
    setMovieFavorites(readSet(buildStorageKey(currentUser, 'movie')));
    setPlaceFavorites(readSet(buildStorageKey(currentUser, 'place')));
  }, [currentUser]);

  const toggleFavorite = useCallback(
    (kind: FavoriteKind, id: string) => {
      const key = buildStorageKey(currentUser, kind);
      const setter = kind === 'movie' ? setMovieFavorites : setPlaceFavorites;
      setter((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        writeSet(key, next);
        return next;
      });
    },
    [currentUser]
  );

  const isFavorite = useCallback(
    (kind: FavoriteKind, id: string): boolean =>
      (kind === 'movie' ? movieFavorites : placeFavorites).has(id),
    [movieFavorites, placeFavorites]
  );

  return {
    movieFavorites,
    placeFavorites,
    toggleFavorite,
    isFavorite,
    movieCount: movieFavorites.size,
    placeCount: placeFavorites.size,
  };
};
