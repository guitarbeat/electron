// Security constants for input validation
export const MAX_MESSAGE_LENGTH = 500;
export const MAX_AUTHOR_LENGTH = 50;
export const MAX_MOVIE_TITLE_LENGTH = 200;

/**
 * Removes control characters from the input string and trims whitespace.
 * This function does NOT escape HTML characters. It is intended to prevent
 * storage of malformed data or terminal injection attacks.
 *
 * For XSS prevention in non-React contexts, use escapeHtml().
 */
export const stripControlCharacters = (input: string): string => {
  if (!input) return '';
  // Remove control characters (except newlines/tabs which might be valid in some contexts, but let's be strict for now)
  // \x00-\x1F include control chars like NULL, BEL, etc.
  // We allow newlines for messages but maybe not for authors/titles?
  // Let's stick to a safe default: remove all control chars except common whitespace.
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '').trim();
};

/**
 * Strips HTML tags from a string.
 * Note: This uses a basic regex and is not a robust XSS sanitizer.
 * It is intended for cleaning up data from trusted APIs (like OMDb plots).
 * Do not rely on this for untrusted user input if you need to prevent XSS.
 */
export const stripHtmlTags = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  return value.replace(/<[^>]*>?/gm, '');
};

/**
 * Escapes HTML special characters to prevent XSS.
 * Use this when rendering user input outside of React (e.g. constructing HTML strings).
 */
export const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Validates if a string is a safe URL (http/https).
 * This prevents javascript: or data: URLs which can be XSS vectors.
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};
