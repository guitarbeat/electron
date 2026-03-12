import { useCallback } from 'react';
import { Place, User } from '@/types';
import { usePolling } from './usePolling';
import {
  canReadGist,
  canWriteGist,
  fetchGist,
  getGistFileContent,
  GIST_PLACES_FILENAME,
  patchGistFile,
  readLocalOverride,
  readStoredJson,
  setLocalOverride,
  writeStoredJson,
} from '@/services/gistClient.ts';
import { validateAndThrow, validatePlace } from '@/utils/validation';
import { sanitizeInput } from '@/config/security';

const mockPlaces: Place[] = [
  {
    id: '1',
    name: 'Eiffel Tower',
    notes: 'Must visit before 30',
    addedBy: 'Aaron',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Great Wall of China',
    notes: 'Amazing views',
    addedBy: 'Electra',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Statue of Liberty',
    notes: 'New York trip',
    addedBy: 'Aaron',
    createdAt: new Date().toISOString(),
  },
];

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
    (place.addedBy === undefined || place.addedBy === 'Aaron' || place.addedBy === 'Electra') &&
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

const getFallbackPlaces = (): Place[] => readStoredLocalPlaces() ?? clonePlaces(mockPlaces);

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
    if (!canReadGist) {
      return getFallbackPlaces();
    }

    const localOverride = readLocalOverride('places', readStoredLocalPlaces);
    if (localOverride.enabled && localOverride.value) {
      return localOverride.value;
    }

    const response = await fetchGist({ cache: 'no-cache' });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn(`GitHub API returned ${response.status}. Falling back to local places.`);
        return getFallbackPlaces();
      }
      console.warn(`GitHub API returned ${response.status}. Falling back to local places.`);
      return getFallbackPlaces();
    }

    const gist = await response.json();
    const content = getGistFileContent(gist, GIST_PLACES_FILENAME);
    if (content === null) {
      if (!canWriteGist) {
        return getFallbackPlaces();
      }
      return [];
    }

    const places = JSON.parse(content);
    return Array.isArray(places) ? places : [];
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
