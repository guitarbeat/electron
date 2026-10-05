import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { createServerlessRuntimeAdapter, resolveApiModulePath } from "../../devServerlessRuntime.ts";

describe("devServerlessRuntime security", () => {
  it("should resolve API module paths correctly", () => {
    assert.ok(resolveApiModulePath("/api/health").endsWith("/api/health.ts"));
    assert.ok(resolveApiModulePath("/api/agent/v1").endsWith("/api/agent.ts"));
    assert.ok(resolveApiModulePath("/api/state/movies").endsWith("/api/state/[scope].ts"));
    assert.ok(resolveApiModulePath("/api/state/movies/mutate").endsWith("/api/state/[scope]/mutate.ts"));
  });

  it("should return generic 500 error without exposing internal error details to client", async () => {
    const plugin = createServerlessRuntimeAdapter();
    let middlewareFn: ((req: any, res: any, next: any) => Promise<void>) | null = null;

    const mockServer = {
      middlewares: {
        use: (fn: (req: any, res: any, next: any) => Promise<void>) => {
          middlewareFn = fn;
        },
      },
      ssrLoadModule: async () => {
        throw new Error("Sensitive connection string: postgres://user:secret@localhost:5432/db");
      },
    };

    // Initialize configureServer
    (plugin as any).configureServer(mockServer);
    assert.ok(middlewareFn, "Middleware function should be registered");

    const req = {
      url: "/api/health",
      method: "GET",
      headers: {},
    };

    const headers: Record<string, string> = {};
    let endBody = "";

    const res = {
      headersSent: false,
      statusCode: 0,
      setHeader: (key: string, val: string) => {
        headers[key] = val;
      },
      end: (body?: string) => {
        endBody = body || "";
      },
    };

    // Silence console.error during the test execution
    const consoleErrorMock = mock.method(console, "error", () => {});

    try {
      await middlewareFn!(req, res, () => {});

      assert.equal(res.statusCode, 500);
      assert.equal(headers["Content-Type"], "application/json");

      const responseJson = JSON.parse(endBody);
      assert.deepEqual(responseJson, { error: "Internal Server Error" });
      assert.equal(responseJson.details, undefined);
      assert.ok(!endBody.includes("postgres://user:secret"));
    } finally {
      consoleErrorMock.mock.restore();
    }
  });
});
