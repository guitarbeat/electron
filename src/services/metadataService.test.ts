import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MOVIE_AUTOCOMPLETE_RESULT_LIMIT,
  searchMovieAutocomplete,
} from './metadataService.ts';

const originalFetch = globalThis.fetch;
const globalWithWindow = globalThis as typeof globalThis & { window?: unknown };
const originalWindow = globalWithWindow.window;

const resetWindow = () => {
  if (originalWindow === undefined) {
    Reflect.deleteProperty(globalWithWindow, 'window');
    return;
  }

  globalWithWindow.window = originalWindow;
};

const setTestWindow = (origin: string) => {
  globalWithWindow.window = {
    location: {
      origin,
    },
  } as unknown as Window & typeof globalThis;
};

test.after(() => {
  globalThis.fetch = originalFetch;
  resetWindow();
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  resetWindow();
});

test('searchMovieAutocomplete normalizes OMDb movie results and caps the list size', async () => {
  setTestWindow('https://watch.example');

  globalThis.fetch = async (input) => {
    assert.match(String(input), /^https:\/\/watch\.example\/api\/omdb\?/);
    assert.match(String(input), /s=Heat/);
    assert.match(String(input), /type=movie/);

    const searchResults = Array.from({ length: MOVIE_AUTOCOMPLETE_RESULT_LIMIT + 2 }, (_, index) => ({
      Title: index === 0 ? 'Heat' : `Heat ${index}`,
      Year: index === 0 ? '1995' : `${2000 + index}`,
      imdbID: `tt00000${index}`,
      Type: 'movie',
      Poster: index === 0 ? 'http://images.example/heat.jpg' : 'N/A',
    }));

    return new Response(
      JSON.stringify({
        Response: 'True',
        Search: searchResults,
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }
    );
  };

  const results = await searchMovieAutocomplete('  Heat ');

  assert.equal(results.length, MOVIE_AUTOCOMPLETE_RESULT_LIMIT);
  assert.deepEqual(results[0], {
    imdbID: 'tt000000',
    posterUrl: 'https://images.example/heat.jpg',
    title: 'Heat',
    type: 'movie',
    year: '1995',
  });
  assert.equal(results[1]?.posterUrl, undefined);
});

test('searchMovieAutocomplete returns an empty array when OMDb reports no results', async () => {
  setTestWindow('https://watch.example');

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === '/api/omdb') {
      return new Response(
        JSON.stringify({
          Response: 'False',
          Error: 'Movie not found!',
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }

    assert.equal(url.pathname, '/api/tvmaze');
    return new Response('[]', {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  };

  const results = await searchMovieAutocomplete('Nope');

  assert.deepEqual(results, []);
});

test('searchMovieAutocomplete falls back to TVMaze results when OMDb has no matches', async () => {
  setTestWindow('https://watch.example');

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === '/api/omdb') {
      return new Response(
        JSON.stringify({
          Response: 'False',
          Error: 'Movie not found!',
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }

    assert.equal(url.pathname, '/api/tvmaze');
    assert.equal(url.searchParams.get('mode'), 'search');
    assert.equal(url.searchParams.get('q'), 'The Bear');
    return new Response(
      JSON.stringify([
        {
          score: 1,
          show: {
            id: 11,
            name: 'The Bear',
            premiered: '2022-06-23',
            image: {
              medium: 'http://images.example/the-bear.jpg',
              original: 'http://images.example/the-bear-large.jpg',
            },
          },
        },
      ]),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }
    );
  };

  const results = await searchMovieAutocomplete('The Bear');

  assert.deepEqual(results, [
    {
      imdbID: 'tv-11',
      posterUrl: 'https://images.example/the-bear.jpg',
      title: 'The Bear',
      type: 'series',
      year: '2022',
    },
  ]);
});

test('searchMovieAutocomplete surfaces a precise OMDb auth/config message when fallback is empty', async () => {
  setTestWindow('https://watch.example');

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === '/api/omdb') {
      return new Response(
        JSON.stringify({
          error: 'OMDb rejected the configured API key.',
          code: 'omdb_auth',
        }),
        {
          status: 502,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }

    assert.equal(url.pathname, '/api/tvmaze');
    return new Response('[]', {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  };

  await assert.rejects(
    () => searchMovieAutocomplete('Heat'),
    /OMDb key was rejected/i
  );
});
