import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { getMovies, saveMovies } from './movieService.ts';
import { GIST_FILENAME, GIST_API_URL } from '../gistConfig.ts';
import type { Movie } from '../types.ts';

const mockMovies: Movie[] = [
  {
    id: '1',
    title: 'Test Movie',
    addedBy: 'Aaron',
    watchedBy: [],
    createdAt: '2023-01-01T00:00:00.000Z',
  },
];

test('getMovies returns movies when Gist fetch is successful', async () => {
  const mockFetch = mock.method(global, 'fetch', async () => {
    return {
      ok: true,
      json: async () => ({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(mockMovies),
          },
        },
      }),
    } as Response;
  });

  try {
    const movies = await getMovies();
    assert.deepEqual(movies, mockMovies);
    assert.equal(mockFetch.mock.calls.length, 1);
    const [url] = mockFetch.mock.calls[0].arguments;
    assert.equal(url, GIST_API_URL);
  } finally {
    mockFetch.mock.restore();
  }
});

test('getMovies returns empty array if file is missing in Gist', async () => {
  const mockFetch = mock.method(global, 'fetch', async () => {
    return {
      ok: true,
      json: async () => ({
        files: {},
      }),
    } as Response;
  });

  try {
    // Mock console.error to avoid noise in test output
    const mockConsoleError = mock.method(console, 'error', () => {});

    const movies = await getMovies();
    assert.deepEqual(movies, []);

    mockConsoleError.mock.restore();
  } finally {
    mockFetch.mock.restore();
  }
});

test('getMovies returns empty array if file content is empty', async () => {
  const mockFetch = mock.method(global, 'fetch', async () => {
    return {
      ok: true,
      json: async () => ({
        files: {
          [GIST_FILENAME]: {
            content: '',
          },
        },
      }),
    } as Response;
  });

  try {
    const movies = await getMovies();
    assert.deepEqual(movies, []);
  } finally {
    mockFetch.mock.restore();
  }
});

test('getMovies throws error on network failure', async () => {
  const mockFetch = mock.method(global, 'fetch', async () => {
    return {
      ok: false,
      status: 500,
    } as Response;
  });

  try {
    // Mock console.error to avoid noise
    const mockConsoleError = mock.method(console, 'error', () => {});

    await assert.rejects(getMovies(), /GitHub API responded with 500/);

    mockConsoleError.mock.restore();
  } finally {
    mockFetch.mock.restore();
  }
});

test('saveMovies calls fetch with correct parameters', async () => {
  const mockFetch = mock.method(global, 'fetch', async () => {
    return {
      ok: true,
      json: async () => ({}),
    } as Response;
  });

  try {
    await saveMovies(mockMovies);

    assert.equal(mockFetch.mock.calls.length, 1);
    const [url, options] = mockFetch.mock.calls[0].arguments;

    assert.equal(url, GIST_API_URL);
    assert.equal(options?.method, 'PATCH');

    const body = JSON.parse(options?.body as string);
    const content = JSON.parse(body.files[GIST_FILENAME].content);

    assert.deepEqual(content, mockMovies);
  } finally {
    mockFetch.mock.restore();
  }
});

test('saveMovies throws error on network failure', async () => {
  const mockFetch = mock.method(global, 'fetch', async () => {
    return {
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' }),
    } as Response;
  });

  try {
    const mockConsoleError = mock.method(console, 'error', () => {});

    await assert.rejects(saveMovies(mockMovies), /GitHub API responded with 500/);

    mockConsoleError.mock.restore();
  } finally {
    mockFetch.mock.restore();
  }
});
