import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLibraryAutocompleteRows,
  matchLibraryMovies,
  normalizeLibraryQuery,
  scoreLibraryMatch,
} from "./index.js";

test("normalizeLibraryQuery ignores punctuation, accents, and repeated spaces", () => {
  assert.equal(normalizeLibraryQuery("  WALL·E  "), "wall e");
  assert.equal(normalizeLibraryQuery("Amélie"), "amelie");
});

test("autocomplete rows identify whether selection opens or stages an item", () => {
  const rows = buildLibraryAutocompleteRows({
    query: "interstelar",
    movies: [
      { id: "saved", title: "Interstellar", year: "2014" },
    ],
    places: [],
    movieResults: [
      { title: "Interstellar", year: "2014", type: "movie" },
    ],
  });

  assert.equal(rows.find((row) => row.group === "saved")?.actionLabel, "Open");
  assert.equal(rows.find((row) => row.group === "titles")?.actionLabel, "Choose");
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
