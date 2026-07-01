/**
 * Shared configuration helpers for API handlers.
 */

/**
 * Returns `value` when it is a non-empty string after trimming, otherwise
 * returns `fallback`.  Useful for resolving environment-variable overrides.
 */
export const resolveConfig = (value: string | undefined, fallback: string): string => {
  const cleanedValue = (value || '').trim();
  return cleanedValue.length > 0 ? cleanedValue : fallback;
};
