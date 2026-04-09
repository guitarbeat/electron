const env = (import.meta.env ?? {}) as ImportMetaEnv & {
  VITE_OMDB_API_URL?: string;
  VITE_OMDB_API_KEY?: string;
  VITE_TVMAZE_API_URL?: string;
};

const clean = (value: string) => value.trim().replace(/^["']|["']$/g, '');

export const OMDB_API_KEY = clean((env.VITE_OMDB_API_KEY || ''));
export const OMDB_DEFAULT_BASE_URL = '/api/omdb';
export const TVMAZE_DEFAULT_BASE_URL = '/api/tvmaze';

export const resolveConfig = (value: string | undefined, fallback: string) => {
  const cleanedValue = clean(value || '');
  return cleanedValue.length > 0 ? cleanedValue : fallback;
};

export const OMDB_BASE = resolveConfig(env.VITE_OMDB_API_URL, OMDB_DEFAULT_BASE_URL);
export const TVMAZE_BASE = resolveConfig(env.VITE_TVMAZE_API_URL, TVMAZE_DEFAULT_BASE_URL);

export const METADATA_REQUEST_TIMEOUT_MS = 5000;
export const AUTOCOMPLETE_REQUEST_TIMEOUT_MS = 2500;
export const MOVIE_AUTOCOMPLETE_RESULT_LIMIT = 10;
export const MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT = 5;

export const OMDB_AUTH_FAILURE_CODE = 'omdb_auth';
export const OMDB_CONFIG_FAILURE_CODE = 'omdb_config';
