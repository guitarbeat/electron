import { sanitizeInput } from '../../utils/shared';
import { 
  MOVIE_AUTOCOMPLETE_RESULT_LIMIT, 
  MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT,

} from './config';
export { MOVIE_AUTOCOMPLETE_RESULT_LIMIT, MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT };
import { searchOmdbMovies } from './omdb';
import { searchTvMazeShows } from './tvmaze';
import type { MovieAutocompleteResult } from './types';

const getMovieAutocompleteResultKey = (result: MovieAutocompleteResult): string =>
  `${sanitizeInput(result.title).toLowerCase()}|${sanitizeInput(result.year || '').toLowerCase()}|${result.type}`;

export const mergeMovieAutocompleteResults = (
  movieResults: MovieAutocompleteResult[],
  seriesResults: MovieAutocompleteResult[],
  query?: string
): MovieAutocompleteResult[] => {
  const allResults = [...movieResults, ...seriesResults];
  
  const uniqueResults = allResults.filter((result, index, arr) => 
    arr.findIndex(item => 
      getMovieAutocompleteResultKey(item) === getMovieAutocompleteResultKey(result)
    ) === index
  );

  const normalizedQuery = query ? query.trim().toLowerCase() : '';

  return uniqueResults
    .sort((a, b) => {
      const aNorm = a.title.toLowerCase();
      const bNorm = b.title.toLowerCase();

      const getScore = (norm: string): number => {
        if (!normalizedQuery) return 0;
        if (norm === normalizedQuery) return 2;
        if (norm.startsWith(normalizedQuery)) return 1;
        return 0;
      };

      const aScore = getScore(aNorm);
      const bScore = getScore(bNorm);

      if (aScore !== bScore) {
        return bScore - aScore;
      }

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

    return mergeMovieAutocompleteResults(omdbLimited, tvMazeLimited, query);
  } catch (error) {
    throw new Error(`Movie autocomplete failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { cause: error });
  }
};
