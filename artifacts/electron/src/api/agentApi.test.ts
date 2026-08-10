import assert from "node:assert/strict";
import test from "node:test";

import agentHandler from "../../../../api/agent.ts";
import { resetAgentSecurityStoreForTests } from "../../../../api/_lib/agentSecurityStore.ts";
import { installSharedStateMemoryStoreForTests } from "../../../../api/_lib/sharedStateStore.ts";

const createSharedStateMemoryMock = installSharedStateMemoryStoreForTests;

const withAgentEnvironment = async (run: () => Promise<void>) => {
  const previousToken = process.env.AGENT_API_TOKEN;
  process.env.AGENT_API_TOKEN = "test-household-token-that-is-long-enough";
  resetAgentSecurityStoreForTests();
  try {
    await run();
  } finally {
    if (previousToken === undefined) delete process.env.AGENT_API_TOKEN;
    else process.env.AGENT_API_TOKEN = previousToken;
    resetAgentSecurityStoreForTests();
  }
};

const request = (path: string, init: RequestInit = {}) =>
  agentHandler(new Request(`https://example.com/api/agent/v1/${path}`, init));

test("agent OpenAPI document advertises the versioned contract", async () => {
  const response = await request("openapi.json");
  const document = (await response.json()) as { openapi: string; paths: Record<string, unknown> };

  assert.equal(response.status, 200);
  assert.equal(document.openapi, "3.1.0");
  assert.ok(document.paths["/catalog/{resource}"]);
  assert.ok(document.paths["/actions"]);
});

test("public movie catalog is paginated and strips personal activity", async () => {
  const store = createSharedStateMemoryMock({
    "movielist.json": JSON.stringify([
      {
        id: "movie-1",
        title: "Arrival",
        addedBy: "Aaron",
        watchedBy: ["Aaron"],
        createdAt: "2026-01-01T00:00:00.000Z",
        year: "2016",
        plot: "First contact.",
      },
    ]),
  });

  try {
    const response = await request("catalog/movies?page=1&pageSize=10");
    const body = (await response.json()) as { data: Array<Record<string, unknown>> };
    assert.equal(response.status, 200);
    assert.equal(body.data[0]?.title, "Arrival");
    assert.equal("addedBy" in body.data[0]!, false);
    assert.equal("watchedBy" in body.data[0]!, false);
    assert.equal("createdAt" in body.data[0]!, false);
    assert.match(response.headers.get("cache-control") ?? "", /public/);
  } finally {
    store.dispose();
  }
});

test("anonymous movie suggestions are validated and persisted", async () => {
  await withAgentEnvironment(async () => {
    const store = createSharedStateMemoryMock({ "suggestions.json": "[]" });
    try {
      const response = await request("suggestions/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.4" },
        body: JSON.stringify({ title: "  Moon  ", suggestedBy: "Visitor", reason: "Quiet sci-fi" }),
      });
      assert.equal(response.status, 201);
      const saved = JSON.parse(store.getFile("suggestions.json") ?? "[]") as Array<{ title: string }>;
      assert.equal(saved[0]?.title, "Moon");

      const invalid = await request("suggestions/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.5" },
        body: JSON.stringify({ title: "" }),
      });
      assert.equal(invalid.status, 422);
    } finally {
      store.dispose();
    }
  });
});

test("private state requires a valid bearer token and actor", async () => {
  await withAgentEnvironment(async () => {
    const store = createSharedStateMemoryMock({ "messages.json": "[]" });
    try {
      const missing = await request("private/messages");
      assert.equal(missing.status, 401);

      const valid = await request("private/messages", {
        headers: {
          Authorization: "Bearer test-household-token-that-is-long-enough",
          "X-Electron-Actor": "Aaron",
        },
      });
      assert.equal(valid.status, 200);
      assert.deepEqual((await valid.json() as { data: unknown }).data, []);
      assert.equal(valid.headers.get("cache-control"), "no-store");
    } finally {
      store.dispose();
    }
  });
});

test("destructive actions require an identical single-use confirmation", async () => {
  await withAgentEnvironment(async () => {
    const store = createSharedStateMemoryMock({
      "movielist.json": JSON.stringify([{
        id: "movie-1", title: "Arrival", addedBy: "Aaron", watchedBy: [], createdAt: "2026-01-01T00:00:00.000Z",
      }]),
    });
    const headers = {
      Authorization: "Bearer test-household-token-that-is-long-enough",
      "Content-Type": "application/json",
    };
    const action = { actor: "Aaron", action: "deleteMovie", input: { movieId: "movie-1" } };

    try {
      const preview = await request("actions", { method: "POST", headers, body: JSON.stringify(action) });
      assert.equal(preview.status, 202);
      const previewBody = await preview.json() as { confirmation: { token: string } };

      const changed = await request("actions", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...action, input: { movieId: "different" }, confirmationToken: previewBody.confirmation.token }),
      });
      assert.equal(changed.status, 409);

      const confirmed = await request("actions", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...action, confirmationToken: previewBody.confirmation.token }),
      });
      assert.equal(confirmed.status, 200);
      assert.deepEqual(JSON.parse(store.getFile("movielist.json") ?? "[]"), []);

      const replay = await request("actions", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...action, confirmationToken: previewBody.confirmation.token }),
      });
      assert.equal(replay.status, 409);
    } finally {
      store.dispose();
    }
  });
});
