import assert from "node:assert/strict";
import test from "node:test";

import handler from "../../api/gist.ts";

const ENV_KEYS = [
  "API_SECRET",
  "GIST_ID",
  "GITHUB_TOKEN",
  "VITE_API_SECRET",
  "VITE_GIST_ID",
  "VITE_GITHUB_TOKEN",
] as const;

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

test("OPTIONS responds with CORS headers for browser preflight", async () => {
  const response = await handler(
    new Request("https://example.com/api/gist", {
      method: "OPTIONS",
      headers: {
        Origin: "https://app.example.com",
        "Access-Control-Request-Headers": "authorization, content-type",
      },
    }),
  );

  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://app.example.com",
  );
  assert.equal(
    response.headers.get("Access-Control-Allow-Headers"),
    "authorization, content-type",
  );
  assert.equal(
    response.headers.get("Access-Control-Allow-Methods"),
    "GET, PATCH, OPTIONS",
  );
  assert.equal(response.headers.get("Allow"), "GET, PATCH, OPTIONS");
});

test("GET forwards upstream gist data and exposes ETag", async () => {
  process.env.GIST_ID = "gist-123";

  globalThis.fetch = async (input, init) => {
    assert.equal(input, "https://api.github.com/gists/gist-123");
    assert.equal(new Headers(init?.headers).get("If-None-Match"), "\"old\"");

    return new Response("{\"files\":{}}", {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        etag: "\"next\"",
      },
    });
  };

  const response = await handler(
    new Request("https://example.com/api/gist", {
      headers: {
        Origin: "https://app.example.com",
        "If-None-Match": "\"old\"",
      },
    }),
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "{\"files\":{}}");
  assert.equal(response.headers.get("ETag"), "\"next\"");
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://app.example.com",
  );
});

test("PATCH forwards writes to GitHub when the API secret matches", async () => {
  process.env.GIST_ID = "gist-123";
  process.env.GITHUB_TOKEN = "github-token";
  process.env.API_SECRET = "client-secret";

  globalThis.fetch = async (input, init) => {
    assert.equal(input, "https://api.github.com/gists/gist-123");

    const headers = new Headers(init?.headers);
    assert.equal(headers.get("Authorization"), "Bearer github-token");
    assert.equal(headers.get("Content-Type"), "application/json");
    assert.equal(init?.method, "PATCH");
    assert.equal(
      init?.body,
      JSON.stringify({
        files: {
          "movies.json": {
            content: "[]",
          },
        },
      }),
    );

    return new Response("{\"ok\":true}", {
      status: 200,
      headers: {
        "content-type": "application/json",
        etag: "\"updated\"",
      },
    });
  };

  const response = await handler(
    new Request("https://example.com/api/gist", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer client-secret",
        "Content-Type": "application/json",
        Origin: "https://app.example.com",
      },
      body: JSON.stringify({
        files: {
          "movies.json": {
            content: "[]",
          },
        },
      }),
    }),
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "{\"ok\":true}");
  assert.equal(response.headers.get("ETag"), "\"updated\"");
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://app.example.com",
  );
});
