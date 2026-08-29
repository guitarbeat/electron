import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMutateHandler } from "./stateEngine.js";
import { buildProfileCookie } from "./session.js";

describe("createMutateHandler - parseMutationRequest error handling", () => {
  it("returns 400 bad request when request body is invalid JSON", async () => {
    const handler = createMutateHandler("movies");
    const mockReq = new Request("http://localhost/api/state/movies");
    const cookieHeader = buildProfileCookie(mockReq, "Aaron").split(";")[0];
    const request = new Request("http://localhost/api/state/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: "{ invalid json",
    });

    const response = await handler(request);
    assert.strictEqual(response.status, 400);

    const body = (await response.json()) as { error: string };
    assert.strictEqual(body.error, "Invalid JSON payload.");
  });

  it("returns 400 bad request when request payload is missing required mutation fields", async () => {
    const handler = createMutateHandler("movies");
    const mockReq = new Request("http://localhost/api/state/movies");
    const cookieHeader = buildProfileCookie(mockReq, "Aaron").split(";")[0];
    const request = new Request("http://localhost/api/state/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({ baseVersion: "1.0" }),
    });

    const response = await handler(request);
    assert.strictEqual(response.status, 400);

    const body = (await response.json()) as { error: string };
    assert.strictEqual(
      body.error,
      "Mutation requests must include baseVersion and op.",
    );
  });
});
