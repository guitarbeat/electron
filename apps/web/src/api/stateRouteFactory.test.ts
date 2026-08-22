import assert from "node:assert/strict";
import test from "node:test";

import { createStateRouteHandler } from "../../../../api/_lib/stateRoute.ts";

const createReadRoute = () =>
  createStateRouteHandler({
    method: "GET",
    scopePathOffset: 1,
    createHandler: (scope) => () =>
      Response.json({ scope, source: "shared-route" }),
  });

test("shared state route resolves scopes from query and path", async () => {
  const route = createReadRoute();

  const queryResponse = await route(
    new Request("https://example.com/api/state/ignored?scope=movies"),
  );
  assert.deepEqual(await queryResponse.json(), {
    scope: "movies",
    source: "shared-route",
  });

  const pathResponse = await route(
    new Request("https://example.com/api/state/messages"),
  );
  assert.deepEqual(await pathResponse.json(), {
    scope: "messages",
    source: "shared-route",
  });
});

test("shared state route centralizes invalid-scope responses", async () => {
  const route = createReadRoute();

  const notFound = await route(
    new Request("https://example.com/api/state/not-a-scope"),
  );
  assert.equal(notFound.status, 404);

  const wrongMethod = await route(
    new Request("https://example.com/api/state/not-a-scope", {
      method: "POST",
    }),
  );
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get("allow"), "GET");
});
