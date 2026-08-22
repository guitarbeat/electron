import assert from "node:assert/strict";
import test from "node:test";

import handler from "../../../../api/health.ts";
import { createSharedStateMemoryMock } from "./test/sharedStateMock.ts";

test("health liveness works when req.url is a relative path", async () => {
  // Vercel runtime can pass a relative `req.url` (e.g. "/api/health"), which must not
  // break `new URL(req.url)`.
  const req = {
    method: "GET",
    url: "/api/health",
    headers: new Headers(),
  } as unknown as Request;

  const response = await handler(req);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, liveness: true });
});

test("deep health reports scope and PIN diagnostics without failing readiness", async () => {
  const mock = createSharedStateMemoryMock({
    "movielist.json": "[]",
    "messages.json": "[]",
    "memories.json": "[]",
    "places.json": "[]",
    "suggestions.json": "[]",
    "quiz.json": "{}",
    "matchmaker.json": "null",
    "pins.json": "{}",
    "spinhistory.json": "[]",
    "dailyspin.json": "",
  });

  try {
    const response = await handler(
      new Request("https://example.com/api/health?deep=1"),
    );

    assert.equal(response.status, 200);

    const payload = (await response.json()) as {
      ok: boolean;
      readiness: boolean;
      expectedScopes: string[];
      missingScopes: string[];
      pinProtectedUsers: string[];
      usersMissingPins: string[];
      pinCoverageComplete: boolean;
    };

    assert.equal(payload.ok, true);
    assert.equal(payload.readiness, true);
    assert.deepEqual(payload.missingScopes, ["placeSuggestions"]);
    assert.deepEqual(payload.pinProtectedUsers, []);
    assert.deepEqual(payload.usersMissingPins, ["Aaron", "Electra"]);
    assert.equal(payload.pinCoverageComplete, false);
    assert.equal(payload.expectedScopes.length, 11);
  } finally {
    mock.dispose();
  }
});
