import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { fetchMovieMetadata } from './metadataService.ts';

test('fetchMovieMetadata rejects malicious posterUrl and sanitizes plot', async () => {
  // Mock fetch to return a malicious OMDb response
  const mockFetch = mock.method(global, 'fetch', async () => {
    return {
      ok: true,
      json: async () => ({
        Response: 'True',
        Title: 'Malicious Movie',
        // eslint-disable-next-line no-script-url
        Poster: 'javascript:alert(1)',
        Year: '2023',
        Plot: 'A malicious plot \x00',
        Genre: 'Horror',
        Director: 'Evil Hacker',
        Type: 'movie',
      }),
    } as Response;
  });

  try {
    const result = await fetchMovieMetadata('Malicious Movie');

    // Malicious URL should be undefined
    assert.equal(result.posterUrl, undefined, 'Malicious posterUrl should be rejected');

    // Plot should be sanitized (control character \x00 removed)
    assert.equal(result.plot, 'A malicious plot', 'Plot should be sanitized');
  } finally {
    mockFetch.mock.restore();
  }
});

test('fetchMovieMetadata accepts valid posterUrl', async () => {
  const mockFetch = mock.method(global, 'fetch', async () => {
    return {
      ok: true,
      json: async () => ({
        Response: 'True',
        Title: 'Safe Movie',
        Poster: 'https://example.com/poster.jpg',
        Year: '2023',
        Plot: 'A safe plot',
        Genre: 'Drama',
        Director: 'Good Director',
        Type: 'movie',
      }),
    } as Response;
  });

  try {
    const result = await fetchMovieMetadata('Safe Movie');
    assert.equal(
      result.posterUrl,
      'https://example.com/poster.jpg',
      'Valid posterUrl should be accepted'
    );
  } finally {
    mockFetch.mock.restore();
  }
});
