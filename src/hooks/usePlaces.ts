import { useCallback, useMemo, useState } from 'react';
import { Place, User } from '@/shared/types';
import { usePolling } from '@/services/polling';
import { mutateScope, readScope, retryScopeSync } from '@/services/stateClient';
import {
  areDeeplyEqual,
  sanitizeInput,
  validateAndThrow,
  validatePlace,
} from '@/utils';

const POLLING_INTERVAL = 15000;

export const usePlaces = (currentUser: User | null, isPaused: boolean = false) => {
  const readPlaces = useCallback(() => readScope('places'), []);
  const {
    data: snapshot,
    error,
    isLoading,
    refresh,
  } = usePolling(readPlaces, POLLING_INTERVAL, areDeeplyEqual, {
    key: 'places',
    isPaused,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const places = useMemo(() => snapshot?.data ?? [], [snapshot]);

  const performMutation = useCallback(
    async (
      op: string,
      payload: unknown,
      optimisticData: Place[]
    ) => {
      if (!currentUser) {
        throw new Error('Profile required');
      }

      setIsSubmitting(true);
      try {
        await mutateScope('places', {
          op,
          payload,
          optimisticData,
        });
        refresh();
        return true;
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, refresh]
  );

  const addPlace = useCallback(
    async (name: string, notes?: string, lat?: number, lng?: number) => {
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

      await performMutation(
        'add_place',
        {
          id: place.id,
          name: place.name,
          notes: place.notes,
          lat: place.lat,
          lng: place.lng,
        },
        [...places, place]
      );
    },
    [currentUser, performMutation, places]
  );

  const removePlace = useCallback(
    async (id: string) => {
      await performMutation(
        'remove_place',
        { placeId: id },
        places.filter((p) => p.id !== id)
      );
    },
    [performMutation, places]
  );

  const restorePlace = useCallback(
    async (place: Place) => {
      await performMutation(
        'add_place',
        {
          id: place.id,
          name: place.name,
          notes: place.notes,
          lat: place.lat,
          lng: place.lng,
        },
        [...places, place]
      );
    },
    [performMutation, places]
  );

  const updatePlace = useCallback(
    async (id: string, updates: Partial<Pick<Place, 'name' | 'notes' | 'lat' | 'lng' | 'category'>>) => {
      if (updates.name !== undefined || updates.notes !== undefined) {
        validateAndThrow(validatePlace, {
          name: updates.name ?? places.find((p) => p.id === id)?.name ?? '',
          notes: updates.notes ?? '',
        });
      }
      await performMutation(
        'update_place',
        { placeId: id, updates },
        places.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    [performMutation, places]
  );

  const markVisited = useCallback(
    async (id: string) => {
      const visitedAt = new Date().toISOString();
      await performMutation(
        'mark_visited',
        { placeId: id },
        places.map((p) => (p.id === id ? { ...p, visitedAt } : p))
      );
    },
    [performMutation, places]
  );

  const markUnvisited = useCallback(
    async (id: string) => {
      await performMutation(
        'mark_unvisited',
        { placeId: id },
        places.map((p) => (p.id === id ? { ...p, visitedAt: undefined } : p))
      );
    },
    [performMutation, places]
  );

  const retrySync = useCallback(async () => {
    await retryScopeSync('places');
    refresh();
  }, [refresh]);

  return {
    places,
    isLoading,
    isSubmitting,
    error,
    isDegraded: snapshot?.degraded ?? false,
    isSyncBlocked: snapshot?.blocked ?? false,
    syncWarning: snapshot?.warning,
    refresh,
    retrySync,
    addPlace,
    removePlace,
    restorePlace,
    updatePlace,
    markVisited,
    markUnvisited,
  };
};
