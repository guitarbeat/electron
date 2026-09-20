import assert from "node:assert/strict";
import test from "node:test";
import { wikipediaSearchPayloadToMovieResults } from "./index.js";

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
