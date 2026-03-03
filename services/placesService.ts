import { GIST_PLACES_FILENAME, GIST_TOKEN, GIST_API_URL } from '../config/gistConfig';
import type { Place } from '../types';

export const getPlaces = async (): Promise<Place[]> => {
  try {
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
    throw error;
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
