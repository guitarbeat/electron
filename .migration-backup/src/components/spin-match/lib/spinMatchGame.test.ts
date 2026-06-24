import assert from "node:assert/strict";
import test from "node:test";

import {
  canSpinFromSubset,
  getSpinSubsetPrompt,
  MIN_SPIN_SUBSET_SIZE,
} from "./spinMatchGame.ts";

test("spinMatchGame subset helpers", async (t) => {
  await t.test("requires at least one kept movie before spinning", () => {
    assert.equal(MIN_SPIN_SUBSET_SIZE, 1);
    assert.equal(canSpinFromSubset(0), false);
    assert.equal(canSpinFromSubset(1), true);
    assert.equal(canSpinFromSubset(3), true);
  });

  await t.test("explains the subset flow clearly", () => {
    assert.equal(
      getSpinSubsetPrompt(0, false),
      "Keep at least one movie to spin a subset.",
    );
    assert.equal(
      getSpinSubsetPrompt(2, false),
      "You can stop rating now. The wheel only uses the movies you kept.",
    );
    assert.equal(
      getSpinSubsetPrompt(4, true),
      "Spin the 4-movie subset you picked.",
    );
  });
});
