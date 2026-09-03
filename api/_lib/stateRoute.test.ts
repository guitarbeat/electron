import { describe, it } from "node:test";
import assert from "node:assert";
import { createStateRouteHandler } from "./stateRoute.js";
import type { StateScope } from "../../apps/web/src/services/state/stateTypes.js";

describe("createStateRouteHandler", () => {
  it("resolves scope from query parameter override when scope param is provided", async () => {
    let capturedScope: StateScope | null = null;
    const handler = createStateRouteHandler({
      method: "GET",
      scopePathOffset: 1,
      createHandler: (scope) => {
        capturedScope = scope;
        return async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    });

    const req = new Request("http://localhost/api/state/invalidPath?scope=movies", {
      method: "GET",
    });

    const res = await handler(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(capturedScope, "movies");
  });

  it("resolves scope from pathname with scopePathOffset: 1", async () => {
    let capturedScope: StateScope | null = null;
    const handler = createStateRouteHandler({
      method: "GET",
      scopePathOffset: 1,
      createHandler: (scope) => {
        capturedScope = scope;
        return async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    });

    const req = new Request("http://localhost/api/state/movies", {
      method: "GET",
    });

    const res = await handler(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(capturedScope, "movies");
  });

  it("resolves scope from pathname with scopePathOffset: 2", async () => {
    let capturedScope: StateScope | null = null;
    const handler = createStateRouteHandler({
      method: "POST",
      scopePathOffset: 2,
      createHandler: (scope) => {
        capturedScope = scope;
        return async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    });

    const req = new Request("http://localhost/api/state/suggestions/mutate", {
      method: "POST",
    });

    const res = await handler(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(capturedScope, "suggestions");
  });

  it("returns 404 Not Found when scope is invalid and request method matches option method", async () => {
    let handlerCalled = false;
    const handler = createStateRouteHandler({
      method: "GET",
      scopePathOffset: 1,
      createHandler: () => {
        handlerCalled = true;
        return async () => new Response("OK");
      },
    });

    const req = new Request("http://localhost/api/state/invalid_scope", {
      method: "GET",
    });

    const res = await handler(req);
    assert.strictEqual(res.status, 404);
    assert.strictEqual(handlerCalled, false);

    const body = (await res.json()) as { error: string };
    assert.strictEqual(body.error, "Not found.");
  });

  it("returns 405 Method Not Allowed when scope is invalid and request method does NOT match option method", async () => {
    let handlerCalled = false;
    const handler = createStateRouteHandler({
      method: "GET",
      scopePathOffset: 1,
      createHandler: () => {
        handlerCalled = true;
        return async () => new Response("OK");
      },
    });

    const req = new Request("http://localhost/api/state/invalid_scope", {
      method: "POST",
    });

    const res = await handler(req);
    assert.strictEqual(res.status, 405);
    assert.strictEqual(res.headers.get("Allow"), "GET");
    assert.strictEqual(handlerCalled, false);
  });
});
