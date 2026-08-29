import { describe, it, afterEach } from "node:test";
import assert from "node:assert";
import { validateSameOriginRequest } from "./omdb.js";

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
