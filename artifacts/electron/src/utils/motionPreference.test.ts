import test from "node:test";
import assert from "node:assert/strict";
import {
  prefersReducedMotion,
  hasHoverCapability,
  hasFinePointer,
  isChromaSpotlightEnabled,
  subscribeMotionPreferences,
} from "./motionPreference.ts";

test("motionPreference", async (t) => {
  const originalWindow = (global as any).window;

  t.afterEach(() => {
    (global as any).window = originalWindow;
  });

  await t.test("returns false/handles missing window gracefully", () => {
    (global as any).window = undefined;
    assert.equal(prefersReducedMotion(), false);
    assert.equal(hasHoverCapability(), false);
    assert.equal(hasFinePointer(), false);
    assert.equal(isChromaSpotlightEnabled(), false);

    const unsubscribe = subscribeMotionPreferences(() => {});
    assert.doesNotThrow(() => unsubscribe());
  });

  await t.test("evaluates media queries correctly", async (t) => {
    let matchesMocks: Record<string, boolean> = {
      "(prefers-reduced-motion: reduce)": true,
      "(hover: hover)": true,
      "(pointer: fine)": false,
    };

    (global as any).window = {
      matchMedia: (query: string) => ({
        matches: matchesMocks[query] || false,
        addEventListener: () => {},
        removeEventListener: () => {},
      })
    };

    assert.equal(prefersReducedMotion(), true);
    assert.equal(hasHoverCapability(), true);
    assert.equal(hasFinePointer(), false);
    assert.equal(isChromaSpotlightEnabled(), false);

    matchesMocks = {
      "(prefers-reduced-motion: reduce)": false,
      "(hover: hover)": true,
      "(pointer: fine)": true,
    };

    assert.equal(prefersReducedMotion(), false);
    assert.equal(hasHoverCapability(), true);
    assert.equal(hasFinePointer(), true);
    assert.equal(isChromaSpotlightEnabled(), true); // !prefersReducedMotion && hasHover && hasFinePointer
  });

  await t.test("subscribeMotionPreferences tracks listeners", () => {
    const listeners: Record<string, Set<Function>> = {
      "(prefers-reduced-motion: reduce)": new Set(),
      "(hover: hover)": new Set(),
    };

    (global as any).window = {
      matchMedia: (query: string) => ({
        matches: false,
        addEventListener: (event: string, cb: Function) => {
          if (event === "change" && listeners[query]) {
            listeners[query].add(cb);
          }
        },
        removeEventListener: (event: string, cb: Function) => {
          if (event === "change" && listeners[query]) {
            listeners[query].delete(cb);
          }
        },
      })
    };

    let callCount = 0;
    const onChange = () => { callCount++; };

    const unsubscribe = subscribeMotionPreferences(onChange);

    assert.equal(listeners["(prefers-reduced-motion: reduce)"].has(onChange), true);
    assert.equal(listeners["(hover: hover)"].has(onChange), true);

    // Simulate change
    for (const cb of listeners["(prefers-reduced-motion: reduce)"]) {
      cb();
    }
    assert.equal(callCount, 1);

    unsubscribe();

    assert.equal(listeners["(prefers-reduced-motion: reduce)"].has(onChange), false);
    assert.equal(listeners["(hover: hover)"].has(onChange), false);
  });
});
