import assert from "node:assert/strict";
import test from "node:test";

import {
  MOVIE_AUTOCOMPLETE_RESULT_LIMIT,
  MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT,
  searchMovieAutocomplete,
} from './metadataService.ts';
import { fetchOmdbMetadata, searchOmdbMovies } from './omdb.ts';

const originalFetch = globalThis.fetch;
const globalWithWindow = globalThis as typeof globalThis & { window?: unknown };
const originalWindow = globalWithWindow.window;

const resetWindow = () => {
  if (originalWindow === undefined) {
    Reflect.deleteProperty(globalWithWindow, "window");
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

test("searchMovieAutocomplete normalizes OMDb movie results and caps the per-source list size", async () => {
  setTestWindow("https://watch.example");

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/tvmaze") {
      return new Response("[]", {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    assert.equal(url.pathname, "/api/omdb");
    assert.equal(url.searchParams.get("s"), "Heat");
    assert.equal(url.searchParams.get("type"), "movie");

    const searchResults = Array.from(
      { length: MOVIE_AUTOCOMPLETE_RESULT_LIMIT + 2 },
      (_, index) => ({
        Title: index === 0 ? "Heat" : `Heat ${index}`,
        Year: index === 0 ? "1995" : `${2000 + index}`,
        imdbID: `tt00000${index}`,
        Type: "movie",
        Poster: index === 0 ? "http://images.example/heat.jpg" : "N/A",
      }),
    );

    return new Response(
      JSON.stringify({
        Response: "True",
        Search: searchResults,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  const results = await searchMovieAutocomplete("  Heat ");

  assert.equal(results.length, MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT);
  assert.deepEqual(results[0], {
    imdbID: "tt000000",
    poster: "https://images.example/heat.jpg",
    title: "Heat",
    type: "movie",
    year: "1995",
  });
  assert.equal(results[1]?.poster, undefined);
});

test("searchMovieAutocomplete returns an empty array when both providers succeed without matches", async () => {
  setTestWindow("https://watch.example");

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/omdb") {
      return new Response(
        JSON.stringify({
          Response: "False",
          Error: "Movie not found!",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }

    assert.equal(url.pathname, "/api/tvmaze");
    return new Response("[]", {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  const results = await searchMovieAutocomplete("Nope");

  assert.deepEqual(results, []);
});

test("searchMovieAutocomplete interleaves OMDb movies with TVMaze series results", async () => {
  setTestWindow("https://watch.example");

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/omdb") {
      return new Response(
        JSON.stringify({
          Response: "True",
          Search: Array.from(
            { length: MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT },
            (_, index) => ({
              Title: `Heat ${index + 1}`,
              Year: `199${index + 1}`,
              imdbID: `tt-heat-${index + 1}`,
              Type: "movie",
              Poster: "N/A",
            }),
          ),
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }

    assert.equal(url.pathname, "/api/tvmaze");
    assert.equal(url.searchParams.get("mode"), "search");
    assert.equal(url.searchParams.get("q"), "Heat");
    return new Response(
      JSON.stringify(
        Array.from(
          { length: MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT },
          (_, index) => ({
            score: 1,
            show: {
              id: index + 1,
              name: `Heat Series ${index + 1}`,
              premiered: `200${index + 1}-06-23`,
              image: {
                medium: `http://images.example/heat-series-${index + 1}.jpg`,
                original: `http://images.example/heat-series-${index + 1}-large.jpg`,
              },
            },
          }),
        ),
      ),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  const results = await searchMovieAutocomplete("Heat");

  assert.equal(results.length, MOVIE_AUTOCOMPLETE_RESULT_LIMIT);
  assert.deepEqual(
    results.map((result) => result.type),
    [
      "movie",
      "series",
      "movie",
      "series",
      "movie",
      "series",
      "movie",
      "series",
      "movie",
      "series",
    ],
  );
  assert.equal(results[0]?.title, "Heat 1");
  assert.equal(results[1]?.title, "Heat Series 1");
});

test("searchMovieAutocomplete returns partial results when one provider fails", async () => {
  setTestWindow("https://watch.example");

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/omdb") {
      return new Response(JSON.stringify({ error: "upstream failure" }), {
        status: 503,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    assert.equal(url.pathname, "/api/tvmaze");
    return new Response(
      JSON.stringify([
        {
          score: 1,
          show: {
            id: 11,
            name: "The Bear",
            premiered: "2022-06-23",
            image: {
              medium: "http://images.example/the-bear.jpg",
              original: "http://images.example/the-bear-large.jpg",
            },
          },
        },
      ]),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  const results = await searchMovieAutocomplete("The Bear");

  assert.deepEqual(results, [
    {
      imdbID: "tv-11",
      poster: "https://images.example/the-bear.jpg",
      title: "The Bear",
      type: "series",
      year: "2022",
    },
  ]);
});

test("searchMovieAutocomplete surfaces a precise error when both providers fail", async () => {
  setTestWindow("https://watch.example");

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/omdb") {
      return new Response(
        JSON.stringify({
          error: "OMDb rejected the configured API key.",
          code: "omdb_auth",
        }),
        {
          status: 502,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }

    assert.equal(url.pathname, "/api/tvmaze");
    return new Response(JSON.stringify({ error: "TVMaze unavailable" }), {
      status: 503,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  await assert.rejects(
    () => searchMovieAutocomplete("Heat"),
    /OMDb key was rejected/i,
  );
});

test("fetchOmdbMetadata falls back to requested title when API omits Title", async () => {
  setTestWindow("https://app.example");

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        Response: "True",
        Year: "2024",
        Plot: "Synopsis",
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );

  const meta = await fetchOmdbMetadata("Planet of the Bass");
  assert.equal(meta.title, "Planet of the Bass");
  assert.equal(meta.year, "2024");
});

test("searchOmdbMovies drops search rows with no usable title", async () => {
  setTestWindow("https://app.example");

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        Response: "True",
        Search: [
          { Year: "1995", imdbID: "tt0", Type: "movie", Poster: "N/A" },
          {
            Title: "Valid",
            Year: "2000",
            imdbID: "tt1",
            Type: "movie",
            Poster: "N/A",
          },
        ],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );

  const results = await searchOmdbMovies("x");
  assert.equal(results.length, 1);
  assert.equal(results[0]?.title, "Valid");
});

test("fetchOmdbMetadata surfaces a precise error on 401 Unauthorized", async () => {
  setTestWindow("https://app.example");

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });

  await assert.rejects(
    () => fetchOmdbMetadata("Test Movie"),
    /OMDb key was rejected/i,
  );
});

test("fetchOmdbMetadata surfaces a precise error on omdb_auth error code", async () => {
  setTestWindow("https://app.example");

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ code: "omdb_auth", error: "Invalid API key!" }),
      {
        status: 502, // API incorrectly returns 200 on this error occasionally, or 502, it shouldn't matter as we check JSON code
        headers: { "content-type": "application/json" },
      },
    );

  await assert.rejects(
    () => fetchOmdbMetadata("Test Movie"),
    /OMDb key was rejected/i,
  );
});

test("fetchOmdbMetadata surfaces status code for other HTTP errors", async () => {
  setTestWindow("https://app.example");

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });

  await assert.rejects(
    () => fetchOmdbMetadata("Test Movie"),
    /OMDb metadata fetch failed with status 404/i,
  );
});

test("fetchOmdbMetadata wraps unexpected fetch errors", async () => {
  setTestWindow("https://app.example");

  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  await assert.rejects(
    () => fetchOmdbMetadata("Test Movie"),
    /OMDb metadata fetch failed: Failed to fetch/i,
  );
});
