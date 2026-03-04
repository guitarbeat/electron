import { GIST_TOKEN, GIST_API_URL, GIST_ID } from '../config/gistConfig';

export interface GistServiceConfig<T> {
  filename: string;
  mockData: T[];
  typeName: string;
}

export interface GistFile {
  content?: string;
}

export interface GistResponse {
  files: Record<string, GistFile>;
}

const createGistService = <T>({ filename, mockData, typeName }: GistServiceConfig<T>) => {
  let cachedData: T[] = [];
  let lastETag: string | null = null;

  const fetchData = async (): Promise<T[]> => {
    try {
      // If credentials are missing, use mock data instead of erroring
      if (!GIST_TOKEN?.trim() || !GIST_ID?.trim()) {
        console.warn(
          `GitHub credentials not configured. Using mock ${typeName.toLowerCase()} data. Set VITE_GIST_TOKEN and VITE_GIST_ID to use real data.`
        );
        return mockData;
      }

      const headers: Record<string, string> = {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      };

      // Use ETag for conditional request if available
      if (lastETag) {
        headers['If-None-Match'] = lastETag;
      }

      const response = await fetch(GIST_API_URL, {
        headers,
        cache: 'no-cache',
      });

      // If the content hasn't changed, return the cached version
      if (response.status === 304) {
        return cachedData;
      }

      if (!response.ok) {
        const { status } = response;
        // Return mock data for 401/403 auth errors instead of throwing
        if (status === 401 || status === 403) {
          console.warn(
            `GitHub API returned ${status}. Falling back to mock ${typeName.toLowerCase()} data.`
          );
          return mockData;
        }
        let msg = `GitHub API responded with ${status}.`;
        try {
          const errBody = await response.clone().json();
          if (errBody?.message) msg += ` GitHub says: "${errBody.message}".`;
        } catch {
          /* ignore parse error */
        }
        if (status === 404) {
          msg +=
            ' Check that VITE_GIST_ID matches your Gist. Restart the dev server after changing .env.';
        }
        throw new Error(msg);
      }

      const gist: GistResponse = await response.json();
      const file = gist.files[filename];

      if (!file) {
        const hint = `Your Gist must contain a file named "${filename}" with a JSON array of ${typeName.toLowerCase()} objects. Create that file in the Gist (e.g. paste []) and save then refresh.`;
        console.error(hint);
        throw new Error(`Gist is missing "${filename}". ${hint}`);
      }

      if (!file.content) {
        return [];
      }

      let data: T[];
      try {
        data = JSON.parse(file.content);
      } catch (parseErr) {
        throw new Error(
          `${filename} contains invalid JSON. It must be a JSON array of ${typeName.toLowerCase()} objects.`
        );
      }
      if (!Array.isArray(data)) {
        throw new Error(`${filename} must be a JSON array of ${typeName.toLowerCase()} objects.`);
      }

      // Update cache and ETag only after successful parsing
      cachedData = data;

      const etag = response.headers.get('ETag');
      if (etag) {
        lastETag = etag;
      }

      return data;
    } catch (error) {
      console.error(`Error fetching ${typeName.toLowerCase()} from Gist:`, error);
      // Return mock data as fallback when API fails
      console.warn(`Falling back to mock ${typeName.toLowerCase()} data`);
      return mockData;
    }
  };

  const saveData = async (data: T[]): Promise<void> => {
    try {
      const response = await fetch(GIST_API_URL, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${GIST_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          files: {
            [filename]: {
              content: JSON.stringify(data, null, 2), // Pretty-print the JSON
            },
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error('GitHub API error details:', errorBody);
        throw new Error(`GitHub API responded with ${response.status}`);
      }
    } catch (error) {
      console.error(`Error saving ${typeName.toLowerCase()} to Gist:`, error);
      throw error;
    }
  };

  return {
    fetchData,
    saveData,
  };
};

export default createGistService;
