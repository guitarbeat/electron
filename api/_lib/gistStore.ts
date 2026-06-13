import { fetchWithRetry } from './retryFetch.ts';

const GIST_API_BASE_URL = 'https://api.github.com/gists';
const GIST_CACHE_TTL_MS = 30000;

interface GistFile {
  content?: string;
}

interface GistResponse {
  files: Record<string, GistFile | undefined>;
}

interface CachedGist {
  expiresAt: number;
  data: GistResponse;
}

let gistCache: CachedGist | null = null;

export interface GistFileRecord {
  exists: boolean;
  content: string | null;
}

const cleanEnvValue = (value: string | undefined): string => {
  let normalized = (value || '').trim();

  while (
    normalized.length >= 2 &&
    ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'")))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized;
};

const normalizeGistId = (value: string | undefined): string => {
  const normalized = cleanEnvValue(value);
  if (!normalized) {
    return '';
  }

  try {
    const parsed = new URL(normalized);
    const segments = parsed.pathname.split('/').filter(Boolean);

    if (
      (parsed.hostname === 'gist.github.com' || parsed.hostname === 'www.gist.github.com') &&
      segments.length >= 2
    ) {
      return segments[segments.length - 1] || '';
    }

    if (parsed.hostname === 'api.github.com' && segments[0] === 'gists' && segments[1]) {
      return segments[1];
    }
  } catch {
    // Fall back to treating the value as a raw gist id.
  }

  return normalized;
};

const getGistId = (): string => normalizeGistId(process.env.GIST_ID || process.env.VITE_GIST_ID);

const getGitHubToken = (): string =>
  cleanEnvValue(
    process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GH_TOKEN
  );

/** Returns true when a legacy GitHub Gist id is configured. */
export const isGistConfigured = (): boolean => Boolean(getGistId());

const getGitHubHeaders = (options: { includeAuthorization?: boolean } = {}): Headers => {
  const headers = new Headers({
    Accept: 'application/vnd.github+json',
    'User-Agent': 'movie-watch-state-server',
  });

  const token = getGitHubToken();
  if (token && options.includeAuthorization !== false) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
};

const getGistUrl = (): string => {
  const gistId = getGistId();
  if (!gistId) {
    throw new Error('GIST_ID is not configured.');
  }

  return `${GIST_API_BASE_URL}/${encodeURIComponent(gistId)}`;
};

const fetchGist = async (bypassCache: boolean = false): Promise<GistResponse> => {
  if (!bypassCache && gistCache && Date.now() < gistCache.expiresAt) {
    return gistCache.data;
  }

  const gistUrl = getGistUrl();
  const token = getGitHubToken();
  const headersWithToken = getGitHubHeaders();
  let response = await fetchWithRetry(
    gistUrl,
    { method: 'GET', headers: headersWithToken },
    'read gist'
  );

  const firstAttemptStatus = response.status;

  if (
    !response.ok &&
    token &&
    (response.status === 401 || response.status === 403) &&
    headersWithToken.has('Authorization')
  ) {
    response = await fetchWithRetry(
      gistUrl,
      {
        method: 'GET',
        headers: getGitHubHeaders({ includeAuthorization: false }),
      },
      'read gist without auth'
    );
  }

  if (!response.ok) {
    if (token && (firstAttemptStatus === 401 || firstAttemptStatus === 403)) {
      throw new Error(
        `Failed to read gist (auth rejected: ${firstAttemptStatus}; anonymous retry: ${response.status}).`
      );
    }

    throw new Error(`Failed to read gist (${response.status}).`);
  }

  let gist: GistResponse;
  try {
    gist = (await response.json()) as GistResponse;
  } catch {
    throw new Error('Failed to read gist (invalid JSON response).');
  }
  gistCache = {
    expiresAt: Date.now() + GIST_CACHE_TTL_MS,
    data: gist,
  };
  return gist;
};

export const invalidateGistCache = (): void => {
  gistCache = null;
};

export const readGistFileRecord = async (
  filename: string,
  options: { bypassCache?: boolean } = {}
): Promise<GistFileRecord> => {
  const gist = await fetchGist(options.bypassCache);
  const file = gist.files?.[filename];

  if (!file) {
    return {
      exists: false,
      content: null,
    };
  }

  return {
    exists: true,
    content: file.content ?? null,
  };
};

export const listGistFilenames = async (
  options: { bypassCache?: boolean } = {}
): Promise<string[]> => {
  const gist = await fetchGist(options.bypassCache);
  return Object.keys(gist.files ?? {}).sort();
};
