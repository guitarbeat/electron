const env = (import.meta.env ?? {}) as ImportMetaEnv & {
  VITE_GIST_TOKEN?: string;
  VITE_GIST_ID?: string;
};

const clean = (value: string) => value.trim().replace(/^["']|["']$/g, '');

export const isGistReadConfigured = (gistId: string) => clean(gistId).length > 0;
export const isGistWriteConfigured = (gistId: string, token: string) =>
  isGistReadConfigured(gistId) && clean(token).length > 0;

export const GIST_TOKEN = clean(env.VITE_GIST_TOKEN || '');
export const GIST_ID = clean(env.VITE_GIST_ID || '');
export const canReadGist = isGistReadConfigured(GIST_ID);
export const canWriteGist = isGistWriteConfigured(GIST_ID, GIST_TOKEN);
export const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;
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
  token?: string;
  eTag?: string | null;
  cache?: RequestCache;
}

const buildHeaders = (token?: string, eTag?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (token?.trim()) {
    headers.Authorization = `token ${token}`;
  }

  if (eTag) {
    headers['If-None-Match'] = eTag;
  }

  return headers;
};

export const fetchGist = async (options: FetchGistOptions = {}): Promise<Response> =>
  fetch(GIST_API_URL, {
    headers: buildHeaders(options.token, options.eTag),
    cache: options.cache ?? 'no-cache',
  });

export const patchGistFile = async (
  filename: string,
  content: string,
  token?: string
): Promise<Response> =>
  fetch(GIST_API_URL, {
    method: 'PATCH',
    headers: buildHeaders(token),
    body: JSON.stringify({
      files: {
        [filename]: { content },
      },
    }),
  });

export const getGistFileContent = (gist: GistPayload, filename: string): string | null => {
  const file = gist.files[filename];
  if (!file || !file.content) {
    return null;
  }
  return file.content;
};

export const buildGithubApiErrorMessage = async (response: Response): Promise<string> => {
  let message = `GitHub API responded with ${response.status}.`;
  try {
    const errorBody = await response.clone().json();
    if (errorBody?.message) {
      message += ` GitHub says: "${errorBody.message}".`;
    }
  } catch {
    // Ignore parse errors and keep the status-only message.
  }
  return message;
};
