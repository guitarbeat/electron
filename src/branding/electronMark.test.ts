import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ELECTRON_MARK_VARIANT,
  ELECTRON_MARK_META,
  ELECTRON_MARK_VARIANTS,
  getElectronMarkDataUri,
  getElectronMarkSvgMarkup,
} from "./ElectronMarkData.ts";

test("electron marks expose the planned five variants", () => {
  assert.deepEqual(ELECTRON_MARK_VARIANTS, [
    "pulse-ae",
    "orbit-e",
    "orbit-a",
    "static-gem",
    "split-spark",
  ]);
  assert.equal(DEFAULT_ELECTRON_MARK_VARIANT, "pulse-ae");
  assert.equal(ELECTRON_MARK_META["pulse-ae"].recommended, true);
});

test("electron mark svg markup renders accessible color output", () => {
  const markup = getElectronMarkSvgMarkup("orbit-e", { title: "Orbit E" });

  assert.match(markup, /^<svg/);
  assert.match(markup, /role="img"/);
  assert.match(markup, /Orbit E/);
  assert.match(markup, /linearGradient/);
});

test("electron mark svg markup supports monochrome output without gradients", () => {
  const markup = getElectronMarkSvgMarkup("static-gem", {
    monochrome: true,
    palette: { mono: "#111111" },
  });

  assert.ok(!markup.includes("linearGradient"));
  assert.ok(markup.includes("#111111"));
});

test("electron mark data uri wraps encoded svg markup", () => {
  const dataUri = getElectronMarkDataUri("split-spark", {
    title: "Split Spark",
  });

  assert.match(dataUri, /^data:image\/svg\+xml;charset=UTF-8,/);
  assert.ok(dataUri.includes(encodeURIComponent("Split Spark")));
});
