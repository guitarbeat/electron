const env = (import.meta.env ?? {}) as ImportMetaEnv & {
  VITE_GIST_ID?: string;
  VITE_GIST_API_URL?: string;
};

const clean = (value: string) => value.trim().replace(/^["']|["']$/g, '');
const LOCAL_OVERRIDE_PREFIX = 'movieList.localOverride.';
const resolveConfig = (value: string | undefined, fallback: string) => {
  const cleanedValue = clean(value || '');
  return cleanedValue.length > 0 ? cleanedValue : fallback;
};

export const isGistReadConfigured = (gistId: string) => clean(gistId).length > 0;
// Writes now go through the server-side proxy, so the client only needs the gist id
// to attempt a write. If the proxy cannot write, callers should fall back locally.
export const isGistWriteConfigured = (gistId: string) => isGistReadConfigured(gistId);

export const GIST_ID = clean(env.VITE_GIST_ID || '');
export const canReadGist = isGistReadConfigured(GIST_ID);
export const canWriteGist = isGistWriteConfigured(GIST_ID);
export const GIST_API_URL = resolveConfig(env.VITE_GIST_API_URL, '/api/gist');
export const GIST_FILENAME = 'movielist.json';
export const GIST_QUIZ_FILENAME = 'quiz.json';
export const GIST_SUGGESTIONS_FILENAME = 'suggestions.json';
export const GIST_MEMORIES_FILENAME = 'memories.json';
export const GIST_MATCHMAKER_FILENAME = 'matchmaker.json';
export const GIST_PLACES_FILENAME = 'places.json';

interface GistFile {
  content?: string;
}

interface GistPayload {
  files: Record<string, GistFile | undefined>;
}

interface FetchGistOptions {
  eTag?: string | null;
  cache?: RequestCache;
}

interface StoredJsonReadOptions<T> {
  storageKey: string;
  validate: (value: unknown) => value is T;
  clone: (value: T) => T;
  label: string;
}

interface StoredJsonWriteOptions<T> {
  storageKey: string;
  value: T;
  clone: (value: T) => T;
  label: string;
}

const buildHeaders = (eTag?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (eTag) {
    headers['If-None-Match'] = eTag;
  }

  return headers;
};

export const fetchGist = async (options: FetchGistOptions = {}): Promise<Response> =>
  fetch(GIST_API_URL, {
    headers: buildHeaders(options.eTag),
    cache: options.cache ?? 'no-cache',
  });

export const patchGistFile = async (filename: string, content: string): Promise<Response> =>
  fetch(GIST_API_URL, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [filename]: { content },
      },
    }),
  });

export const getGistFileContent = (gist: GistPayload, filename: string): string | null => {
  const file = gist.files?.[filename];
  if (!file || !file.content) {
    return null;
  }
  return file.content;
};

export const buildGithubApiErrorMessage = async (response: Response): Promise<string> => {
  let message = `API responded with ${response.status}.`;
  try {
    const errorBody = await response.clone().json();
    if (errorBody?.error) {
      message += ` Server says: "${errorBody.error}".`;
    }
  } catch {
    // Ignore parse errors and keep the status-only message.
  }
  return message;
};

const getLocalOverrideKey = (scope: string) => `${LOCAL_OVERRIDE_PREFIX}${scope}`;

export const readStoredJson = <T>({
  storageKey,
  validate,
  clone,
  label,
}: StoredJsonReadOptions<T>): T | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (validate(parsed)) {
      return clone(parsed);
    }
  } catch (error) {
    console.warn(`Failed to read ${label}.`, error);
  }

  return null;
};

export const writeStoredJson = <T>({
  storageKey,
  value,
  clone,
  label,
}: StoredJsonWriteOptions<T>): T => {
  const nextValue = clone(value);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextValue));
    } catch (error) {
      console.warn(`Failed to persist ${label}.`, error);
    }
  }

  return nextValue;
};

export const removeStoredJson = (storageKey: string, label: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn(`Failed to clear ${label}.`, error);
  }
};

export const hasLocalOverride = (scope: string): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(getLocalOverrideKey(scope)) === 'true';
};

export const readLocalOverride = <T>(
  scope: string,
  readStored: () => T | null
): { enabled: boolean; value: T | null } => {
  if (!hasLocalOverride(scope)) {
    return { enabled: false, value: null };
  }

  return { enabled: true, value: readStored() };
};

export const setLocalOverride = (scope: string, enabled: boolean): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (enabled) {
      window.localStorage.setItem(getLocalOverrideKey(scope), 'true');
    } else {
      window.localStorage.removeItem(getLocalOverrideKey(scope));
    }
  } catch (error) {
    console.warn(`Failed to update local override state for ${scope}.`, error);
  }
};

interface ReadGistJsonFileArgs<T> {
  scope: string;
  filename: string;
  fallback: () => T;
  onMissingFileWhenWritable: () => T;
  parse: (content: string) => T;
  fetchOptions?: FetchGistOptions;
}

/**
 * Saves data to a Gist file, falling back to local storage on failure.
 * Encapsulates the repeated try/catch/fallback pattern used across hooks.
 */
export const saveGistJson = async <T>(
  filename: string,
  scope: string,
  data: T,
  saveLocal: (data: T) => void
): Promise<void> => {
  if (!canWriteGist) {
    saveLocal(data);
    return;
  }

  try {
    const response = await patchGistFile(filename, JSON.stringify(data, null, 2));
    if (!response.ok) {
      console.warn(`Failed to save ${scope} to Gist (${response.status}), using local fallback.`);
      saveLocal(data);
      return;
    }
    setLocalOverride(scope, false);
  } catch (error) {
    console.warn(`Error saving ${scope} to Gist, using local fallback:`, error);
    saveLocal(data);
  }
};

export const readGistJsonFile = async <T>({
  scope,
  filename,
  fallback,
  onMissingFileWhenWritable,
  parse,
  fetchOptions,
}: ReadGistJsonFileArgs<T>): Promise<T> => {
  if (!canReadGist) {
    return fallback();
  }

  const localOverride = readLocalOverride(scope, () => fallback());
  if (localOverride.enabled) {
    return localOverride.value ?? fallback();
  }

  const response = await fetchGist({ cache: 'no-cache', ...(fetchOptions ?? {}) });
  if (!response.ok) {
    return fallback();
  }

  const gist = await response.json();
  const content = getGistFileContent(gist, filename);
  if (content === null) {
    if (!canWriteGist) {
      return fallback();
    }
    return onMissingFileWhenWritable();
  }

  return parse(content);
};
