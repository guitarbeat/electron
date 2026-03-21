import { MAX_MOVIE_TITLE_LENGTH, sanitizeInput } from '../utils/shared.ts';

export const SHARED_SUGGESTION_TITLE_PARAM = 'sharedMovie';
export const SHARED_SUGGESTION_BY_PARAM = 'sharedBy';

const DEFAULT_SUGGESTER = 'Someone';

export interface SharedSuggestionIntent {
  title: string;
  suggestedBy: string;
}

const normalizeSharedValue = (value: string | null): string => sanitizeInput(value ?? '');

export const parseSharedSuggestionIntent = (search: string): SharedSuggestionIntent | null => {
  const params = new URLSearchParams(search);
  const title = normalizeSharedValue(params.get(SHARED_SUGGESTION_TITLE_PARAM));

  if (!title || title.length > MAX_MOVIE_TITLE_LENGTH) {
    return null;
  }

  const suggestedBy = normalizeSharedValue(params.get(SHARED_SUGGESTION_BY_PARAM));

  return {
    title,
    suggestedBy: suggestedBy || DEFAULT_SUGGESTER,
  };
};

export const buildSharedSuggestionUrl = (
  currentUrl: string,
  intent: SharedSuggestionIntent
): string => {
  const title = sanitizeInput(intent.title);

  if (!title) {
    throw new Error('Movie title is required to create a share link.');
  }

  if (title.length > MAX_MOVIE_TITLE_LENGTH) {
    throw new Error(
      `Movie title exceeds maximum length of ${MAX_MOVIE_TITLE_LENGTH} characters`
    );
  }

  const url = new URL(currentUrl);
  url.searchParams.set(SHARED_SUGGESTION_TITLE_PARAM, title);
  url.searchParams.set(
    SHARED_SUGGESTION_BY_PARAM,
    sanitizeInput(intent.suggestedBy) || DEFAULT_SUGGESTER
  );
  return url.toString();
};

export const clearSharedSuggestionParams = (currentUrl: string): string => {
  const url = new URL(currentUrl);
  url.searchParams.delete(SHARED_SUGGESTION_TITLE_PARAM);
  url.searchParams.delete(SHARED_SUGGESTION_BY_PARAM);
  return url.toString();
};

export const clearCurrentSharedSuggestionParams = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const nextUrl = clearSharedSuggestionParams(window.location.href);
  window.history.replaceState(window.history.state, '', nextUrl);
};
