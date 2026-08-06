import test from "node:test";
import assert from "node:assert/strict";

import {
  clampFloatingControlPosition,
  getDockedFloatingControlPosition,
  getFloatingPanelPosition,
} from "./floatingWorkspacePanelLayout.ts";

const mobileViewport = {
  width: 320,
  height: 700,
  offsetLeft: 0,
  offsetTop: 0,
  insetTop: 0,
  insetRight: 0,
  insetBottom: 0,
  insetLeft: 0,
};

test("docks the workspace control at the bottom-right viewport edge", () => {
  assert.deepEqual(getDockedFloatingControlPosition(mobileViewport), {
    x: 256,
    y: 636,
  });
});

test("clamps a stored workspace-control position inside the current viewport", () => {
  assert.deepEqual(
    clampFloatingControlPosition({ x: 999, y: -100 }, mobileViewport),
    { x: 256, y: 12 },
  );
});

test("keeps the expanded panel fully visible on a 320px viewport", () => {
  const panel = getFloatingPanelPosition(
    { x: 256, y: 636 },
    { width: 294, height: 430 },
    mobileViewport,
  );

  assert.deepEqual(panel, {
    left: 14,
    top: 196,
    placement: "above",
  });
  assert.ok(panel.left >= 12);
  assert.ok(panel.left + 294 <= 308);
  assert.ok(panel.top >= 12);
  assert.ok(panel.top + 430 <= 688);
});

test("places the panel below the control when there is not enough room above", () => {
  assert.deepEqual(
    getFloatingPanelPosition(
      { x: 12, y: 12 },
      { width: 294, height: 430 },
      mobileViewport,
    ),
    { left: 12, top: 74, placement: "below" },
  );
});
