const env = (import.meta.env ?? {}) as ImportMetaEnv & {
  VITE_GIST_ID?: string;
};

const clean = (value: string) => value.trim().replace(/^["']|["']$/g, '');

export const isGistReadConfigured = (gistId: string) => clean(gistId).length > 0;
// With the proxy, write access requires the server to be configured with a token,
// but the client itself no longer needs to know the token to consider write config valid.
// For now, we'll keep the function signature similar but drop the token check
export const isGistWriteConfigured = (gistId: string) => isGistReadConfigured(gistId);

export const GIST_ID = clean(env.VITE_GIST_ID || '');
export const canReadGist = isGistReadConfigured(GIST_ID);
// We assume if GIST_ID is provided, proxy can handle writes if token is on server
export const canWriteGist = isGistWriteConfigured(GIST_ID);
// Point to our new proxy endpoint
export const GIST_API_URL = `/api/gist`;

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
