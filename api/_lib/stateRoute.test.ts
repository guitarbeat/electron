import { describe, it } from "node:test";
import assert from "node:assert";
import { createStateRouteHandler } from "./stateRoute.js";
import { STATE_SCOPES, type StateScope } from "../../apps/web/src/services/state/stateTypes.js";

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

  it("falls back to pathname when scope query parameter is an empty string", async () => {
    let capturedScope: StateScope | null = null;
    const handler = createStateRouteHandler({
      method: "GET",
      scopePathOffset: 1,
      createHandler: (scope) => {
        capturedScope = scope;
        return async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    });

    const req = new Request("http://localhost/api/state/places?scope=", {
      method: "GET",
    });

    const res = await handler(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(capturedScope, "places");
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

  it("handles pathnames with trailing or multiple consecutive slashes correctly", async () => {
    let capturedScope: StateScope | null = null;
    const handler = createStateRouteHandler({
      method: "GET",
      scopePathOffset: 1,
      createHandler: (scope) => {
        capturedScope = scope;
        return async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    });

    const req = new Request("http://localhost/api///state/quiz///", {
      method: "GET",
    });

    const res = await handler(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(capturedScope, "quiz");
  });

  it("returns 404 when pathname is shorter than scopePathOffset and method matches", async () => {
    let handlerCalled = false;
    const handler = createStateRouteHandler({
      method: "GET",
      scopePathOffset: 2,
      createHandler: () => {
        handlerCalled = true;
        return async () => new Response("OK");
      },
    });

    const req = new Request("http://localhost/", {
      method: "GET",
    });

    const res = await handler(req);
    assert.strictEqual(res.status, 404);
    assert.strictEqual(handlerCalled, false);

    const body = (await res.json()) as { error: string };
    assert.strictEqual(body.error, "Not found.");
  });

  it("returns 405 Method Not Allowed when pathname is shorter than scopePathOffset and method mismatches", async () => {
    let handlerCalled = false;
    const handler = createStateRouteHandler({
      method: "GET",
      scopePathOffset: 2,
      createHandler: () => {
        handlerCalled = true;
        return async () => new Response("OK");
      },
    });

    const req = new Request("http://localhost/", {
      method: "POST",
    });

    const res = await handler(req);
    assert.strictEqual(res.status, 405);
    assert.strictEqual(res.headers.get("Allow"), "GET");
    assert.strictEqual(handlerCalled, false);
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

  it("correctly routes and handles requests for all valid STATE_SCOPES", async () => {
    for (const scope of STATE_SCOPES) {
      let receivedScope: StateScope | null = null;
      const handler = createStateRouteHandler({
        method: "GET",
        scopePathOffset: 1,
        createHandler: (s) => {
          receivedScope = s;
          return async (req) =>
            new Response(JSON.stringify({ scope: s, method: req.method }), {
              status: 200,
            });
        },
      });

      const req = new Request("http://localhost/api/state/" + scope, {
        method: "GET",
      });

      const res = await handler(req);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(receivedScope, scope);
      const data = (await res.json()) as { scope: string; method: string };
      assert.strictEqual(data.scope, scope);
      assert.strictEqual(data.method, "GET");
    }
  });

  it("forwards the original request object to the inner handler", async () => {
    let receivedRequest: Request | null = null;
    const handler = createStateRouteHandler({
      method: "POST",
      scopePathOffset: 2,
      createHandler: () => (req) => {
        receivedRequest = req;
        return new Response("OK", { status: 200 });
      },
    });

    const req = new Request("http://localhost/api/state/movies/mutate", {
      method: "POST",
      headers: { "X-Custom-Header": "test-value" },
    });

    const res = await handler(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(receivedRequest, req);
    assert.strictEqual(
      receivedRequest?.headers.get("X-Custom-Header"),
      "test-value"
    );
  });
});
