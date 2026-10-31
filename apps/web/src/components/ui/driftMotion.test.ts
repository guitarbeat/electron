import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldWriteDriftFrame, TV_DRIFT_FRAME_MS } from "./driftMotion.ts";

test("desktop paints every frame", () => {
  assert.equal(shouldWriteDriftFrame(100, 90, 0), true);
});

test("television paints every frame too, so the belt is as smooth as desktop", () => {
  assert.equal(TV_DRIFT_FRAME_MS, 0);
  assert.equal(shouldWriteDriftFrame(26, 10, TV_DRIFT_FRAME_MS), true);
});

test("a capped interval still skips frames until it has elapsed", () => {
  assert.equal(shouldWriteDriftFrame(10, 0, 48), true);
  assert.equal(shouldWriteDriftFrame(40, 10, 48), false);
  assert.equal(shouldWriteDriftFrame(58, 10, 48), true);
});
