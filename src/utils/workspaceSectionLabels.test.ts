import { test } from "node:test";
import assert from "node:assert/strict";
import { workspaceSectionLabel } from "./workspaceSectionLabels.ts";

test("workspaceSectionLabel returns desktop movie labels", () => {
  assert.equal(workspaceSectionLabel("movies", "queue", false), "Up Next");
  assert.equal(workspaceSectionLabel("movies", "completed", false), "Watched");
});

test("workspaceSectionLabel returns mobile movie labels", () => {
  assert.equal(workspaceSectionLabel("movies", "queue", true), "Queue");
  assert.equal(workspaceSectionLabel("movies", "completed", true), "Done");
});

test("workspaceSectionLabel returns place-specific queue labels", () => {
  assert.equal(workspaceSectionLabel("places", "queue", false), "To Try");
  assert.equal(workspaceSectionLabel("places", "completed", false), "Visited");
});

test("workspaceSectionLabel shares incoming labels across tabs", () => {
  assert.equal(workspaceSectionLabel("movies", "incoming", false), "Incoming");
  assert.equal(workspaceSectionLabel("places", "incoming", true), "New");
});
