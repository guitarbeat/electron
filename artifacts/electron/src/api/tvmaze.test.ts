import assert from "node:assert/strict";
import test from "node:test";

import handler from "../../../../api/tvmaze.ts";

const ENV_KEYS = ["TVMAZE_API_URL", "VITE_TVMAZE_API_URL"] as const;
const originalFetch = globalThis.fetch;
const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof ENV_KEYS)[number], string | undefined>;

const resetEnv = () => {
  ENV_KEYS.forEach((key) => {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
      return;
    }

    process.env[key] = value;
  });
};

test.after(() => {
  globalThis.fetch = originalFetch;
  resetEnv();
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  resetEnv();
});

test("TVMaze proxy caches identical search requests for one hour", async () => {
  process.env.TVMAZE_API_URL = "https://api.tvmaze.com";

  let callCount = 0;
  globalThis.fetch = async (input) => {
    callCount += 1;
    assert.equal(
      String(input),
      "https://api.tvmaze.com/search/shows?q=Severance",
    );

    return new Response('[{"show":{"name":"Severance"}}]', {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  const firstResponse = await handler(
    new Request("https://example.com/api/tvmaze?mode=search&q=Severance"),
  );
  const secondResponse = await handler(
    new Request("https://example.com/api/tvmaze?mode=search&q=Severance"),
  );

  assert.equal(callCount, 1);
  assert.equal(firstResponse.headers.get("X-Cache"), "MISS");
  assert.equal(secondResponse.headers.get("X-Cache"), "HIT");
  assert.equal(await secondResponse.text(), '[{"show":{"name":"Severance"}}]');
});

test("TVMaze proxy validates the query mode", async () => {
  const response = await handler(
    new Request("https://example.com/api/tvmaze?q=oops"),
  );

  assert.equal(response.status, 400);
  assert.match(await response.text(), /mode=show&id=... or mode=search&q=.../i);
});
