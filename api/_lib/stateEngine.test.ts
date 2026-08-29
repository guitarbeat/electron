import { describe, it } from "node:test";
import assert from "node:assert";
import { createMutateHandler } from "./stateEngine.js";
import { parseMutationRequest } from "./state.js";

describe("stateEngine - parseMutationRequest error handling in createMutateHandler", () => {
  it("returns 400 badRequestResponse when JSON parsing fails in parseMutationRequest", async () => {
    const handler = createMutateHandler("movies");
    const req = new Request("http://localhost/api/state/movies/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ malformed json",
    });

    const response = await handler(req);
    assert.strictEqual(response.status, 400);

    const body = await response.json();
    assert.strictEqual(body.error, "Invalid JSON payload.");
  });

  it("returns 400 badRequestResponse when request payload is missing baseVersion or op", async () => {
    const handler = createMutateHandler("movies");
    const req = new Request("http://localhost/api/state/movies/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: { key: "value" } }),
    });

    const response = await handler(req);
    assert.strictEqual(response.status, 400);

    const body = await response.json();
    assert.strictEqual(body.error, "Mutation requests must include baseVersion and op.");
  });

  it("returns 400 badRequestResponse when request payload is null or not an object", async () => {
    const handler = createMutateHandler("movies");
    const req = new Request("http://localhost/api/state/movies/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(null),
    });

    const response = await handler(req);
    assert.strictEqual(response.status, 400);

    const body = await response.json();
    assert.strictEqual(body.error, "Mutation requests must include baseVersion and op.");
  });

  it("parseMutationRequest helper throws Error for invalid payloads", async () => {
    const invalidJsonReq = new Request("http://localhost/api/state/movies/mutate", {
      method: "POST",
      body: "not json",
    });

    await assert.rejects(
      async () => parseMutationRequest(invalidJsonReq),
      {
        name: "Error",
        message: "Invalid JSON payload.",
      }
    );

    const invalidBodyReq = new Request("http://localhost/api/state/movies/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseVersion: "v1" }), // missing op
    });

    await assert.rejects(
      async () => parseMutationRequest(invalidBodyReq),
      {
        name: "Error",
        message: "Mutation requests must include baseVersion and op.",
      }
    );
  });
});
