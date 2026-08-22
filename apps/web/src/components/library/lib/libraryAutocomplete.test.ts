import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLibraryAutocompleteRows,
  scoreLibraryMatch,
  shouldOfferPlaceDraft,
} from "./index.ts";

test("scoreLibraryMatch ranks exact, prefix, then contains", () => {
  assert.equal(scoreLibraryMatch("Heat", "heat"), 3);
  assert.equal(scoreLibraryMatch("Heat", "he"), 2);
  assert.equal(scoreLibraryMatch("The Heat", "heat"), 1);
  assert.equal(scoreLibraryMatch("Heat", "x"), 0);
  assert.equal(scoreLibraryMatch("Heat", "z"), 0);
});

test("buildLibraryAutocompleteRows interleaves saved titles, catalog hits, and a place draft", () => {
  const rows = buildLibraryAutocompleteRows({
    query: "heat",
    movies: [
      { id: "m1", title: "Heat", year: "1995", posterUrl: "p.jpg" },
      { id: "m2", title: "Unrelated", year: "2001" },
    ],
    places: [{ id: "p1", name: "Heat Cafe" }],
    movieResults: [
      {
        title: "The Heat",
        year: "2013",
        imdbID: "tt2404463",
        type: "movie",
        poster: "poster.jpg",
      },
    ],
  });

  assert.deepEqual(
    rows.map((row) => row.id),
    ["saved-movie-m1", "saved-place-p1", "title-tt2404463"],
  );
  assert.equal(rows[0]?.selection.kind, "library-movie");
  assert.equal(rows[1]?.selection.kind, "library-place");
  assert.equal(rows[2]?.selection.kind, "movie-result");
});

test("shouldOfferPlaceDraft skips exact saved places and obvious movie titles with results", () => {
  assert.equal(
    shouldOfferPlaceDraft({
      query: "Lilia",
      savedPlaces: [
        {
          id: "saved-place-1",
          group: "saved",
          title: "Lilia",
          meta: "Saved place",
          selection: { kind: "library-place", placeId: "1", name: "Lilia" },
        },
      ],
      intent: "ambiguous",
      movieResultCount: 0,
    }),
    false,
  );
  assert.equal(
    shouldOfferPlaceDraft({
      query: "Dune (2021)",
      savedPlaces: [],
      intent: "movie",
      movieResultCount: 4,
    }),
    false,
  );
  assert.equal(
    shouldOfferPlaceDraft({
      query: "Joe's Pizza",
      savedPlaces: [],
      intent: "place",
      movieResultCount: 2,
    }),
    true,
  );
});
