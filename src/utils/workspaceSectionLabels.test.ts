import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildWorkspaceStatTiles,
  workspaceSectionLabel,
} from "./workspaceSectionLabels.ts";

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

test("buildWorkspaceStatTiles maps section counts", () => {
  const tiles = buildWorkspaceStatTiles({
    tab: "movies",
    isMobile: false,
    sectionIds: {
      incoming: "movies-section-incoming",
      queue: "movies-section-queue",
      completed: "movies-section-watched",
    },
    counts: { incoming: 2, queue: 5, completed: 3 },
  });

  assert.equal(tiles.length, 3);
  assert.equal(tiles[0]?.count, 2);
  assert.equal(tiles[1]?.label, "Up Next");
  assert.equal(tiles[2]?.sectionId, "movies-section-watched");
});
