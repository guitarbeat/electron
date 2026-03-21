const GIST_API_BASE_URL = 'https://api.github.com/gists';
const GIST_CACHE_TTL_MS = 5000;

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
const getGitHubToken = (): string => cleanEnvValue(process.env.GITHUB_TOKEN);

const getGitHubHeaders = (): Headers => {
  const headers = new Headers({
    Accept: 'application/vnd.github+json',
    'User-Agent': 'movie-watch-state-server',
  });

  const token = getGitHubToken();
  if (token) {
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

  const response = await fetch(getGistUrl(), {
    method: 'GET',
    headers: getGitHubHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to read gist (${response.status}).`);
  }

  const gist = (await response.json()) as GistResponse;
  gistCache = {
    expiresAt: Date.now() + GIST_CACHE_TTL_MS,
    data: gist,
  };
  return gist;
};

export const invalidateGistCache = (): void => {
  gistCache = null;
};

export const readGistFile = async (
  filename: string,
  options: { bypassCache?: boolean } = {}
): Promise<string | null> => {
  const gist = await fetchGist(options.bypassCache);
  return gist.files?.[filename]?.content ?? null;
};

export const patchGistFile = async (
  filename: string,
  content: string
): Promise<void> => {
  const token = getGitHubToken();
  if (!token) {
    throw new Error('GITHUB_TOKEN is not configured.');
  }

  const response = await fetch(getGistUrl(), {
    method: 'PATCH',
    headers: new Headers({
      ...Object.fromEntries(getGitHubHeaders()),
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      files: {
        [filename]: {
          content,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update gist (${response.status}).`);
  }

  invalidateGistCache();
};
