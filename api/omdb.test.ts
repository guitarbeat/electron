import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import defaultHandler, { omdbHandler, validateSameOriginRequest, isRateLimited, resetRateLimitsForTests } from "./omdb.js";

describe("validateSameOriginRequest", () => {
  const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;

  afterEach(() => {
    if (originalAllowedOrigins === undefined) {
      delete process.env.ALLOWED_ORIGINS;
    } else {
      process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
    }
  });

  it("should reject cross-site requests with 403", async () => {
    const req = new Request("http://localhost/api/omdb", {
      headers: { "sec-fetch-site": "cross-site" },
    });
    const res = validateSameOriginRequest(req);
    assert.notStrictEqual(res, null);
    assert.strictEqual(res?.status, 403);
    const body = await res?.json();
    assert.strictEqual(body.error, "Cross-site requests not allowed.");
  });

  it("should allow non-cross-site sec-fetch-site headers", () => {
    const reqSameOrigin = new Request("http://localhost/api/omdb", {
      headers: { "sec-fetch-site": "same-origin" },
    });
    assert.strictEqual(validateSameOriginRequest(reqSameOrigin), null);

    const reqSameSite = new Request("http://localhost/api/omdb", {
      headers: { "sec-fetch-site": "same-site" },
    });
    assert.strictEqual(validateSameOriginRequest(reqSameSite), null);
  });

  it("should match allowed origins with trailing slashes or custom ports", () => {
    process.env.ALLOWED_ORIGINS = "https://app.example.com/, http://localhost:3000";

    const reqTrailing = new Request("http://localhost/api/omdb", {
      headers: { origin: "https://app.example.com" },
    });
    assert.strictEqual(validateSameOriginRequest(reqTrailing), null);

    const reqPort = new Request("http://localhost/api/omdb", {
      headers: { origin: "http://localhost:3000" },
    });
    assert.strictEqual(validateSameOriginRequest(reqPort), null);
  });

  it("should allow requests with no origin or referer", () => {
    const req = new Request("http://localhost/api/omdb");
    const res = validateSameOriginRequest(req);
    assert.strictEqual(res, null);
  });

  it("should allow requests with origin when ALLOWED_ORIGINS is empty", () => {
    delete process.env.ALLOWED_ORIGINS;
    const req = new Request("http://localhost/api/omdb", {
      headers: { origin: "https://example.com" },
    });
    const res = validateSameOriginRequest(req);
    assert.strictEqual(res, null);
  });

  it("should allow requests from origin specified in ALLOWED_ORIGINS", () => {
    process.env.ALLOWED_ORIGINS = "https://app.example.com, https://other.example.com";
    const req = new Request("http://localhost/api/omdb", {
      headers: { origin: "https://app.example.com" },
    });
    const res = validateSameOriginRequest(req);
    assert.strictEqual(res, null);
  });

  it("should fallback to referer header if origin is missing", () => {
    process.env.ALLOWED_ORIGINS = "https://app.example.com";
    const req = new Request("http://localhost/api/omdb", {
      headers: { referer: "https://app.example.com/page" },
    });
    const res = validateSameOriginRequest(req);
    assert.strictEqual(res, null);
  });

  it("should reject requests from origin not in ALLOWED_ORIGINS with 403", async () => {
    process.env.ALLOWED_ORIGINS = "https://app.example.com";
    const req = new Request("http://localhost/api/omdb", {
      headers: { origin: "https://malicious.com" },
    });
    const res = validateSameOriginRequest(req);
    assert.notStrictEqual(res, null);
    assert.strictEqual(res?.status, 403);
    const body = await res?.json();
    assert.strictEqual(body.error, "Origin not allowed.");
  });

  it("should reject requests with invalid origin header with 403", async () => {
    process.env.ALLOWED_ORIGINS = "https://app.example.com";
    const req = new Request("http://localhost/api/omdb", {
      headers: { origin: "not-a-valid-url" },
    });
    const res = validateSameOriginRequest(req);
    assert.notStrictEqual(res, null);
    assert.strictEqual(res?.status, 403);
    const body = await res?.json();
    assert.strictEqual(body.error, "Invalid origin.");
  });

  it("should skip malformed URLs in ALLOWED_ORIGINS and match valid allowed origins", () => {
    process.env.ALLOWED_ORIGINS = "invalid-url, https://app.example.com";
    const req = new Request("http://localhost/api/omdb", {
      headers: { origin: "https://app.example.com" },
    });
    const res = validateSameOriginRequest(req);
    assert.strictEqual(res, null);
  });

  it("should reject cross-site requests with 403 even if origin is allowed", async () => {
    process.env.ALLOWED_ORIGINS = "https://app.example.com";
    const req = new Request("http://localhost/api/omdb", {
      headers: {
        "sec-fetch-site": "cross-site",
        origin: "https://app.example.com",
      },
    });
    const res = validateSameOriginRequest(req);
    assert.notStrictEqual(res, null);
    assert.strictEqual(res?.status, 403);
    const body = await res?.json();
    assert.strictEqual(body.error, "Cross-site requests not allowed.");
  });

  it("should handle leading and trailing whitespace around entries in ALLOWED_ORIGINS", () => {
    process.env.ALLOWED_ORIGINS = "  https://app.example.com  ,   https://other.example.com  ";
    const req = new Request("http://localhost/api/omdb", {
      headers: { origin: "https://app.example.com" },
    });
    const res = validateSameOriginRequest(req);
    assert.strictEqual(res, null);
  });

  it("should match origins case-insensitively for protocol and hostname", () => {
    process.env.ALLOWED_ORIGINS = "HTTPS://APP.EXAMPLE.COM";
    const req = new Request("http://localhost/api/omdb", {
      headers: { origin: "https://app.example.com" },
    });
    const res = validateSameOriginRequest(req);
    assert.strictEqual(res, null);
  });

  it("should reject requests when ALLOWED_ORIGINS contains only malformed URLs", async () => {
    process.env.ALLOWED_ORIGINS = "invalid-url-1, invalid-url-2";
    const req = new Request("http://localhost/api/omdb", {
      headers: { origin: "https://app.example.com" },
    });
    const res = validateSameOriginRequest(req);
    assert.notStrictEqual(res, null);
    assert.strictEqual(res?.status, 403);
    const body = await res?.json();
    assert.strictEqual(body.error, "Origin not allowed.");
  });

  it("should prefer origin header over referer header when both are provided", async () => {
    process.env.ALLOWED_ORIGINS = "https://allowed.example.com";
    const req1 = new Request("http://localhost/api/omdb", {
      headers: {
        origin: "https://disallowed.example.com",
        referer: "https://allowed.example.com/page",
      },
    });
    const res1 = validateSameOriginRequest(req1);
    assert.notStrictEqual(res1, null);
    assert.strictEqual(res1?.status, 403);
    const body1 = await res1?.json();
    assert.strictEqual(body1.error, "Origin not allowed.");

    const req2 = new Request("http://localhost/api/omdb", {
      headers: {
        origin: "https://allowed.example.com",
        referer: "https://disallowed.example.com/page",
      },
    });
    assert.strictEqual(validateSameOriginRequest(req2), null);
  });

  it("should reject cross-site sec-fetch-site requests even if ALLOWED_ORIGINS matches origin", async () => {
    process.env.ALLOWED_ORIGINS = "https://app.example.com";
    const req = new Request("http://localhost/api/omdb", {
      headers: {
        origin: "https://app.example.com",
        "sec-fetch-site": "cross-site",
      },
    });
    const res = validateSameOriginRequest(req);
    assert.notStrictEqual(res, null);
    assert.strictEqual(res?.status, 403);
    const body = await res?.json();
    assert.strictEqual(body.error, "Cross-site requests not allowed.");
  });

  it("should reject requests when origin scheme differs from ALLOWED_ORIGINS scheme", async () => {
    process.env.ALLOWED_ORIGINS = "https://app.example.com";
    const req = new Request("http://localhost/api/omdb", {
      headers: { origin: "http://app.example.com" },
    });
    const res = validateSameOriginRequest(req);
    assert.notStrictEqual(res, null);
    assert.strictEqual(res?.status, 403);
    const body = await res?.json();
    assert.strictEqual(body.error, "Origin not allowed.");
  });

  it("should parse referer URLs containing paths, query parameters, and fragments", () => {
    process.env.ALLOWED_ORIGINS = "https://app.example.com";
    const req = new Request("http://localhost/api/omdb", {
      headers: { referer: "https://app.example.com/movies/123?sort=asc#trailer" },
    });
    assert.strictEqual(validateSameOriginRequest(req), null);
  });

  it("should return 403 response with application/json content-type header for rejected requests", () => {
    process.env.ALLOWED_ORIGINS = "https://app.example.com";
    const req = new Request("http://localhost/api/omdb", {
      headers: { origin: "https://unauthorized.com" },
    });
    const res = validateSameOriginRequest(req);
    assert.notStrictEqual(res, null);
    assert.strictEqual(res?.status, 403);
    assert.strictEqual(res?.headers.get("content-type"), "application/json");
  });
});


describe("isRateLimited", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it("should return false for initial request from an IP", () => {
    assert.strictEqual(isRateLimited("192.0.2.1"), false);
  });

  it("should allow up to 30 requests per window and rate limit on 31st request", () => {
    const ip = "192.0.2.2";
    for (let i = 0; i < 30; i++) {
      assert.strictEqual(isRateLimited(ip), false, `Request ${i + 1} should be allowed`);
    }
    assert.strictEqual(isRateLimited(ip), true, "31st request should be rate limited");
  });

  it("should continue to return true for subsequent requests after rate limit threshold is reached", () => {
    const ip = "192.0.2.2";
    for (let i = 0; i < 30; i++) {
      isRateLimited(ip);
    }
    assert.strictEqual(isRateLimited(ip), true, "31st request should be rate limited");
    assert.strictEqual(isRateLimited(ip), true, "32nd request should also be rate limited");
    assert.strictEqual(isRateLimited(ip), true, "33rd request should also be rate limited");
  });

  it("should reset count after window expires", (t) => {
    t.mock.timers.enable({ apis: ["Date"] });
    const ip = "192.0.2.3";

    for (let i = 0; i < 30; i++) {
      isRateLimited(ip);
    }
    assert.strictEqual(isRateLimited(ip), true);

    t.mock.timers.setTime(Date.now() + 60001);

    assert.strictEqual(isRateLimited(ip), false, "Request after window expiration should be allowed");
  });

  it("should clean up expired entries when MAX_RATE_LIMIT_ENTRIES is reached", (t) => {
    t.mock.timers.enable({ apis: ["Date"] });
    const maxEntries = 10000;

    for (let i = 0; i < maxEntries; i++) {
      isRateLimited(`10.0.${Math.floor(i / 256)}.${i % 256}`);
    }

    t.mock.timers.setTime(Date.now() + 60001);

    assert.strictEqual(isRateLimited("192.168.1.100"), false);
  });

  it("should stop cleaning expired entries early upon encountering a non-expired entry when capacity limit is reached", (t) => {
    t.mock.timers.enable({ apis: ["Date"] });

    // Fill first 5000 entries at t=0
    for (let i = 0; i < 5000; i++) {
      isRateLimited(`10.0.${Math.floor(i / 256)}.${i % 256}`);
    }

    // Advance 30 seconds
    t.mock.timers.setTime(Date.now() + 30000);

    // Fill remaining 5000 entries at t=30000
    for (let i = 5000; i < 10000; i++) {
      isRateLimited(`10.0.${Math.floor(i / 256)}.${i % 256}`);
    }

    // Advance 35 seconds (now t=65000)
    // First 5000 entries expired (created at t=0, resetTime=60000 < 65000)
    // Second 5000 entries not expired (created at t=30000, resetTime=90000 > 65000)
    t.mock.timers.setTime(Date.now() + 35000);

    assert.strictEqual(isRateLimited("192.168.1.50"), false);
  });

  it("should re-order entry to end of insertion order when an expired entry is accessed again", (t) => {
    t.mock.timers.enable({ apis: ["Date"] });

    // Insert first IP
    const firstIp = "10.0.0.1";
    isRateLimited(firstIp);

    // Fill remaining entries to reach 10000
    for (let i = 1; i < 10000; i++) {
      isRateLimited(`10.0.${Math.floor(i / 256)}.${i % 256}`);
    }

    // Advance time past expiration window (60001ms)
    t.mock.timers.setTime(Date.now() + 60001);

    // Re-access firstIp so it's reset and moved to the end of insertion order
    assert.strictEqual(isRateLimited(firstIp), false);

    // Now insert one more new IP without advancing time further
    // Capacity cleanup should evict the oldest entry (which is now 10.0.0.1+1, not firstIp)
    const newIp = "192.168.99.99";
    assert.strictEqual(isRateLimited(newIp), false);

    // Verify firstIp is still tracked and active (count=1, not rate limited)
    assert.strictEqual(isRateLimited(firstIp), false);
  });

  it("should evict oldest entry when MAX_RATE_LIMIT_ENTRIES is reached and none are expired", () => {
    const maxEntries = 10000;

    for (let i = 0; i < maxEntries; i++) {
      isRateLimited(`10.0.${Math.floor(i / 256)}.${i % 256}`);
    }

    assert.strictEqual(isRateLimited("192.168.1.200"), false);
  });

  it("should track rate limits independently for different IP addresses", () => {
    const ip1 = "192.0.2.10";
    const ip2 = "192.0.2.20";

    for (let i = 0; i < 30; i++) {
      assert.strictEqual(isRateLimited(ip1), false);
    }
    assert.strictEqual(isRateLimited(ip1), true);

    assert.strictEqual(isRateLimited(ip2), false);
  });
});


describe("omdbHandler", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.OMDB_API_KEY = "test-key";
    process.env.OMDB_API_URL = "https://www.omdbapi.com";
    resetRateLimitsForTests();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should reject non-GET requests with 405 Method Not Allowed", async () => {
    for (const method of ["POST", "PUT", "DELETE", "PATCH"]) {
      const req = new Request("http://localhost/api/omdb?s=batman", { method });
      const res = await omdbHandler(req);
      assert.strictEqual(res.status, 405);
      const data = await res.json();
      assert.strictEqual(data.error, "Method not allowed.");
    }
  });

  it("should return 400 Bad Request if no query parameters are provided", async () => {
    const req = new Request("http://localhost/api/omdb", { method: "GET" });
    const res = await omdbHandler(req);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(
      data.error,
      "At least one OMDb lookup parameter is required.",
    );
  });

  it("should return 500 when OMDB_API_URL is invalid", async () => {
    process.env.OMDB_API_URL = "invalid-url";
    const req = new Request("http://localhost/api/omdb?s=batman", { method: "GET" });
    const res = await omdbHandler(req);
    assert.strictEqual(res.status, 500);
    const data = await res.json();
    assert.strictEqual(data.error, "Invalid OMDB_API_URL configuration.");
  });

  it("should return 500 when OMDB_API_KEY is missing", async () => {
    delete process.env.OMDB_API_KEY;
    delete process.env.VITE_OMDB_API_KEY;
    const req = new Request("http://localhost/api/omdb?s=batman", { method: "GET" });
    const res = await omdbHandler(req);
    assert.strictEqual(res.status, 500);
    const data = await res.json();
    assert.ok(data.error.includes("OMDb is not configured"));
  });

  it("should proxy request to OMDb and return response on success", async () => {
    const mockData = { Search: [{ Title: "Batman Begins", Year: "2005" }], Response: "True" };
    let capturedUrl: URL | string | undefined;

    const mockDeps = {
      fetchWithRetry: async (targetUrl: URL | RequestInfo) => {
        capturedUrl = targetUrl;
        return new Response(JSON.stringify(mockData), {
          status: 200,
          statusText: "OK",
          headers: { "content-type": "application/json" },
        });
      },
    };

    const req = new Request("http://localhost/api/omdb?s=batman", { method: "GET" });
    const res = await omdbHandler(req, mockDeps);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("X-Cache"), "MISS");
    assert.ok(capturedUrl?.toString().includes("apikey=test-key"));
    assert.ok(capturedUrl?.toString().includes("s=batman"));

    const data = await res.json();
    assert.deepStrictEqual(data, mockData);
  });

  it("should return cached response on subsequent identical request", async () => {
    const mockData = { Search: [{ Title: "Inception", Year: "2010" }], Response: "True" };
    let callCount = 0;

    const mockDeps = {
      fetchWithRetry: async () => {
        callCount++;
        return new Response(JSON.stringify(mockData), {
          status: 200,
          statusText: "OK",
          headers: { "content-type": "application/json" },
        });
      },
    };

    const req = new Request("http://localhost/api/omdb?s=inception", { method: "GET" });

    const res1 = await omdbHandler(req, mockDeps);
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res1.headers.get("X-Cache"), "MISS");
    assert.strictEqual(callCount, 1);

    const res2 = await omdbHandler(req, mockDeps);
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.headers.get("X-Cache"), "HIT");
    assert.strictEqual(callCount, 1);
  });

  it("should return 502 when OMDb returns 401 or credential failure body", async () => {
    const mockDeps = {
      fetchWithRetry: async () => {
        return new Response(JSON.stringify({ Response: "False", Error: "Invalid API key!" }), {
          status: 200,
          statusText: "OK",
          headers: { "content-type": "application/json" },
        });
      },
    };

    const req = new Request("http://localhost/api/omdb?s=test&t=invalidkey", { method: "GET" });
    const res = await omdbHandler(req, mockDeps);

    assert.strictEqual(res.status, 502);
    const data = await res.json();
    assert.strictEqual(data.code, "omdb_auth");
    assert.strictEqual(data.error, "OMDb rejected the configured API key.");
  });

  it("should catch errors in fetchWithRetry, log them, and return 500 Internal Server Error", async (t) => {
    const consoleErrorMock = t.mock.method(console, "error", () => {});
    const expectedError = new Error("Network fetch error");

    const mockDeps = {
      fetchWithRetry: async () => {
        throw expectedError;
      },
    };

    const req = new Request("http://localhost/api/omdb?s=error-test", { method: "GET" });
    const res = await omdbHandler(req, mockDeps);

    assert.strictEqual(res.status, 500);
    const data = await res.json();
    assert.strictEqual(data.error, "Internal server error.");

    assert.strictEqual(consoleErrorMock.mock.calls.length, 1);
    assert.strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error handling GET " + req.url + ":",
    );
    assert.strictEqual(consoleErrorMock.mock.calls[0].arguments[1], expectedError);
  });

  it("should handle request via default export withWebHandler wrapper", async () => {
    const req = new Request("http://localhost/api/omdb?s=batman", { method: "GET" });
    const res = await defaultHandler(req);
    assert.ok(res.status === 200 || res.status === 500 || res.status === 502);
  });
});
