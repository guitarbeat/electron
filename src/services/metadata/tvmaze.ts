import { TVMAZE_BASE, METADATA_REQUEST_TIMEOUT_MS } from './config';
import type { MovieAutocompleteResult, TvMazeSearchResult } from './types';

export const searchTvMazeShows = async (
  query: string,
  signal?: AbortSignal
): Promise<MovieAutocompleteResult[]> => {
  const searchUrl = `${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(searchUrl, { 
      signal,
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`TVMaze search failed with status ${response.status}`);
    }

    const data = await response.json() as TvMazeSearchResult;
    
    if (!data.show) {
      return [];
    }

    return [{
      title: data.show.name || '',
      year: data.show.premiered?.split('-')[0],
      imdbID: data.show.id.toString(),
      type: 'series',
      poster: data.show.image?.medium || data.show.image?.original,
    }];
  } catch (error) {
    throw new Error(`TVMaze search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
