import assert from "node:assert/strict";
import test from "node:test";

import { searchTvMazeShows } from "./index.ts";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("searchTvMazeShows throws an error on non-ok response", async () => {
  globalThis.fetch = async () => new Response(null, { status: 500 });
  await assert.rejects(
    () => searchTvMazeShows("The Bear"),
    /TVMaze search failed: TVMaze search failed with status 500/,
  );
});

test("searchTvMazeShows returns empty array if data is not an array", async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "Not an array" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  const results = await searchTvMazeShows("The Bear");
  assert.deepEqual(results, []);
});

test("searchTvMazeShows throws an error on network failure", async () => {
  globalThis.fetch = async () => {
    throw new Error("Network failure");
  };
  await assert.rejects(
    () => searchTvMazeShows("The Bear"),
    /TVMaze search failed: Network failure/,
  );
});

test("searchTvMazeShows passes AbortError through without wrapping", async () => {
  globalThis.fetch = async () => {
    const error = new Error("The operation was aborted");
    error.name = "AbortError";
    throw error;
  };
  await assert.rejects(
    () => searchTvMazeShows("The Bear"),
    (error: unknown) =>
      error instanceof Error &&
      error.name === "AbortError" &&
      error.message === "The operation was aborted",
  );
});

test("searchTvMazeShows handles unknown errors in catch block", async () => {
  globalThis.fetch = async () => {
    throw "String error";
  };
  await assert.rejects(
    () => searchTvMazeShows("The Bear"),
    /TVMaze search failed: Unknown error/,
  );
});

test("searchTvMazeShows successfully maps valid data", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify([
        {
          score: 1,
          show: {
            id: 11,
            name: "The Bear",
            premiered: "2022-06-23",
            image: {
              medium: "http://images.example/the-bear.jpg",
              original: "http://images.example/the-bear-large.jpg",
            },
          },
        },
      ]),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  const results = await searchTvMazeShows("The Bear");
  assert.deepEqual(results, [
    {
      imdbID: "tv-11",
      poster: "https://images.example/the-bear.jpg",
      title: "The Bear",
      type: "series",
      year: "2022",
    },
  ]);
});
