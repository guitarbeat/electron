import { useCallback } from 'react';
import { Place, User } from '@/types';
import { usePolling } from './usePolling';
import { getPlaces, savePlaces } from '@/services/placesService';
import { validateAndThrow, validatePlace } from '@/utils/validation';
import { sanitizeInput } from '@/config/security';

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

  const addPlace = useCallback(
    async (name: string, notes?: string, lat?: number, lng?: number) => {
      // Validate input
      validateAndThrow(validatePlace, { name, notes: notes || '' });

      const trimmed = sanitizeInput(name.trim());
      if (!trimmed) throw new Error('Place name cannot be empty');

      const place: Place = {
        id: crypto.randomUUID(),
        name: trimmed,
        addedBy: currentUser ?? undefined,
        notes: notes?.trim() || undefined,
        createdAt: new Date().toISOString(),
        ...(typeof lat === 'number' && typeof lng === 'number' && { lat, lng }),
      };

      const latestPlaces = await getPlaces();
      await savePlaces([...latestPlaces, place]);
      refresh();
    },
    [currentUser, refresh]
  );

  const removePlace = useCallback(
    async (id: string) => {
      const latestPlaces = await getPlaces();
      const updatedPlaces = latestPlaces.filter((p) => p.id !== id);
      await savePlaces(updatedPlaces);
      refresh();
    },
    [refresh]
  );

  const restorePlace = useCallback(
    async (place: Place) => {
      const latestPlaces = await getPlaces();
      await savePlaces([...latestPlaces, place]);
      refresh();
    },
    [refresh]
  );

  const updatePlace = useCallback(
    async (id: string, updates: Partial<Pick<Place, 'name' | 'notes'>>) => {
      const latestPlaces = await getPlaces();
      const updatedPlaces = latestPlaces.map((p) => (p.id === id ? { ...p, ...updates } : p));
      await savePlaces(updatedPlaces);
      refresh();
    },
    [refresh]
  );

  const markVisited = useCallback(
    async (id: string) => {
      const latestPlaces = await getPlaces();
      const updatedPlaces = latestPlaces.map((p) =>
        p.id === id ? { ...p, visitedAt: new Date().toISOString() } : p
      );
      await savePlaces(updatedPlaces);
      refresh();
    },
    [refresh]
  );

  const markUnvisited = useCallback(
    async (id: string) => {
      const latestPlaces = await getPlaces();
      const updatedPlaces = latestPlaces.map((p) =>
        p.id === id ? { ...p, visitedAt: undefined } : p
      );
      await savePlaces(updatedPlaces);
      refresh();
    },
    [refresh]
  );

  return {
    places: places ?? [],
    isLoading,
    isSubmitting: false,
    error,
    refresh,
    addPlace,
    removePlace,
    restorePlace,
    updatePlace,
    markVisited,
    markUnvisited,
  };
};
