import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { searchTvMazeShows } from "./tvmaze.ts";

const originalFetch = globalThis.fetch;

test("searchTvMazeShows error paths", async (t) => {
  t.afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.restoreAll();
  });

  await t.test("throws wrapped error on generic fetch failure", async () => {
    globalThis.fetch = mock.fn(async () => {
      throw new Error("Network failure");
    });

    await assert.rejects(searchTvMazeShows("test"), (err: Error) => {
      assert.strictEqual(err.message, "TVMaze search failed: Network failure");
      assert.ok(err.cause instanceof Error);
      assert.strictEqual(err.cause.message, "Network failure");
      return true;
    });
  });

  await t.test("throws wrapped error on non-Error failure", async () => {
    globalThis.fetch = mock.fn(async () => {
      throw "String error";
    });

    await assert.rejects(searchTvMazeShows("test"), (err: Error) => {
      assert.strictEqual(err.message, "TVMaze search failed: Unknown error");
      assert.strictEqual(err.cause, "String error");
      return true;
    });
  });

  await t.test("re-throws AbortError without wrapping", async () => {
    globalThis.fetch = mock.fn(async () => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      throw err;
    });

    await assert.rejects(searchTvMazeShows("test"), (err: Error) => {
      assert.strictEqual(err.name, "AbortError");
      assert.strictEqual(err.message, "The operation was aborted");
      return true;
    });
  });

  await t.test("throws error on non-OK response", async () => {
    globalThis.fetch = mock.fn(async () => {
      return new Response(null, { status: 404, statusText: "Not Found" });
    });

    await assert.rejects(searchTvMazeShows("test"), (err: Error) => {
      assert.strictEqual(
        err.message,
        "TVMaze search failed: TVMaze search failed with status 404",
      );
      return true;
    });
  });
});
