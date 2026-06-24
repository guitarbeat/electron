import test from "node:test";
import assert from "node:assert/strict";
import { searchOmdbMovies, fetchOmdbMetadata } from "./omdb.ts";

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
    location: { origin },
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

test("searchOmdbMovies throws specific error when OMDb key is rejected (401)", async () => {
  setTestWindow("https://watch.example");

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        Error: "Invalid API key!",
      }),
      {
        status: 401,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  await assert.rejects(() => searchOmdbMovies("Heat"), /OMDb key was rejected/);
});

test("searchOmdbMovies throws specific error when json contains omdb_auth code", async () => {
  setTestWindow("https://watch.example");

  globalThis.fetch = async () => {
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
  };

  await assert.rejects(() => searchOmdbMovies("Heat"), /OMDb key was rejected/);
});

test("searchOmdbMovies throws generic error when status is not ok and not 401/omdb_auth", async () => {
  setTestWindow("https://watch.example");

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        Error: "Something else went wrong",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  await assert.rejects(
    () => searchOmdbMovies("Heat"),
    /OMDb search failed with status 500/,
  );
});

test("searchOmdbMovies throws error on network failure", async () => {
  setTestWindow("https://watch.example");

  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  await assert.rejects(
    () => searchOmdbMovies("Heat"),
    /OMDb search failed: Failed to fetch/,
  );
});

test("fetchOmdbMetadata throws specific error when OMDb key is rejected (401)", async () => {
  setTestWindow("https://watch.example");

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        Error: "Invalid API key!",
      }),
      {
        status: 401,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  await assert.rejects(
    () => fetchOmdbMetadata("Heat"),
    /OMDb key was rejected/,
  );
});

test("fetchOmdbMetadata throws specific error when json contains omdb_auth code", async () => {
  setTestWindow("https://watch.example");

  globalThis.fetch = async () => {
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
  };

  await assert.rejects(
    () => fetchOmdbMetadata("Heat"),
    /OMDb key was rejected/,
  );
});

test("fetchOmdbMetadata throws generic error when status is not ok and not 401/omdb_auth", async () => {
  setTestWindow("https://watch.example");

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        Error: "Something else went wrong",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  await assert.rejects(
    () => fetchOmdbMetadata("Heat"),
    /OMDb metadata fetch failed with status 500/,
  );
});

test("fetchOmdbMetadata throws error on network failure", async () => {
  setTestWindow("https://watch.example");

  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };

  await assert.rejects(
    () => fetchOmdbMetadata("Heat"),
    /OMDb metadata fetch failed: fetch failed/,
  );
});
