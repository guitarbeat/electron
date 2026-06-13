import { sanitizeInput } from "../../utils/shared.ts";
import {
  MOVIE_AUTOCOMPLETE_RESULT_LIMIT,
  MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT,
} from "./config.ts";
export {
  MOVIE_AUTOCOMPLETE_RESULT_LIMIT,
  MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT,
};
import { searchOmdbMovies } from "./omdb.ts";
import { searchTvMazeShows } from "./tvmaze.ts";
import type { MovieAutocompleteResult } from "./types.ts";

const getMovieAutocompleteResultKey = (
  result: MovieAutocompleteResult,
): string =>
  `${sanitizeInput(result.title).toLowerCase()}|${sanitizeInput(result.year || "").toLowerCase()}|${result.type}`;

export const mergeMovieAutocompleteResults = (
  movieResults: MovieAutocompleteResult[],
  seriesResults: MovieAutocompleteResult[],
  query?: string,
): MovieAutocompleteResult[] => {
  const normalizedQuery = (query || "").trim().toLowerCase();

  const getScore = (item: MovieAutocompleteResult): number => {
    if (!normalizedQuery) return 0;
    const norm = item.title.toLowerCase();
    if (norm === normalizedQuery) return 2;
    if (norm.startsWith(normalizedQuery)) return 1;
    return 0;
  };

  const uniqueScoredResults: {
    item: MovieAutocompleteResult;
    score: number;
  }[] = [];
  const seen = new Set<string>();

  const maxLen = Math.max(movieResults.length, seriesResults.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < movieResults.length) {
      const item = movieResults[i];
      const key = getMovieAutocompleteResultKey(item);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueScoredResults.push({ item, score: getScore(item) });
      }
    }
    if (i < seriesResults.length) {
      const item = seriesResults[i];
      const key = getMovieAutocompleteResultKey(item);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueScoredResults.push({ item, score: getScore(item) });
      }
    }
  }

  return uniqueScoredResults
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      // If same score, keep original order (interleaved)
      return 0;
    })
    .map((entry) => entry.item)
    .slice(0, MOVIE_AUTOCOMPLETE_RESULT_LIMIT);
};

export const searchMovieAutocomplete = async (
  query: string,
  options: { signal?: AbortSignal } = {},
): Promise<MovieAutocompleteResult[]> => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const [omdbResults, tvMazeResults] = await Promise.allSettled([
    searchOmdbMovies(trimmedQuery, options.signal),
    searchTvMazeShows(trimmedQuery, options.signal),
  ]);

  if (
    omdbResults.status === "rejected" &&
    tvMazeResults.status === "rejected"
  ) {
    throw omdbResults.reason;
  }

  const successfulOmdbResults =
    omdbResults.status === "fulfilled" ? omdbResults.value : [];
  const successfulTvMazeResults =
    tvMazeResults.status === "fulfilled" ? tvMazeResults.value : [];

  const omdbLimited = successfulOmdbResults.slice(
    0,
    MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT,
  );
  const tvMazeLimited = successfulTvMazeResults.slice(
    0,
    MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT,
  );

  return mergeMovieAutocompleteResults(omdbLimited, tvMazeLimited, query);
};
