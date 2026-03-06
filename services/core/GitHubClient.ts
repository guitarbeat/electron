/**
 * Unified GitHub Gist client for all services
 * Consolidates duplicate GitHub API logic
 */

import { GIST_API_URL } from '../../config/gistConfig.ts';

export interface GistFile {
  content?: string;
}

export interface GistPayload {
  files: Record<string, GistFile | undefined>;
}

export interface FetchOptions {
  token?: string;
  eTag?: string | null;
  cache?: RequestCache;
}

export interface PatchOptions {
  token?: string;
  filename: string;
  content: string;
}

class GitHubClient {
  /**
   * Fetch gist with optional ETag caching
   */
  async fetchGist(options: FetchOptions = {}): Promise<Response> {
    const headers = this.buildHeaders(options.token, options.eTag);
    
    return fetch(GIST_API_URL, {
      headers,
      cache: options.cache ?? 'no-cache',
    });
  }

  /**
   * Patch a single file in a gist
   */
  async patchGistFile(options: PatchOptions): Promise<Response> {
    const headers = this.buildHeaders(options.token);
    
    return fetch(GIST_API_URL, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        files: {
          [options.filename]: { content: options.content },
        },
      }),
    });
  }

  /**
   * Fetch with direct API call (bypassing gist client for special cases)
   */
  async fetchDirect(cache: RequestCache = 'default'): Promise<any> {
    const response = await fetch(GIST_API_URL, {
      cache,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${import.meta.env.VITE_GIST_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch gist: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Extract file content from gist payload
   */
  getFileContent(gist: GistPayload, filename: string): string | null {
    const file = gist.files[filename];
    if (!file || !file.content) {
      return null;
    }
    return file.content;
  }

  /**
   * Build GitHub API error message
   */
  async buildErrorMessage(response: Response): Promise<string> {
    let message = `GitHub API responded with ${response.status}.`;
    try {
      const errorBody = await response.clone().json();
      if (errorBody?.message) {
        message += ` GitHub says: "${errorBody.message}".`;
      }
    } catch {
      // Ignore parse errors and keep the status-only message
    }
    return message;
  }

  /**
   * Build request headers
   */
  private buildHeaders(token?: string, eTag?: string | null): Record<string, string> {
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
  }
}

export const gitHubClient = new GitHubClient();
