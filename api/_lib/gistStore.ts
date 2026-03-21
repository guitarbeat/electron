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

const clean = (value: string | undefined): string =>
  (value || '').trim().replace(/^["']|["']$/g, '');

const getGistId = (): string => clean(process.env.GIST_ID);
const getGitHubToken = (): string => clean(process.env.GITHUB_TOKEN);

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
