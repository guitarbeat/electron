import assert from "node:assert/strict";
import test from "node:test";
import {
  matchLibraryMovies,
  normalizeLibraryQuery,
  scoreLibraryMatch,
} from "./index.js";

test("normalizeLibraryQuery ignores punctuation, accents, and repeated spaces", () => {
  assert.equal(normalizeLibraryQuery("  WALL·E  "), "wall e");
  assert.equal(normalizeLibraryQuery("Amélie"), "amelie");
});

test("scoreLibraryMatch tolerates common typos and transposed letters", () => {
  assert.ok(scoreLibraryMatch("Interstellar", "interstelar") > 0);
  assert.ok(scoreLibraryMatch("The Godfather", "godfahter") > 0);
  assert.equal(scoreLibraryMatch("Interstellar", "unrelated"), 0);
});

test("matchLibraryMovies keeps exact matches ahead of fuzzy matches", () => {
  const rows = matchLibraryMovies("matrix", [
    { id: "fuzzy", title: "The Matrx", year: "2024" },
    { id: "exact", title: "Matrix", year: "1993" },
  ]);
  assert.deepEqual(
    rows.map((row) => row.selection.kind === "library-movie" && row.selection.movieId),
    ["exact", "fuzzy"],
  );
});
