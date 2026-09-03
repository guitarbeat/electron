import { describe, it } from "node:test";
import assert from "node:assert";
import { healthHandler } from "./health.js";

describe("healthHandler", () => {
  it("should respond to OPTIONS with 204 status and Allow header", async () => {
    const req = new Request("http://localhost/api/health", { method: "OPTIONS" });
    const res = await healthHandler(req);
    assert.strictEqual(res.status, 204);
    assert.strictEqual(res.headers.get("Allow"), "GET, OPTIONS");
  });

  it("should reject non-GET and non-OPTIONS methods with 405 Method Not Allowed", async () => {
    const req = new Request("http://localhost/api/health", { method: "POST" });
    const res = await healthHandler(req);
    assert.strictEqual(res.status, 405);
  });

  it("should respond to shallow GET with liveness status", async () => {
    const req = new Request("http://localhost/api/health", { method: "GET" });
    const res = await healthHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.deepStrictEqual(data, { ok: true, liveness: true });
  });

  it("should handle relative URL request for shallow GET", async () => {
    const req = new Request("http://localhost/api/health", { method: "GET" });
    // Simulate Vercel passing relative URL string in req.url using object with url property
    const relativeReq = {
      method: "GET",
      url: "/api/health",
      headers: new Headers(),
    } as unknown as Request;

    const res = await healthHandler(relativeReq);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.deepStrictEqual(data, { ok: true, liveness: true });
  });

  it("should respond to deep GET with full diagnostics on success", async () => {
    const mockDiagnostics = {
      expectedScopes: ["movies", "messages"] as any,
      missingScopes: [] as any,
    };
    const mockPinCoverage = {
      pinProtectedUsers: ["user1"] as any,
      usersMissingPins: ["user2"] as any,
      pinCoverageComplete: false,
    };

    const deps = {
      getStateScopeDiagnostics: async () => mockDiagnostics,
      getPinCoverageState: async () => mockPinCoverage,
    };

    const req = new Request("http://localhost/api/health?deep=1", { method: "GET" });
    const res = await healthHandler(req, deps);

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.deepStrictEqual(data, {
      ok: true,
      liveness: true,
      readiness: true,
      expectedScopes: ["movies", "messages"],
      missingScopes: [],
      pinProtectedUsers: ["user1"],
      usersMissingPins: ["user2"],
      pinCoverageComplete: false,
    });
  });

  it("should respond with 503 when deep check fails", async () => {
    const deps = {
      getStateScopeDiagnostics: async () => {
        throw new Error("Database connection error");
      },
      getPinCoverageState: async () => ({
        pinProtectedUsers: [],
        usersMissingPins: [],
        pinCoverageComplete: true,
      }),
    };

    const req = new Request("http://localhost/api/health?deep=1", { method: "GET" });
    const res = await healthHandler(req, deps);

    assert.strictEqual(res.status, 503);
    const data = await res.json();
    assert.deepStrictEqual(data, {
      ok: false,
      liveness: true,
      readiness: false,
      error: "Database connection error",
    });
  });
});
