// Security constants for input validation
export const MAX_MESSAGE_LENGTH = 500;
export const MAX_AUTHOR_LENGTH = 50;
export const MAX_MOVIE_TITLE_LENGTH = 200;

/**
 * Sanitizes input string by removing control characters and trimming whitespace.
 * This helps prevent injection attacks and storage of malformed data.
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  // Remove control characters (except newlines/tabs which might be valid in some contexts, but let's be strict for now)
  // \x00-\x1F include control chars like NULL, BEL, etc.
  // We allow newlines for messages but maybe not for authors/titles?
  // Let's stick to a safe default: remove all control chars except common whitespace.
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '').trim();
};

/**
 * Validates if a string is a valid URL with http or https protocol.
 * This helps prevent XSS attacks via javascript: URIs.
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};
