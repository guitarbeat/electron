import { test } from "node:test";
import assert from "node:assert/strict";
import { isMostlyOnScreen, spatialScore, type Direction } from "./tvSpatialGeometry.ts";
const rect = (x: number, y: number, w = 100, h = 150) => ({ left: x, top: y, right: x + w, bottom: y + h });
test("directional focus rejects candidates behind the current poster", () => {
  for (const [direction, x, y] of [["ArrowRight", -120, 0], ["ArrowLeft", 120, 0], ["ArrowDown", 0, -180], ["ArrowUp", 0, 180]] as const) {
    assert.equal(spatialScore(rect(0, 0), rect(x, y), direction), Infinity);
  }
});
test("poster rows and columns win over closer diagonal controls", () => {
  assert.ok(spatialScore(rect(0, 0), rect(300, 0), "ArrowRight") < spatialScore(rect(0, 0), rect(80, 160), "ArrowRight"));
  assert.ok(spatialScore(rect(0, 0), rect(0, 400), "ArrowDown") < spatialScore(rect(0, 0), rect(110, 160), "ArrowDown"));
});
test("offscreen rows remain eligible so the grid can scroll", () => {
  const direction: Direction = "ArrowDown";
  assert.ok(Number.isFinite(spatialScore(rect(100, 900), rect(100, 1100), direction)));
});

test("moving-wall posters stay reachable when their center is near the screen edge", () => {
  assert.equal(isMostlyOnScreen(rect(100, -20, 160, 240), 960, 540), true);
  assert.equal(isMostlyOnScreen(rect(100, -180, 160, 240), 960, 540), false);
  assert.equal(isMostlyOnScreen(rect(-200, 100, 160, 240), 960, 540), false);
});
