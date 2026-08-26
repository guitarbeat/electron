import assert from "node:assert/strict";
import test from "node:test";
import {
  movieScrollDeckMax,
  shouldUseMovieScrollDeck,
} from "./movieBrowseLayout.ts";

test("shouldUseMovieScrollDeck caps scroll mode for large lists", async (t) => {
  await t.test("allows scroll for small mobile lists", () => {
    assert.equal(shouldUseMovieScrollDeck(8, "scroll", true), true);
  });

  await t.test("falls back to grid for large mobile lists", () => {
    assert.equal(shouldUseMovieScrollDeck(81, "scroll", true), false);
  });

  await t.test("respects desktop cap separately", () => {
    assert.equal(
      shouldUseMovieScrollDeck(20, "scroll", false),
      true,
    );
    assert.equal(
      shouldUseMovieScrollDeck(30, "scroll", false),
      false,
    );
  });

  await t.test("grid layout never uses scroll deck", () => {
    assert.equal(shouldUseMovieScrollDeck(5, "grid", true), false);
  });
});

test("movieScrollDeckMax", () => {
  assert.equal(movieScrollDeckMax(true), 16);
  assert.equal(movieScrollDeckMax(false), 24);
});
