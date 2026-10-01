import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  parseAllowedOrigins,
  isOriginAllowed,
  createServerlessRuntimeAdapter,
} from "../../devServerlessRuntime.ts";

describe("devServerlessRuntime CORS Security", () => {
  const originalEnv = process.env.ALLOWED_ORIGINS;
  const originalCorsEnv = process.env.CORS_ALLOWED_ORIGINS;

  beforeEach(() => {
    delete process.env.ALLOWED_ORIGINS;
    delete process.env.CORS_ALLOWED_ORIGINS;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ALLOWED_ORIGINS = originalEnv;
    } else {
      delete process.env.ALLOWED_ORIGINS;
    }

    if (originalCorsEnv !== undefined) {
      process.env.CORS_ALLOWED_ORIGINS = originalCorsEnv;
    } else {
      delete process.env.CORS_ALLOWED_ORIGINS;
    }
  });

  describe("parseAllowedOrigins", () => {
    it("should parse array of origins", () => {
      const result = parseAllowedOrigins(["http://a.com", "http://b.com"]);
      assert.deepEqual(result, ["http://a.com", "http://b.com"]);
    });

    it("should parse comma-separated string of origins", () => {
      const result = parseAllowedOrigins("http://a.com, http://b.com");
      assert.deepEqual(result, ["http://a.com", "http://b.com"]);
    });

    it("should fallback to ALLOWED_ORIGINS environment variable", () => {
      process.env.ALLOWED_ORIGINS = "https://example.com, https://app.com";
      const result = parseAllowedOrigins();
      assert.deepEqual(result, ["https://example.com", "https://app.com"]);
    });

    it("should return empty array if no origins configured", () => {
      const result = parseAllowedOrigins();
      assert.deepEqual(result, []);
    });
  });

  describe("isOriginAllowed", () => {
    it("should return false if request origin is missing", () => {
      assert.equal(isOriginAllowed(undefined, "localhost:3000", ["http://a.com"]), false);
    });

    it("should return true for configured matching origin", () => {
      assert.equal(isOriginAllowed("http://a.com", "localhost:3000", ["http://a.com"]), true);
    });

    it("should return false for unallowed origin when explicit origins are set", () => {
      assert.equal(isOriginAllowed("http://evil.com", "localhost:3000", ["http://a.com"]), false);
    });

    it("should return true if wildcard origin is configured", () => {
      assert.equal(isOriginAllowed("http://anything.com", "localhost:3000", ["*"]), true);
    });

    it("should allow same-host origin in default local dev mode", () => {
      assert.equal(isOriginAllowed("http://localhost:3000", "localhost:3000", []), true);
    });

    it("should allow localhost/127.0.0.1 origins in default local dev mode", () => {
      assert.equal(isOriginAllowed("http://127.0.0.1:5173", "localhost:3000", []), true);
    });

    it("should reject malicious untrusted origin in default local dev mode", () => {
      assert.equal(isOriginAllowed("https://evil.com", "localhost:3000", []), false);
    });
  });

  describe("createServerlessRuntimeAdapter middleware", () => {
    const createMockServer = () => {
      let middleware: ((req: unknown, res: unknown, next: () => void) => Promise<void>) | null = null;
      const mockServer = {
        middlewares: {
          use: (fn: (req: unknown, res: unknown, next: () => void) => Promise<void>) => {
            middleware = fn;
          },
        },
        ssrLoadModule: async () => ({ default: () => new Response("ok") }),
      };
      return { mockServer, getMiddleware: () => middleware };
    };

    const createMockReqRes = (headers: Record<string, string> = {}, method = "GET", url = "/api/health") => {
      const req = {
        url,
        method,
        headers,
      };

      const setHeaders: Record<string, string> = {};
      let ended = false;
      const statusCode = 200;

      const res = {
        statusCode,
        setHeader: (name: string, value: string) => {
          setHeaders[name] = value;
        },
        end: () => {
          ended = true;
        },
        get statusCodeValue() {
          return res.statusCode;
        },
      };

      return { req, res, setHeaders, isEnded: () => ended };
    };

    it("should set Access-Control-Allow-Origin and Vary for allowed origin", async () => {
      const adapter = createServerlessRuntimeAdapter({ allowedOrigins: ["http://allowed.com"] });
      const { mockServer, getMiddleware } = createMockServer();
      adapter.configureServer?.(mockServer as never);

      const middleware = getMiddleware()!;
      const { req, res, setHeaders } = createMockReqRes({ origin: "http://allowed.com" }, "GET", "/api/health");

      await middleware(req, res, () => {});

      assert.equal(setHeaders["Access-Control-Allow-Origin"], "http://allowed.com");
      assert.equal(setHeaders["Vary"], "Origin");
    });

    it("should NOT set Access-Control-Allow-Origin for unauthorized origin", async () => {
      const adapter = createServerlessRuntimeAdapter({ allowedOrigins: ["http://allowed.com"] });
      const { mockServer, getMiddleware } = createMockServer();
      adapter.configureServer?.(mockServer as never);

      const middleware = getMiddleware()!;
      const { req, res, setHeaders } = createMockReqRes({ origin: "http://evil.com" }, "GET", "/api/health");

      await middleware(req, res, () => {});

      assert.equal(setHeaders["Access-Control-Allow-Origin"], undefined);
    });

    it("should respond with 403 on OPTIONS preflight for unauthorized origin", async () => {
      const adapter = createServerlessRuntimeAdapter({ allowedOrigins: ["http://allowed.com"] });
      const { mockServer, getMiddleware } = createMockServer();
      adapter.configureServer?.(mockServer as never);

      const middleware = getMiddleware()!;
      const { req, res, setHeaders, isEnded } = createMockReqRes({ origin: "http://evil.com" }, "OPTIONS", "/api/health");

      await middleware(req, res, () => {});

      assert.equal(res.statusCode, 403);
      assert.equal(isEnded(), true);
      assert.equal(setHeaders["Access-Control-Allow-Origin"], undefined);
    });

    it("should respond with 204 on OPTIONS preflight for allowed origin", async () => {
      const adapter = createServerlessRuntimeAdapter({ allowedOrigins: ["http://allowed.com"] });
      const { mockServer, getMiddleware } = createMockServer();
      adapter.configureServer?.(mockServer as never);

      const middleware = getMiddleware()!;
      const { req, res, setHeaders, isEnded } = createMockReqRes({ origin: "http://allowed.com" }, "OPTIONS", "/api/health");

      await middleware(req, res, () => {});

      assert.equal(res.statusCode, 204);
      assert.equal(isEnded(), true);
      assert.equal(setHeaders["Access-Control-Allow-Origin"], "http://allowed.com");
    });

    it("should pass non-/api/ requests through next()", async () => {
      const adapter = createServerlessRuntimeAdapter();
      const { mockServer, getMiddleware } = createMockServer();
      adapter.configureServer?.(mockServer as never);

      const middleware = getMiddleware()!;
      const { req, res } = createMockReqRes({}, "GET", "/index.html");

      let nextCalled = false;
      await middleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });
  });
});
