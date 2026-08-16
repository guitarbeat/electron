import assert from "node:assert/strict";
import test from "node:test";
import { nextPosterClickAction } from "./posterTitleReveal.ts";

test("nextPosterClickAction reveals the title on the first click", () => {
  assert.equal(nextPosterClickAction(false), "reveal-title");
});

test("nextPosterClickAction opens details once the title is already showing", () => {
  assert.equal(nextPosterClickAction(true), "open-details");
});
