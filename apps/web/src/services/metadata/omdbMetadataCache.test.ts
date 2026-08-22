import test from "node:test";
import assert from "node:assert/strict";
import { fetchOmdbMetadataCached, _clearCache } from "./index.ts";

const originalFetch = globalThis.fetch;
const originalDateNow = Date.now;
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

let fetchCallCount = 0;
let currentTime = 1000000;

const mockFetchSuccess = (title: string, imdbID?: string, type?: string) => {
  fetchCallCount = 0;
  globalThis.fetch = async () => {
    fetchCallCount++;
    return new Response(
      JSON.stringify({
        Title: title,
        Year: "2024",
        imdbID: imdbID || "tt1234567",
        Type: type || "movie",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };
};

const mockFetchError = () => {
  fetchCallCount = 0;
  globalThis.fetch = async () => {
    fetchCallCount++;
    return new Response(
      JSON.stringify({
        Error: "Something went wrong",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };
};

test.beforeEach(() => {
  fetchCallCount = 0;
  currentTime = 1000000;
  Date.now = () => currentTime;
  _clearCache();
  setTestWindow("https://watch.example");
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  Date.now = originalDateNow;
  resetWindow();
});

test.after(() => {
  globalThis.fetch = originalFetch;
  Date.now = originalDateNow;
  resetWindow();
});

test("fetchOmdbMetadataCached returns cached promise for the same query", async () => {
  mockFetchSuccess("Inception");

  const promise1 = fetchOmdbMetadataCached("Inception", "movie");
  const promise2 = fetchOmdbMetadataCached("Inception", "movie");

  assert.equal(promise1, promise2);

  await Promise.all([promise1, promise2]);

  assert.equal(fetchCallCount, 1);
});

test("fetchOmdbMetadataCached evicts failed requests from cache", async () => {
  mockFetchError();

  await assert.rejects(
    () => fetchOmdbMetadataCached("Failing Movie"),
    /OMDb metadata fetch failed with status 500/
  );
  assert.equal(fetchCallCount, 1);

  mockFetchSuccess("Failing Movie");
  await fetchOmdbMetadataCached("Failing Movie");
  assert.equal(fetchCallCount, 1);
});

test("fetchOmdbMetadataCached handles TTL invalidation", async () => {
  mockFetchSuccess("Inception");

  await fetchOmdbMetadataCached("Inception");
  assert.equal(fetchCallCount, 1);

  currentTime += 1000;
  await fetchOmdbMetadataCached("Inception");
  assert.equal(fetchCallCount, 1);

  currentTime += 30 * 60 * 1000;
  await fetchOmdbMetadataCached("Inception");
  assert.equal(fetchCallCount, 2);
});

test("fetchOmdbMetadataCached handles max cache size invalidation (LRU eviction)", async () => {
  mockFetchSuccess("Movie");

  const promises = [];
  for (let i = 0; i < 200; i++) {
    currentTime += 10;
    promises.push(fetchOmdbMetadataCached(`Movie ${i}`));
  }
  await Promise.all(promises);
  assert.equal(fetchCallCount, 200);

  currentTime += 10;
  await fetchOmdbMetadataCached("New Movie");
  assert.equal(fetchCallCount, 201);

  currentTime += 10;
  await fetchOmdbMetadataCached("Movie 0");
  assert.equal(fetchCallCount, 202);

  currentTime += 10;
  await fetchOmdbMetadataCached("Movie 1");
  assert.equal(fetchCallCount, 203);
});

test("fetchOmdbMetadataCached updates timestamp on read (LRU behavior)", async () => {
  mockFetchSuccess("Movie");

  await fetchOmdbMetadataCached("Movie A");
  assert.equal(fetchCallCount, 1);

  currentTime += 10;
  await fetchOmdbMetadataCached("Movie B");
  assert.equal(fetchCallCount, 2);

  currentTime += 10;
  await fetchOmdbMetadataCached("Movie A");
  assert.equal(fetchCallCount, 2);

  const promises = [];
  for (let i = 0; i < 198; i++) {
    currentTime += 10;
    promises.push(fetchOmdbMetadataCached(`Movie Filler ${i}`));
  }
  await Promise.all(promises);
  assert.equal(fetchCallCount, 200);

  currentTime += 10;
  await fetchOmdbMetadataCached("New Movie");
  assert.equal(fetchCallCount, 201);

  currentTime += 10;
  await fetchOmdbMetadataCached("Movie B");
  assert.equal(fetchCallCount, 202);
});
