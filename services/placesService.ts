import { GIST_PLACES_FILENAME, GIST_TOKEN, GIST_API_URL, GIST_ID } from '../config/gistConfig';
import type { Place } from '../types';

const mockPlaces: Place[] = [
  {
    id: '1',
    name: 'Eiffel Tower',
    country: 'France',
    notes: 'Must visit before 30',
    addedBy: 'Aaron',
    visitedAt: null,
  },
  {
    id: '2',
    name: 'Great Wall of China',
    country: 'China',
    notes: 'Amazing views',
    addedBy: 'Electra',
    visitedAt: null,
  },
  {
    id: '3',
    name: 'Statue of Liberty',
    country: 'USA',
    notes: 'New York trip',
    addedBy: 'Aaron',
    visitedAt: null,
  },
];

export const getPlaces = async (): Promise<Place[]> => {
  try {
    // If credentials are missing, use mock data instead of erroring
    if (!GIST_TOKEN?.trim() || !GIST_ID?.trim()) {
      console.warn('GitHub credentials not configured. Using mock places. Set VITE_GIST_TOKEN and VITE_GIST_ID to use real data.');
      return mockPlaces;
    }

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
    const file = gist.files[GIST_PLACES_FILENAME];

    if (!file || !file.content) {
      return [];
    }

    const places = JSON.parse(file.content);
    return Array.isArray(places) ? places : [];
  } catch (error) {
    console.error('Error fetching places from Gist:', error);
    // Return mock data as fallback when API fails
    console.warn('Falling back to mock places');
    return mockPlaces;
  }
};

export const savePlaces = async (places: Place[]): Promise<void> => {
  try {
    const response = await fetch(GIST_API_URL, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: {
          [GIST_PLACES_FILENAME]: {
            content: JSON.stringify(places, null, 2),
          },
        },
      }),
    });

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
