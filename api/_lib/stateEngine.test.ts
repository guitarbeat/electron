import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as sharedStateStore from "./sharedStateStore.js";
import { buildProfileCookie } from "./session.js";
import { createMutateHandler, createReadHandler } from "./stateEngine.js";

function authedRequest(url: string, init: RequestInit = {}): Request {
  const mockReq = new Request(url);
  const cookie = buildProfileCookie(mockReq, "Aaron").split(";")[0];
  const headers = new Headers(init.headers);
  headers.set("cookie", cookie);
  return new Request(url, { ...init, headers });
}

describe("createReadHandler - error handling and fallback data", () => {
  it("returns 405 method not allowed when request method is not GET", async () => {
    const handler = createReadHandler("movies");
    const request = new Request("http://localhost/api/state/movies", {
      method: "POST",
    });

    const response = await handler(request);
    assert.strictEqual(response.status, 405);
  });

  it("returns degraded 200 JSON response with fallback data when readScopeStoredData throws", async () => {
    const originalDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgres://invalid:invalid@127.0.0.1:5432/invalid";
    sharedStateStore.invalidateSharedStateCache();

    try {
      const handler = createReadHandler("movies");
      const request = authedRequest("http://localhost/api/state/movies", {
        method: "GET",
      });

      const response = await handler(request);
      assert.strictEqual(response.status, 200);

      const body = (await response.json()) as {
        data: unknown;
        version: string;
        degraded: boolean;
        warning?: string;
      };

      assert.strictEqual(body.degraded, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(typeof body.version === "string");
      assert.ok(typeof body.warning === "string");
      assert.strictEqual(
        body.warning,
        "Shared state could not be loaded. Check server logs and Neon connectivity.",
      );
    } finally {
      if (originalDbUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalDbUrl;
      }
      sharedStateStore.invalidateSharedStateCache();
    }
  });

  it("returns degraded 200 JSON response when usesFallbackStore is true", async () => {
    const originalDbUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    sharedStateStore.invalidateSharedStateCache();

    try {
      const handler = createReadHandler("movies");
      const request = authedRequest("http://localhost/api/state/movies", {
        method: "GET",
      });

      const response = await handler(request);
      assert.strictEqual(response.status, 200);

      const body = (await response.json()) as {
        data: unknown;
        version: string;
        degraded: boolean;
        warning?: string;
      };

      assert.strictEqual(body.degraded, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(typeof body.version === "string");
      assert.strictEqual(
        body.warning,
        "Shared sync is unavailable because the server is missing DATABASE_URL. Set DATABASE_URL in your environment variables, then restart the server.",
      );
    } finally {
      if (originalDbUrl !== undefined) {
        process.env.DATABASE_URL = originalDbUrl;
      }
      sharedStateStore.invalidateSharedStateCache();
    }
  });

  it("returns 304 Not Modified when If-None-Match matches non-degraded state version", async () => {
    const store = sharedStateStore.installSharedStateMemoryStoreForTests({
      "movielist.json": JSON.stringify([
        {
          id: "m-1",
          title: "The Matrix",
          addedBy: "Aaron",
          watchedBy: [],
          createdAt: "2024-01-01T00:00:00Z",
        },
      ]),
    });

    try {
      const handler = createReadHandler("movies");
      const firstReq = authedRequest("http://localhost/api/state/movies", { method: "GET" });
      const firstRes = await handler(firstReq);
      assert.strictEqual(firstRes.status, 200);

      const body = (await firstRes.json()) as { version: string };
      const version = body.version;

      const etagReq = authedRequest("http://localhost/api/state/movies", {
        method: "GET",
        headers: { "if-none-match": `"${version}"` },
      });
      const etagRes = await handler(etagReq);
      assert.strictEqual(etagRes.status, 304);
      assert.strictEqual(etagRes.headers.get("etag"), `"${version}"`);
      assert.strictEqual(etagRes.headers.get("cache-control"), "no-store");
    } finally {
      store.dispose();
    }
  });

  it("returns degraded 200 JSON response (ignores 304) when If-None-Match matches degraded state version", async () => {
    const originalDbUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    sharedStateStore.invalidateSharedStateCache();

    try {
      const handler = createReadHandler("movies");
      const firstReq = authedRequest("http://localhost/api/state/movies", { method: "GET" });
      const firstRes = await handler(firstReq);
      const body = (await firstRes.json()) as { version: string; degraded: boolean };
      assert.strictEqual(body.degraded, true);

      const etagReq = authedRequest("http://localhost/api/state/movies", {
        method: "GET",
        headers: { "if-none-match": `"${body.version}"` },
      });
      const etagRes = await handler(etagReq);
      assert.strictEqual(etagRes.status, 200);
      const etagBody = (await etagRes.json()) as { degraded: boolean };
      assert.strictEqual(etagBody.degraded, true);
    } finally {
      if (originalDbUrl !== undefined) {
        process.env.DATABASE_URL = originalDbUrl;
      }
      sharedStateStore.invalidateSharedStateCache();
    }
  });

  it("handles outer catch exceptions and returns 200 degraded JSON response with fallback scope data", async () => {
    const handler = createReadHandler("movies");
    const throwingRequest = {
      method: "GET",
      get headers() {
        throw new Error("Unexpected header read failure");
      },
    } as unknown as Request;

    const response = await handler(throwingRequest);
    assert.strictEqual(response.status, 200);

    const body = (await response.json()) as {
      data: unknown;
      version: string;
      degraded: boolean;
      warning?: string;
    };

    assert.strictEqual(body.degraded, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(typeof body.version === "string");
    assert.strictEqual(
      body.warning,
      "Shared state could not be loaded. Check server logs and Neon connectivity.",
    );
  });

  it("returns 200 JSON response with non-degraded state when read succeeds", async () => {
    const store = sharedStateStore.installSharedStateMemoryStoreForTests({
      "movielist.json": JSON.stringify([
        {
          id: "m-1",
          title: "The Matrix",
          addedBy: "Aaron",
          watchedBy: [],
          createdAt: "2024-01-01T00:00:00Z",
        },
      ]),
    });

    try {
      const handler = createReadHandler("movies");
      const request = authedRequest("http://localhost/api/state/movies", {
        method: "GET",
      });

      const response = await handler(request);
      assert.strictEqual(response.status, 200);

      const body = (await response.json()) as {
        data: Array<{ id: string; title: string }>;
        version: string;
        degraded: boolean;
        warning?: string;
      };

      assert.strictEqual(body.degraded, false);
      assert.strictEqual(body.warning, undefined);
      assert.strictEqual(body.data.length, 1);
      assert.strictEqual(body.data[0].title, "The Matrix");
    } finally {
      store.dispose();
    }
  });
});

describe("createMutateHandler - parseMutationRequest error handling", () => {
  it("returns 400 bad request when request body is invalid JSON", async () => {
    const handler = createMutateHandler("movies");
    const request = authedRequest("http://localhost/api/state/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ invalid json",
    });

    const response = await handler(request);
    assert.strictEqual(response.status, 400);

    const body = (await response.json()) as { error: string };
    assert.strictEqual(body.error, "Invalid JSON payload.");
  });

  it("returns 400 bad request when request payload is missing required mutation fields", async () => {
    const handler = createMutateHandler("movies");
    const request = authedRequest("http://localhost/api/state/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseVersion: "1.0" }),
    });

    const response = await handler(request);
    assert.strictEqual(response.status, 400);

    const body = (await response.json()) as { error: string };
    assert.strictEqual(
      body.error,
      "Mutation requests must include baseVersion and op.",
    );
  });

  it("returns 400 bad request when parseMutationRequest throws a non-Error value", async () => {
    const throwingPayload = new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === "baseVersion") {
            throw "Non-error exception string";
          }
          return undefined;
        },
      },
    );

    const request = authedRequest("http://localhost/api/state/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    request.json = async () => throwingPayload;

    const handler = createMutateHandler("movies");
    const response = await handler(request);
    assert.strictEqual(response.status, 400);

    const body = (await response.json()) as { error: string };
    assert.strictEqual(body.error, "Invalid mutation request.");
  });
});
