import { useCallback } from 'react';
import { Place, User } from '@/types';
import { usePolling } from './usePolling';
import {
  fetchGist,
  getGistFileContent,
  GIST_ID,
  GIST_PLACES_FILENAME,
  GIST_TOKEN,
  patchGistFile,
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

const getPlaces = async (): Promise<Place[]> => {
  try {
    if (!GIST_TOKEN?.trim() || !GIST_ID?.trim()) {
      console.warn(
        'GitHub credentials not configured. Using mock places. Set VITE_GIST_TOKEN and VITE_GIST_ID to use real data.'
      );
      return mockPlaces;
    }

    const response = await fetchGist({ token: GIST_TOKEN, cache: 'no-cache' });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn(`GitHub API returned ${response.status}. Falling back to mock places.`);
        return mockPlaces;
      }
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const gist = await response.json();
    const content = getGistFileContent(gist, GIST_PLACES_FILENAME);
    if (content === null) {
      return [];
    }

    const places = JSON.parse(content);
    return Array.isArray(places) ? places : [];
  } catch (error) {
    console.error('Error fetching places from Gist:', error);
    console.warn('Falling back to mock places');
    return mockPlaces;
  }
};

const savePlaces = async (places: Place[]): Promise<void> => {
  try {
    const response = await patchGistFile(
      GIST_PLACES_FILENAME,
      JSON.stringify(places, null, 2),
      GIST_TOKEN
    );

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('GitHub API error details:', errorBody);
      throw new Error(`GitHub API responded with ${response.status}`);
    }
  } catch (error) {
    console.error('Error saving places to Gist:', error);
    throw error;
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
