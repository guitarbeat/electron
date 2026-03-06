import { GIST_PLACES_FILENAME, GIST_TOKEN, GIST_ID } from '../config/gistConfig.ts';
import type { Place } from '../types.ts';
import { fetchGist, getGistFileContent, patchGistFile } from './gistClient.ts';

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

export const getPlaces = async (): Promise<Place[]> => {
  try {
    // If credentials are missing, use mock data instead of erroring
    if (!GIST_TOKEN?.trim() || !GIST_ID?.trim()) {
      console.warn(
        'GitHub credentials not configured. Using mock places. Set VITE_GIST_TOKEN and VITE_GIST_ID to use real data.'
      );
      return mockPlaces;
    }

    const response = await fetchGist({ token: GIST_TOKEN, cache: 'no-cache' });

    if (!response.ok) {
      // Return mock data for 401 and other auth errors instead of throwing
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
    // Return mock data as fallback when API fails
    console.warn('Falling back to mock places');
    return mockPlaces;
  }
};

export const savePlaces = async (places: Place[]): Promise<void> => {
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
