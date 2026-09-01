import { describe, it } from "node:test";
import assert from "node:assert";
import { diagnosticsHandler } from "./diagnostics.js";

describe("diagnosticsHandler", () => {
  it("should respond to OPTIONS with 204", async () => {
    const req = new Request("http://localhost/api/diagnostics", { method: "OPTIONS" });
    const res = await diagnosticsHandler(req);
    assert.strictEqual(res.status, 204);
    assert.strictEqual(res.headers.get("Allow"), "GET, POST, OPTIONS");
  });

  it("should respond to GET with health status", async () => {
    const req = new Request("http://localhost/api/diagnostics", { method: "GET" });
    const res = await diagnosticsHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.service, "diagnostics");
    assert.strictEqual(data.status, "healthy");
  });

  it("should reject invalid methods with 405", async () => {
    const req = new Request("http://localhost/api/diagnostics", { method: "DELETE" });
    const res = await diagnosticsHandler(req);
    assert.strictEqual(res.status, 405);
  });

  it("should accept valid POST diagnostics payload", async () => {
    const req = new Request("http://localhost/api/diagnostics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: "error",
        message: "Component render exception",
        stack: "Error: Component render exception\n    at Render (App.tsx:10:5)",
        componentStack: "in MovieCard\n    in AppWorkspaceShell",
        module: "AppWorkspaceShell",
        url: "http://localhost:3000/#movies",
      }),
    });
    const res = await diagnosticsHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.ok, true);
    assert.ok(typeof data.id === "string" && data.id.startsWith("diag_"));
  });

  it("should reject POST without message field with 400", async () => {
    const req = new Request("http://localhost/api/diagnostics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stack: "Error without message",
      }),
    });
    const res = await diagnosticsHandler(req);
    assert.strictEqual(res.status, 400);
  });

  it("should accept valid performance metric POST payload", async () => {
    const req = new Request("http://localhost/api/diagnostics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "metric",
        metricName: "workspace_tab_switch_ms",
        metricValue: 42.5,
        metricUnit: "ms",
        module: "AppWorkspaceShell",
        context: { fromTab: "movies", toTab: "messages" },
      }),
    });
    const res = await diagnosticsHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.ok, true);
    assert.ok(typeof data.id === "string");
  });

  it("should accept valid batched performance metrics POST payload", async () => {
    const req = new Request("http://localhost/api/diagnostics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: "metric",
        metrics: {
          ttfb_ms: 120,
          fcp_ms: 310,
          dom_complete_ms: 450,
        },
        module: "WebVitals",
      }),
    });
    const res = await diagnosticsHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.ok, true);
  });
});
