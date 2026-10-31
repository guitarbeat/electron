import assert from "node:assert/strict";
import { test } from "node:test";
import { movieWallPlaceholder } from "./movieWallPlaceholder.ts";

test("a failed load is not described as an empty watchlist", () => {
  assert.deepEqual(movieWallPlaceholder({ hasActiveFilters: false, loadFailed: true }), {
    title: "Couldn't load your movies",
    detail: "Check the connection, then try again.",
    action: "retry",
  });
});

test("filters still explain an empty result when the catalog loaded", () => {
  assert.equal(
    movieWallPlaceholder({ hasActiveFilters: true, loadFailed: false }).action,
    "clear",
  );
  assert.equal(
    movieWallPlaceholder({ hasActiveFilters: true, loadFailed: true }).action,
    "clear",
  );
});

test("a real empty catalog invites the first add", () => {
  assert.equal(movieWallPlaceholder({ hasActiveFilters: false, loadFailed: false }).action, "add");
});
