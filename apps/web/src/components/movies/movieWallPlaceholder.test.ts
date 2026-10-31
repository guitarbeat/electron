import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogLoadFailed, movieWallPlaceholder } from "./movieWallPlaceholder.ts";

test("a failed load is not described as an empty watchlist", () => {
  assert.deepEqual(movieWallPlaceholder({ hasActiveFilters: false, loadFailed: true }), {
    title: "Couldn't load your movies",
    detail: "Check the connection, then try again.",
    action: "retry",
  });
});

test("a degraded empty snapshot is a failed load, not an empty watchlist", () => {
  assert.equal(
    catalogLoadFailed({ error: null, degraded: true, movieCount: 0 }),
    true,
  );
  assert.equal(
    movieWallPlaceholder({
      hasActiveFilters: false,
      loadFailed: catalogLoadFailed({ error: null, degraded: true, movieCount: 0 }),
    }).action,
    "retry",
  );
});

test("a degraded snapshot that still has movies keeps the catalog", () => {
  assert.equal(
    catalogLoadFailed({ error: null, degraded: true, movieCount: 4 }),
    false,
  );
});

test("a successful empty list is not a failed load", () => {
  assert.equal(
    catalogLoadFailed({ error: null, degraded: false, movieCount: 0 }),
    false,
  );
});

test("filters still explain an empty result when the catalog loaded", () => {
  assert.equal(
    movieWallPlaceholder({ hasActiveFilters: true, loadFailed: false }).action,
    "clear",
  );
});

test("a failed load wins over an active filter", () => {
  assert.equal(
    movieWallPlaceholder({ hasActiveFilters: true, loadFailed: true }).action,
    "retry",
  );
});

test("a real empty catalog invites the first add", () => {
  assert.equal(movieWallPlaceholder({ hasActiveFilters: false, loadFailed: false }).action, "add");
});
