import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getWorkspaceMeta,
  workspaceSectionLabel,
} from "./workspaceConfig.ts";

test("getWorkspaceMeta returns movie workspace copy", () => {
  const meta = getWorkspaceMeta("movies");

  assert.equal(meta.title, "Movies");
  assert.equal(meta.icon, "film");
  assert.equal("description" in meta, false);
});

test("getWorkspaceMeta returns places workspace copy", () => {
  const meta = getWorkspaceMeta("places");

  assert.equal(meta.title, "Date Ideas");
  assert.equal(meta.icon, "map-pin");
  assert.equal("description" in meta, false);
});

test("workspaceSectionLabel returns desktop movie labels", () => {
  assert.equal(workspaceSectionLabel("movies", "queue", false), "Movies");
  assert.equal(workspaceSectionLabel("movies", "completed", false), "Watched");
});

test("workspaceSectionLabel returns mobile movie labels", () => {
  assert.equal(workspaceSectionLabel("movies", "queue", true), "All");
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
