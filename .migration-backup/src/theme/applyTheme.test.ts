import { test } from "node:test";
import assert from "node:assert/strict";
import { appThemes } from "./themes.ts";

test("movies and places themes define distinct cohesive palettes", () => {
  const movies = appThemes.movies;
  const places = appThemes.places;

  assert.notEqual(movies.semantic.accent, places.semantic.accent);
  assert.notEqual(movies.semantic.background, places.semantic.background);
  assert.equal(
    movies.cssVars["--color-text-primary"],
    movies.semantic.textPrimary,
  );
  assert.equal(places.cssVars["--moire-color-1"], places.moire.color1);
  assert.ok(movies.shell.headerSurface.includes("gradient"));
});
