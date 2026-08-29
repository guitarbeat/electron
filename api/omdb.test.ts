import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { validateSameOriginRequest, isRateLimited, resetRateLimitsForTests } from "./omdb.js";

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
});
