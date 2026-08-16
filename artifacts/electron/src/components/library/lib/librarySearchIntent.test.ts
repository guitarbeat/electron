import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyLibraryIntent,
  libraryAlternateKind,
  librarySubmitLabel,
  resolveLibrarySubmitKind,
} from "./librarySearchIntent.ts";

test("classifyLibraryIntent detects place cues", () => {
  assert.equal(classifyLibraryIntent("Joe's Pizza"), "place");
  assert.equal(classifyLibraryIntent("Blue Bottle Coffee"), "place");
  assert.equal(classifyLibraryIntent("Central Park"), "place");
  assert.equal(classifyLibraryIntent("123 Main Street"), "place");
  assert.equal(classifyLibraryIntent("Lilia, Brooklyn"), "place");
});

test("classifyLibraryIntent detects movie cues", () => {
  assert.equal(classifyLibraryIntent("Dune (2021)"), "movie");
  assert.equal(classifyLibraryIntent("Heat 1995"), "movie");
  assert.equal(classifyLibraryIntent("The Bear season 3"), "movie");
  assert.equal(classifyLibraryIntent("some film"), "movie");
});

test("classifyLibraryIntent stays ambiguous without cues", () => {
  assert.equal(classifyLibraryIntent("Dune"), "ambiguous");
  assert.equal(classifyLibraryIntent("Heat"), "ambiguous");
  assert.equal(classifyLibraryIntent(""), "ambiguous");
});

test("classifyLibraryIntent is ambiguous when both movie and place cues appear", () => {
  assert.equal(classifyLibraryIntent("Heat 1995 restaurant"), "ambiguous");
});

test("resolveLibrarySubmitKind honors an explicit selection", () => {
  assert.equal(
    resolveLibrarySubmitKind({
      query: "Heat",
      selection: { kind: "library-movie", movieId: "1", title: "Heat" },
      movieResultCount: 4,
    }),
    "show-movie",
  );
  assert.equal(
    resolveLibrarySubmitKind({
      query: "Lilia",
      selection: { kind: "library-place", placeId: "p1", name: "Lilia" },
      movieResultCount: 0,
    }),
    "show-place",
  );
  assert.equal(
    resolveLibrarySubmitKind({
      query: "Heat",
      selection: {
        kind: "movie-result",
        title: "Heat",
        imdbID: "tt0113277",
        type: "movie",
      },
      movieResultCount: 4,
    }),
    "movie",
  );
  assert.equal(
    resolveLibrarySubmitKind({
      query: "Joe's Pizza",
      selection: { kind: "place-draft", name: "Joe's Pizza" },
      movieResultCount: 1,
    }),
    "place",
  );
});

test("resolveLibrarySubmitKind uses intent then movie results then word count", () => {
  assert.equal(
    resolveLibrarySubmitKind({
      query: "Joe's Pizza",
      selection: null,
      movieResultCount: 3,
    }),
    "place",
  );
  assert.equal(
    resolveLibrarySubmitKind({
      query: "Dune",
      selection: null,
      movieResultCount: 5,
    }),
    "movie",
  );
  assert.equal(
    resolveLibrarySubmitKind({
      query: "secret speakeasy night",
      selection: null,
      movieResultCount: 0,
    }),
    "place",
  );
  assert.equal(
    resolveLibrarySubmitKind({
      query: "Dune",
      selection: null,
      movieResultCount: 0,
    }),
    "movie",
  );
});

test("librarySubmitLabel and alternate kind follow the resolved action", () => {
  assert.equal(librarySubmitLabel("movie", false), "Add movie");
  assert.equal(librarySubmitLabel("place", true), "Suggest place");
  assert.equal(librarySubmitLabel("show-movie", false), "Show");
  assert.equal(libraryAlternateKind("movie"), "place");
  assert.equal(libraryAlternateKind("show-place"), null);
});
