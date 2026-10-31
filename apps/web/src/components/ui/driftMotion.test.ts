import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldWriteDriftFrame, TV_DRIFT_FRAME_MS } from "./driftMotion.ts";

test("desktop paints every frame", () => {
  assert.equal(shouldWriteDriftFrame(100, 90, 0), true);
});

test("television paints on the first frame and then at the capped interval", () => {
  assert.equal(shouldWriteDriftFrame(10, 0, TV_DRIFT_FRAME_MS), true);
  assert.equal(shouldWriteDriftFrame(40, 10, TV_DRIFT_FRAME_MS), false);
  assert.equal(shouldWriteDriftFrame(58, 10, TV_DRIFT_FRAME_MS), true);
});
