import { TVMAZE_BASE, METADATA_REQUEST_TIMEOUT_MS } from './config';
import type { MovieAutocompleteResult } from './types';

interface TvMazeShow {
  id: number;
  name: string;
  premiered?: string;
  image?: { medium?: string; original?: string };
}

interface TvMazeSearchEntry {
  score: number;
  show: TvMazeShow;
}

export const searchTvMazeShows = async (
  query: string,
  signal?: AbortSignal
): Promise<MovieAutocompleteResult[]> => {
  const searchUrl = `${TVMAZE_BASE}?mode=search&q=${encodeURIComponent(query)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), METADATA_REQUEST_TIMEOUT_MS);
    const mergedSignal = signal ?? controller.signal;

    const response = await fetch(searchUrl, {
      signal: mergedSignal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`TVMaze search failed with status ${response.status}`);
    }

    const data = await response.json() as TvMazeSearchEntry[];

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((entry) => ({
      title: entry.show.name || '',
      year: entry.show.premiered?.split('-')[0],
      imdbID: String(entry.show.id),
      type: 'series' as const,
      poster: entry.show.image?.medium || entry.show.image?.original,
    }));
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw new Error(`TVMaze search failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { cause: error });
  }
};
