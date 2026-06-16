import type { MovieAutocompleteResult } from "@/services/metadata";

export const MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH = 2;
export const MOVIE_AUTOCOMPLETE_DEBOUNCE_MS = 160;

export const normalizeMovieAutocompleteQuery = (value: string): string =>
  value.trim().toLowerCase();

export const shouldFetchMovieAutocomplete = (
  query: string,
  selectedResult: MovieAutocompleteResult | null,
): boolean => {
  const normalizedQuery = normalizeMovieAutocompleteQuery(query);
  if (normalizedQuery.length < MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
    return false;
  }

  if (!selectedResult) {
    return true;
  }

  return (
    normalizeMovieAutocompleteQuery(selectedResult.title) !== normalizedQuery
  );
};

export const shouldClearSelectedMovieResult = (
  query: string,
  selectedResult: MovieAutocompleteResult | null,
): boolean => {
  if (!selectedResult) {
    return false;
  }

  return (
    normalizeMovieAutocompleteQuery(query) !==
    normalizeMovieAutocompleteQuery(selectedResult.title)
  );
};

export const hasStoredMovieAutocompleteFeedback = (
  query: string,
  cachedQuery: string,
  resultCount: number,
  error: string | null,
): boolean => {
  const normalizedQuery = normalizeMovieAutocompleteQuery(query);
  if (normalizedQuery.length < MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
    return false;
  }

  return normalizedQuery === cachedQuery && (resultCount > 0 || error !== null);
};

export const getMovieAutocompleteEnterSelectionIndex = (
  activeIndex: number,
  resultCount: number,
): number => {
  if (resultCount <= 0) {
    return -1;
  }

  if (activeIndex >= 0 && activeIndex < resultCount) {
    return activeIndex;
  }

  return 0;
};

export const getNextMovieAutocompleteIndex = (
  currentIndex: number,
  direction: "next" | "previous",
  resultCount: number,
): number => {
  if (resultCount <= 0) {
    return -1;
  }

  if (direction === "next") {
    if (currentIndex < 0 || currentIndex >= resultCount - 1) {
      return 0;
    }

    return currentIndex + 1;
  }

  if (currentIndex <= 0) {
    return resultCount - 1;
  }

  return currentIndex - 1;
};
