import { sanitizeInput } from '../../utils/shared';
import { 
  MOVIE_AUTOCOMPLETE_RESULT_LIMIT, 
  MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT,
  AUTOCOMPLETE_REQUEST_TIMEOUT_MS 
} from './config';
import { searchOmdbMovies } from './omdb';
import { searchTvMazeShows } from './tvmaze';
import type { MovieAutocompleteResult } from './types';

const getMovieAutocompleteResultKey = (result: MovieAutocompleteResult): string =>
  `${sanitizeInput(result.title).toLowerCase()}|${sanitizeInput(result.year || '').toLowerCase()}|${result.type}`;

export const mergeMovieAutocompleteResults = (
  movieResults: MovieAutocompleteResult[],
  seriesResults: MovieAutocompleteResult[]
): MovieAutocompleteResult[] => {
  const allResults = [...movieResults, ...seriesResults];
  
  // Remove duplicates based on title, year, and type
  const uniqueResults = allResults.filter((result, index, arr) => 
    arr.findIndex(item => 
      getMovieAutocompleteResultKey(item) === getMovieAutocompleteResultKey(result)
    ) === index
  );

  return uniqueResults
    .sort((a, b) => {
      // Prioritize exact title matches
      const aScore = a.title.toLowerCase() === a.title.toLowerCase() ? 2 : 1;
      const bScore = b.title.toLowerCase() === b.title.toLowerCase() ? 2 : 1;
      
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      
      // Then sort by title
      return a.title.localeCompare(b.title);
    })
    .slice(0, MOVIE_AUTOCOMPLETE_RESULT_LIMIT);
};

export const searchMovieAutocomplete = async (
  query: string,
  options: { signal?: AbortSignal } = {}
): Promise<MovieAutocompleteResult[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    const [omdbResults, tvMazeResults] = await Promise.allSettled([
      searchOmdbMovies(query, options.signal),
      searchTvMazeShows(query, options.signal)
    ]);

    const successfulOmdbResults = omdbResults.status === 'fulfilled' ? omdbResults.value : [];
    const successfulTvMazeResults = tvMazeResults.status === 'fulfilled' ? tvMazeResults.value : [];

    const omdbLimited = successfulOmdbResults.slice(0, MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT);
    const tvMazeLimited = successfulTvMazeResults.slice(0, MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT);

    return mergeMovieAutocompleteResults(omdbLimited, tvMazeLimited);
  } catch (error) {
    throw new Error(`Movie autocomplete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
