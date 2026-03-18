import { useCallback, useRef, useState } from 'react';
import { Place, User } from '@/types';
import { usePolling } from '@/services/polling';
import {
  canWriteGist,
  GIST_PLACES_FILENAME,
  patchGistFile,
  readGistJsonFile,
  readStoredJson,
  setLocalOverride,
  writeStoredJson,
} from '@/services/gistClient.ts';
import { areDeeplyEqual, isUser, parseJsonContent, sanitizeInput, validateAndThrow, validatePlace } from '@/utils';

const PLACES_LOCAL_STORAGE_KEY = 'movieList.localPlaces';

const clonePlaces = (places: Place[]): Place[] =>
  places.map((place) => ({
    ...place,
  }));

const isPlaceRecord = (value: unknown): value is Place => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const place = value as Partial<Place>;

  return (
    typeof place.id === 'string' &&
    typeof place.name === 'string' &&
    typeof place.createdAt === 'string' &&
    (place.addedBy === undefined || isUser(place.addedBy)) &&
    (place.notes === undefined || typeof place.notes === 'string') &&
    (place.visitedAt === undefined || typeof place.visitedAt === 'string') &&
    (place.lat === undefined || typeof place.lat === 'number') &&
    (place.lng === undefined || typeof place.lng === 'number')
  );
};

const readStoredLocalPlaces = (): Place[] | null =>
  readStoredJson({
    storageKey: PLACES_LOCAL_STORAGE_KEY,
    validate: (value): value is Place[] => Array.isArray(value) && value.every(isPlaceRecord),
    clone: clonePlaces,
    label: 'local places fallback',
  });

const getFallbackPlaces = (): Place[] => readStoredLocalPlaces() ?? [];

const saveLocalPlaces = (places: Place[]): void => {
  writeStoredJson({
    storageKey: PLACES_LOCAL_STORAGE_KEY,
    value: places,
    clone: clonePlaces,
    label: 'local places fallback',
  });
  setLocalOverride('places', true);
};

const getPlaces = async (): Promise<Place[]> => {
  try {
    return await readGistJsonFile({
      scope: 'places',
      filename: GIST_PLACES_FILENAME,
      fallback: getFallbackPlaces,
      onMissingFileWhenWritable: () => [],
      parse: (content) => {
        const places = parseJsonContent(content, 'places') as Place[];
        return Array.isArray(places) ? places : [];
      },
    });
  } catch (error) {
    console.error('Error fetching places from Gist:', error);
    console.warn('Falling back to local places');
    return getFallbackPlaces();
  }
};

const savePlaces = async (places: Place[]): Promise<void> => {
  if (!canWriteGist) {
    saveLocalPlaces(places);
    return;
  }

  try {
    const response = await patchGistFile(GIST_PLACES_FILENAME, JSON.stringify(places, null, 2));

    if (!response.ok) {
      console.warn(`Failed to save places to Gist (${response.status}), using local fallback.`);
      saveLocalPlaces(places);
      return;
    }
    setLocalOverride('places', false);
  } catch (error) {
    console.warn('Error saving places to Gist, using local fallback:', error);
    saveLocalPlaces(places);
  }
};

export const usePlaces = (currentUser: User | null, isPaused: boolean = false) => {
  const {
    data: places,
    error,
    isLoading,
    refresh,
  } = usePolling(getPlaces, 10000, areDeeplyEqual, {
    key: 'places',
    isPaused,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const performMutation = useCallback(
    async (mutate: (latestPlaces: Place[]) => Place[]) => {
      if (isSubmittingRef.current) {
        return false;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      try {
        const latestPlaces = await getPlaces();
        await savePlaces(mutate(latestPlaces));
        refresh();
        return true;
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [refresh]
  );

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

      await performMutation((latestPlaces) => [...latestPlaces, place]);
    },
    [currentUser, performMutation]
  );

  const removePlace = useCallback(
    async (id: string) => {
      await performMutation((latestPlaces) => latestPlaces.filter((p) => p.id !== id));
    },
    [performMutation]
  );

  const restorePlace = useCallback(
    async (place: Place) => {
      await performMutation((latestPlaces) => [...latestPlaces, place]);
    },
    [performMutation]
  );

  const updatePlace = useCallback(
    async (id: string, updates: Partial<Pick<Place, 'name' | 'notes'>>) => {
      await performMutation((latestPlaces) =>
        latestPlaces.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    [performMutation]
  );

  const markVisited = useCallback(
    async (id: string) => {
      await performMutation((latestPlaces) =>
        latestPlaces.map((p) => (p.id === id ? { ...p, visitedAt: new Date().toISOString() } : p))
      );
    },
    [performMutation]
  );

  const markUnvisited = useCallback(
    async (id: string) => {
      await performMutation((latestPlaces) =>
        latestPlaces.map((p) => (p.id === id ? { ...p, visitedAt: undefined } : p))
      );
    },
    [performMutation]
  );

  return {
    places: places ?? [],
    isLoading,
    isSubmitting,
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
