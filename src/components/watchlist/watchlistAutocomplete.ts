import type { MovieAutocompleteResult } from '@/services/metadataService';

export const MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH = 2;
export const MOVIE_AUTOCOMPLETE_DEBOUNCE_MS = 220;

const normalizeAutocompleteTitle = (value: string): string => value.trim().toLowerCase();

export const shouldFetchMovieAutocomplete = (
  query: string,
  selectedResult: MovieAutocompleteResult | null
): boolean => {
  const normalizedQuery = normalizeAutocompleteTitle(query);
  if (normalizedQuery.length < MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
    return false;
  }

  if (!selectedResult) {
    return true;
  }

  return normalizeAutocompleteTitle(selectedResult.title) !== normalizedQuery;
};

export const shouldClearSelectedMovieResult = (
  query: string,
  selectedResult: MovieAutocompleteResult | null
): boolean => {
  if (!selectedResult) {
    return false;
  }

  return normalizeAutocompleteTitle(query) !== normalizeAutocompleteTitle(selectedResult.title);
};

export const getNextMovieAutocompleteIndex = (
  currentIndex: number,
  direction: 'next' | 'previous',
  resultCount: number
): number => {
  if (resultCount <= 0) {
    return -1;
  }

  if (direction === 'next') {
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
