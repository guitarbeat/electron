import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchWikipediaPosterOrSummary,
  wikipediaSearchPayloadToMovieResults,
} from "./index.js";

test("Wikipedia fallback converts corrected result titles into addable movies and shows", () => {
  const results = wikipediaSearchPayloadToMovieResults({
    query: {
      search: [
        { title: "Interstellar (film)" },
        { title: "Dark (TV series)" },
        { title: "Interstellar (soundtrack)" },
      ],
    },
  });

  assert.deepEqual(results, [
    { title: "Interstellar", year: undefined, type: "movie" },
    { title: "Dark", year: undefined, type: "series" },
  ]);
});

test("fetchWikipediaPosterOrSummary fetches poster successfully and respects candidate priority", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request) => {
    const urlStr = url.toString();

    if (urlStr.includes("_(film)")) {
      return new Response(
        JSON.stringify({
          title: "Inception (film)",
          extract: "A movie about dreams",
          originalimage: { source: "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_poster.jpg" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (urlStr.includes("_(2010_film)")) {
      return new Response(
        JSON.stringify({
          title: "Inception (2010 film)",
          extract: "2010 dream movie",
          originalimage: { source: "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_2010.jpg" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ type: "not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  });

  const res = await fetchWikipediaPosterOrSummary("InceptionPriorityTest", "2010");

  assert.ok(res);
  assert.strictEqual(res?.posterUrl, "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_poster.jpg");
  assert.strictEqual(res?.title, "Inception (film)");
});

test("fetchWikipediaPosterOrSummary short-circuits early on first matching candidate without fetching rest", async (t) => {
  let fetchCount = 0;
  const requestedUrls: string[] = [];

  t.mock.method(globalThis, "fetch", async (url: string | URL | Request) => {
    fetchCount++;
    const urlStr = url.toString();
    requestedUrls.push(urlStr);

    if (urlStr.includes("/summary/InceptionFirstCandidate")) {
      return new Response(
        JSON.stringify({
          title: "InceptionFirstCandidate",
          extract: "Match on first try",
          originalimage: { source: "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_first.jpg" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ type: "not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  });

  const res = await fetchWikipediaPosterOrSummary("InceptionFirstCandidate", "2010");

  assert.ok(res);
  assert.strictEqual(res?.posterUrl, "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_first.jpg");
  // Ensure only 1 fetch was made instead of sending requests for all 5 queriesToTry candidates concurrently
  assert.strictEqual(fetchCount, 1);
});

test("fetchWikipediaPosterOrSummary performance benchmark with simulated network delay", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request) => {
    const urlStr = url.toString();
    // Simulate 50ms latency per request
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Only candidate 4 (`InceptionBench (movie)`) matches
    if (urlStr.includes("_(movie)")) {
      return new Response(
        JSON.stringify({
          title: "Inception",
          extract: "Dream thief film",
          originalimage: { source: "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_movie.jpg" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ type: "not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  });

  const startTime = Date.now();
  const res = await fetchWikipediaPosterOrSummary("InceptionBench", "2010");
  const duration = Date.now() - startTime;

  assert.ok(res);
  assert.strictEqual(res?.posterUrl, "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_movie.jpg");
  console.log(`[Benchmark] fetchWikipediaPosterOrSummary latency: ${duration}ms`);
});
