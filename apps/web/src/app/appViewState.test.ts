import assert from "node:assert/strict";
import test from "node:test";

import { parseMainTab } from "./appViewState";

test("redirects the retired memories workspace to movies", () => {
  assert.equal(parseMainTab("memories"), "movies");
});

test("redirects the retired places workspace to movies", () => {
  assert.equal(parseMainTab("places"), "movies");
});
