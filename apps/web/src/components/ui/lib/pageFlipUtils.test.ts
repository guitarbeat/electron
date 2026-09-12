import assert from "node:assert";
import { describe, it } from "node:test";
import { getShadowStyle } from "./pageFlipUtils.ts";

describe("getShadowStyle", () => {
  it("returns 'none' when intensity is 0 or negative", () => {
    assert.strictEqual(getShadowStyle(0), "none");
    assert.strictEqual(getShadowStyle(-0.5), "none");
    assert.strictEqual(getShadowStyle(-10), "none");
  });

  it("calculates scaled box shadow for positive intensity", () => {
    // intensity = 0.5
    // offsetX = Math.round(4 * 0.5) = 2
    // offsetY = Math.round(6 * 0.5) = 3
    // blur = Math.round(34 * 0.5) = 17
    // alpha = Math.min(0.75 * 0.5, 1) = 0.375
    assert.strictEqual(getShadowStyle(0.5), "2px 3px 17px rgba(0, 0, 0, 0.375)");

    // intensity = 1.0
    // offsetX = Math.round(4 * 1) = 4
    // offsetY = Math.round(6 * 1) = 6
    // blur = Math.round(34 * 1) = 34
    // alpha = Math.min(0.75 * 1, 1) = 0.75
    assert.strictEqual(getShadowStyle(1), "4px 6px 34px rgba(0, 0, 0, 0.75)");
  });

  it("caps alpha at 1 for large intensity values", () => {
    // intensity = 2.0
    // alpha = Math.min(0.75 * 2, 1) = 1
    assert.strictEqual(getShadowStyle(2), "8px 12px 68px rgba(0, 0, 0, 1)");
  });
});
