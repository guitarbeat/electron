import { useState, useCallback, useRef } from 'react';
import { Place, User } from '../types';
import { usePolling } from './usePolling';
import { getPlaces, savePlaces } from '../services/placesService';

export const usePlaces = (currentUser: User | null, isPaused: boolean = false) => {
  const {
    data: places,
    error,
    isLoading,
    refresh,
  } = usePolling(getPlaces, 10000, (prev, next) => JSON.stringify(prev) === JSON.stringify(next), {
    key: 'places',
    isPaused,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const mutationLockRef = useRef<Promise<void> | null>(null);

  const performMutation = useCallback(
    async (mutationFn: (latest: Place[]) => Place[]) => {
      const mutation = (async () => {
        try {
          await mutationLockRef.current;
        } catch {
          // allow next mutation to proceed
        }
        setIsSubmitting(true);
        try {
          const latest = await getPlaces();
          const updated = mutationFn(latest);
          await savePlaces(updated);
          refresh();
        } catch (err) {
          console.error('Places mutation failed:', err);
          throw err;
        } finally {
          setIsSubmitting(false);
        }
      })();
      mutationLockRef.current = mutation;
      return mutation;
    },
    [refresh]
  );

  const addPlace = useCallback(
    async (name: string, notes?: string, lat?: number, lng?: number) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Place name cannot be empty');
      const place: Place = {
        id: crypto.randomUUID(),
        name: trimmed,
        addedBy: currentUser ?? undefined,
        notes: notes?.trim() || undefined,
        createdAt: new Date().toISOString(),
        ...(typeof lat === 'number' && typeof lng === 'number' && { lat, lng }),
      };
      await performMutation((list) => [...list, place]);
    },
    [currentUser, performMutation]
  );

  const removePlace = useCallback(
    async (id: string) => {
      await performMutation((list) => list.filter((p) => p.id !== id));
    },
    [performMutation]
  );

  const updatePlace = useCallback(
    async (id: string, updates: Partial<Pick<Place, 'name' | 'notes'>>) => {
      await performMutation((list) => list.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    },
    [performMutation]
  );

  const markVisited = useCallback(
    async (id: string) => {
      await performMutation((list) =>
        list.map((p) => (p.id === id ? { ...p, visitedAt: new Date().toISOString() } : p))
      );
    },
    [performMutation]
  );

  const markUnvisited = useCallback(
    async (id: string) => {
      await performMutation((list) =>
        list.map((p) => (p.id === id ? { ...p, visitedAt: undefined } : p))
      );
    },
    [performMutation]
  );

  return {
    places: places ?? [],
    isLoading,
    error,
    refresh,
    isSubmitting,
    addPlace,
    removePlace,
    updatePlace,
    markVisited,
    markUnvisited,
  };
};
