import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { installSharedStateMemoryStoreForTests } from "./sharedStateStore.js";
import { createReadHandler } from "./stateEngine.js";

describe("createReadHandler", () => {
  it("returns 405 Method Not Allowed for non-GET requests", async () => {
    const handler = createReadHandler("movies");
    const request = new Request("http://localhost/api/movies", {
      method: "POST",
    });
    const response = await handler(request);

    assert.strictEqual(response.status, 405);
    assert.strictEqual(response.headers.get("Allow"), "GET");
  });

  it("returns state data and ETag for valid GET request with configured store", async () => {
    const sampleMovies = [
      {
        id: "test-1",
        title: "Test Movie",
        addedBy: "Aaron",
        watchedBy: [],
        createdAt: "2024-01-01T00:00:00Z",
      },
    ];
    const mem = installSharedStateMemoryStoreForTests({
      "movielist.json": JSON.stringify(sampleMovies),
    });

    try {
      const handler = createReadHandler("movies");
      const request = new Request("http://localhost/api/movies", {
        method: "GET",
      });
      const response = await handler(request);

      assert.strictEqual(response.status, 200);
      assert.ok(response.headers.get("ETag"));

      const body = await response.json();
      assert.deepEqual(body.data, sampleMovies);
      assert.strictEqual(body.degraded, false);
      assert.strictEqual(body.warning, undefined);
      assert.ok(typeof body.version === "string");
    } finally {
      mem.dispose();
    }
  });

  it("returns 304 Not Modified when matching if-none-match header is supplied and state is non-degraded", async () => {
    const sampleMovies = [
      {
        id: "test-1",
        title: "Test Movie",
        addedBy: "Aaron",
        watchedBy: [],
        createdAt: "2024-01-01T00:00:00Z",
      },
    ];
    const mem = installSharedStateMemoryStoreForTests({
      "movielist.json": JSON.stringify(sampleMovies),
    });

    try {
      const handler = createReadHandler("movies");
      const initialRequest = new Request("http://localhost/api/movies", {
        method: "GET",
      });
      const initialResponse = await handler(initialRequest);
      const etag = initialResponse.headers.get("ETag");
      assert.ok(etag);

      const cachedRequest = new Request("http://localhost/api/movies", {
        method: "GET",
        headers: { "if-none-match": etag },
      });
      const cachedResponse = await handler(cachedRequest);

      assert.strictEqual(cachedResponse.status, 304);
      assert.strictEqual(cachedResponse.headers.get("ETag"), etag);
    } finally {
      mem.dispose();
    }
  });

  it("falls back to buildFallbackScopeData when readScopeStoredData throws an error", async () => {
    const mem = installSharedStateMemoryStoreForTests({});
    const originalDbUrl = process.env.DATABASE_URL;
    // Set a dummy DATABASE_URL so isSharedStateConfigured() returns true and readScopeStoredData attempts read
    process.env.DATABASE_URL = "postgres://invalid:invalid@127.0.0.1:5432/invalid";

    try {
      // Disposing memory store while DATABASE_URL is set causes readFromDatabase to execute postgres query and throw an error
      mem.dispose();

      const handler = createReadHandler("movies");
      const request = new Request("http://localhost/api/movies", {
        method: "GET",
      });
      const response = await handler(request);

      assert.strictEqual(response.status, 200);

      const body = await response.json();
      assert.strictEqual(body.degraded, true);
      assert.ok(body.warning);
      assert.ok(Array.isArray(body.data)); // movies fallback data is array of default movies
      assert.ok(typeof body.version === "string");
    } finally {
      if (originalDbUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalDbUrl;
      }
    }
  });

  it("handles errors in outer try-catch block during request handling", async () => {
    const handler = createReadHandler("movies");
    // Passing an object that throws when headers are accessed to trigger outer catch
    const invalidRequest = {
      method: "GET",
      get headers() {
        throw new Error("Catastrophic header read failure");
      },
    } as unknown as Request;

    const response = await handler(invalidRequest);
    assert.strictEqual(response.status, 200);

    const body = await response.json();
    assert.strictEqual(body.degraded, true);
    assert.ok(body.warning);
    assert.ok(Array.isArray(body.data));
    assert.ok(typeof body.version === "string");
  });
});
