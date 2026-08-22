import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateSwipe,
  calculateVelocity,
  filterCandidates,
  SWIPE_THRESHOLD,
  SWIPE_VELOCITY_THRESHOLD
} from "./index.ts";

test("swipeLogic", async (t) => {
  await t.test("evaluateSwipe", async (st) => {
    await st.test("returns keep if finalX > SWIPE_THRESHOLD", () => {
      assert.equal(evaluateSwipe(SWIPE_THRESHOLD + 1, 0), "keep");
    });

    await st.test("returns keep if velocity > SWIPE_VELOCITY_THRESHOLD", () => {
      assert.equal(evaluateSwipe(0, SWIPE_VELOCITY_THRESHOLD + 0.1), "keep");
    });

    await st.test("returns skip if finalX < -SWIPE_THRESHOLD", () => {
      assert.equal(evaluateSwipe(-SWIPE_THRESHOLD - 1, 0), "skip");
    });

    await st.test("returns skip if velocity < -SWIPE_VELOCITY_THRESHOLD", () => {
      assert.equal(evaluateSwipe(0, -SWIPE_VELOCITY_THRESHOLD - 0.1), "skip");
    });

    await st.test("returns none if within thresholds", () => {
      assert.equal(evaluateSwipe(SWIPE_THRESHOLD, SWIPE_VELOCITY_THRESHOLD), "none");
      assert.equal(evaluateSwipe(-SWIPE_THRESHOLD, -SWIPE_VELOCITY_THRESHOLD), "none");
      assert.equal(evaluateSwipe(0, 0), "none");
    });
  });

  await t.test("calculateVelocity", async (st) => {
    await st.test("calculates positive velocity", () => {
      assert.equal(calculateVelocity(100, 50, 200, 100), 50 / 100);
    });

    await st.test("calculates negative velocity", () => {
      assert.equal(calculateVelocity(50, 100, 200, 100), -50 / 100);
    });

    await st.test("returns 0 if lastX is null", () => {
      assert.equal(calculateVelocity(100, null, 200, 100), 0);
    });

    await st.test("returns 0 if lastTime is null", () => {
      assert.equal(calculateVelocity(100, 50, 200, null), 0);
    });

    await st.test("returns 0 if dt is 0", () => {
      assert.equal(calculateVelocity(100, 50, 100, 100), 0);
    });

    await st.test("returns 0 if dt is negative", () => {
      assert.equal(calculateVelocity(100, 50, 100, 200), 0);
    });
  });

  await t.test("filterCandidates", async (st) => {
    await st.test("filters out movies watched by 2 or more people if queue not empty", () => {
      const movies = [
        { watchedBy: ["user1"] },
        { watchedBy: ["user1", "user2"] },
        { watchedBy: [] },
      ];
      const result = filterCandidates(movies);
      assert.deepEqual(result, [
        { watchedBy: ["user1"] },
        { watchedBy: [] },
      ]);
    });

    await st.test("returns all movies if all have been watched by 2 or more people", () => {
      const movies = [
        { watchedBy: ["user1", "user2"] },
        { watchedBy: ["user1", "user3"] },
      ];
      const result = filterCandidates(movies);
      assert.deepEqual(result, movies);
    });

    await st.test("returns empty array if input is empty", () => {
      assert.deepEqual(filterCandidates([]), []);
    });
  });
});
