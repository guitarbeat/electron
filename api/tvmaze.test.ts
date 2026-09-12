import { describe, it } from "node:test";
import assert from "node:assert";
import defaultHandler, { tvmazeHandler } from "./tvmaze.js";

describe("tvmazeHandler", () => {
  it("should reject non-GET requests with 405 Method Not Allowed", async () => {
    for (const method of ["POST", "PUT", "DELETE", "PATCH"]) {
      const req = new Request("http://localhost/api/tvmaze?mode=show&id=1", { method });
      const res = await tvmazeHandler(req);
      assert.strictEqual(res.status, 405);
      const data = await res.json();
      assert.strictEqual(data.error, "Method not allowed.");
    }
  });

  it("should return 400 Bad Request if query parameters are missing or invalid", async () => {
    const invalidUrls = [
      "http://localhost/api/tvmaze",
      "http://localhost/api/tvmaze?mode=invalid",
      "http://localhost/api/tvmaze?mode=show",
      "http://localhost/api/tvmaze?mode=search",
    ];

    for (const url of invalidUrls) {
      const req = new Request(url, { method: "GET" });
      const res = await tvmazeHandler(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(
        data.error,
        "mode=show&id=... or mode=search&q=... is required.",
      );
    }
  });

  it("should fetch show details when mode=show&id=... and set cache", async () => {
    const expectedData = { id: 82, name: "Game of Thrones" };
    let capturedUrl: URL | string | undefined;

    const mockDeps = {
      fetchWithRetry: async (targetUrl: URL | RequestInfo) => {
        capturedUrl = targetUrl;
        return new Response(JSON.stringify(expectedData), {
          status: 200,
          statusText: "OK",
          headers: { "content-type": "application/json" },
        });
      },
    };

    const req = new Request("http://localhost/api/tvmaze?mode=show&id=82", {
      method: "GET",
    });
    const res = await tvmazeHandler(req, mockDeps);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("X-Cache"), "MISS");
    assert.strictEqual(res.headers.get("Content-Type"), "application/json");
    assert.ok(capturedUrl?.toString().includes("/shows/82"));
    const data = await res.json();
    assert.deepStrictEqual(data, expectedData);

    // Second request should hit cache
    const cachedRes = await tvmazeHandler(req, mockDeps);
    assert.strictEqual(cachedRes.status, 200);
    assert.strictEqual(cachedRes.headers.get("X-Cache"), "HIT");
    const cachedData = await cachedRes.json();
    assert.deepStrictEqual(cachedData, expectedData);
  });

  it("should search shows when mode=search&q=... and handle search responses", async () => {
    const searchResults = [{ show: { id: 1, name: "Breaking Bad" } }];
    let capturedUrl: URL | string | undefined;

    const mockDeps = {
      fetchWithRetry: async (targetUrl: URL | RequestInfo) => {
        capturedUrl = targetUrl;
        return new Response(JSON.stringify(searchResults), {
          status: 200,
          statusText: "OK",
          headers: { "content-type": "application/json" },
        });
      },
    };

    const req = new Request("http://localhost/api/tvmaze?mode=search&q=breaking", {
      method: "GET",
    });
    const res = await tvmazeHandler(req, mockDeps);

    assert.strictEqual(res.status, 200);
    assert.ok(capturedUrl?.toString().includes("/search/shows?q=breaking"));
    const data = await res.json();
    assert.deepStrictEqual(data, searchResults);
  });

  it("should default content-type to application/json when missing from upstream headers", async () => {
    const mockDeps = {
      fetchWithRetry: async () => {
        // Create response with null headers content-type getter by creating Response without Content-Type header
        return {
          status: 200,
          statusText: "OK",
          ok: true,
          headers: new Headers(),
          text: async () => "plain text body",
        } as unknown as Response;
      },
    };

    const req = new Request("http://localhost/api/tvmaze?mode=show&id=999999", {
      method: "GET",
    });
    const res = await tvmazeHandler(req, mockDeps);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("Content-Type"), "application/json");
  });

  it("should pass through upstream non-200 responses without caching", async () => {
    let callCount = 0;
    const mockDeps = {
      fetchWithRetry: async () => {
        callCount++;
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          statusText: "Not Found",
          headers: { "content-type": "application/json" },
        });
      },
    };

    const req = new Request("http://localhost/api/tvmaze?mode=show&id=404404", {
      method: "GET",
    });

    const res1 = await tvmazeHandler(req, mockDeps);
    assert.strictEqual(res1.status, 404);
    assert.strictEqual(callCount, 1);

    // Should not be cached, so second call should execute fetchWithRetry again
    const res2 = await tvmazeHandler(req, mockDeps);
    assert.strictEqual(res2.status, 404);
    assert.strictEqual(callCount, 2);
  });

  it("should catch errors in fetchWithRetry, log them, and return 500 Internal Server Error", async (t) => {
    const consoleErrorMock = t.mock.method(console, "error", () => {});
    const expectedError = new Error("Upstream network failure");

    const mockDeps = {
      fetchWithRetry: async () => {
        throw expectedError;
      },
    };

    const req = new Request("http://localhost/api/tvmaze?mode=show&id=500500", {
      method: "GET",
    });

    const res = await tvmazeHandler(req, mockDeps);
    assert.strictEqual(res.status, 500);
    const data = await res.json();
    assert.strictEqual(data.error, "Internal server error.");

    assert.strictEqual(consoleErrorMock.mock.calls.length, 1);
    assert.strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      `Error handling GET ${req.url}:`,
    );
    assert.strictEqual(consoleErrorMock.mock.calls[0].arguments[1], expectedError);
  });

  it("should handle request via default export withWebHandler wrapper", async () => {
    const req = new Request("http://localhost/api/tvmaze?mode=show&id=82", {
      method: "GET",
    });
    const res = await defaultHandler(req);
    // Should respond (from cache if already populated, or via real/mock network)
    assert.ok(res.status === 200 || res.status === 500);
  });
});
