export const KNOWN_USERS = ['Aaron', 'Electra'] as const;
export type User = (typeof KNOWN_USERS)[number];
export const USER_OPTIONS: ReadonlyArray<User> = KNOWN_USERS;

export const MAX_MESSAGE_LENGTH = 500;
export const MAX_MOVIE_TITLE_LENGTH = 200;

export const isUser = (value: unknown): value is User =>
  typeof value === 'string' && (KNOWN_USERS as readonly string[]).includes(value);

export const parseJsonContent = (content: string, context: string): unknown => {
  try {
    return JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON in ${context}: ${message}`);
  }
};

export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return '';
  return input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '').trim();
};

export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const normalizeMovieTitle = (title: string): string =>
  title.trim().toLowerCase().replace(/\s+/g, ' ');

export const findMovieByNormalizedTitle = <T extends { title: string }>(
  movies: readonly T[],
  title: string
): T | undefined => {
  const normalized = normalizeMovieTitle(title);
  return movies.find((movie) => normalizeMovieTitle(movie.title) === normalized);
};

export const ensureFourDigitPin = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/\D/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
};

export const ensureBoolean = (value: unknown): boolean | null =>
  typeof value === 'boolean' ? value : null;
