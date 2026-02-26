/**
 * Google Places API key for Places autocomplete (Places tab).
 * Set VITE_GOOGLE_PLACES_API_KEY in .env and in Vercel Environment Variables.
 * Restrict the key by HTTP referrer in Google Cloud Console for production.
 */
const env = (import.meta.env || {}) as Record<string, string | undefined>;
export const GOOGLE_PLACES_API_KEY = env.VITE_GOOGLE_PLACES_API_KEY || '';
